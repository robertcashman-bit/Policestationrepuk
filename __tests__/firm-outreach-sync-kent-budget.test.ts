import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FirmProspect } from '@/lib/firm-outreach/types';

describe('syncKentProspectsToAgentCover budget', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('does not count already-ready PSA clones toward the create/update limit', async () => {
    const repuk: FirmProspect = {
      id: 'fop_repuk_1',
      prospectType: 'firm',
      firmName: 'Alpha Crime',
      firmKey: 'alpha-crime',
      sources: ['laa'],
      status: 'ready_to_send',
      priorityScore: 50,
      sequenceStep: 0,
      campaignId: 'whatsapp_invite_v1',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      enrichAttempts: 1,
      email: 'crime@alpha.co.uk',
      county: 'Kent',
    };
    const psaExisting: FirmProspect = {
      ...repuk,
      id: 'fop_psa_alpha',
      campaignId: 'agent_cover_kent_v1',
      status: 'ready_to_send',
      excludedReason: undefined,
    };

    const saveProspect = vi.fn();
    vi.doMock('@/lib/firm-outreach/storage', () => ({
      listProspectIdsByRecordStatus: vi.fn().mockImplementation(async (status: string, opts?: { campaignId?: string }) => {
        if (opts?.campaignId === 'whatsapp_invite_v1' && status === 'ready_to_send') {
          return [repuk.id];
        }
        return [];
      }),
      getProspectsByIds: vi.fn().mockResolvedValue(new Map([[repuk.id, structuredClone(repuk)]])),
      getProspect: vi.fn().mockImplementation(async (id: string) => {
        if (id === psaExisting.id || id.includes('alpha')) return structuredClone(psaExisting);
        // sync builds a deterministic PSA id via buildProspectForCampaign — return existing clone for any lookup
        return structuredClone(psaExisting);
      }),
      isDuplicateInitialSend: vi.fn().mockResolvedValue(false),
      isSuppressed: vi.fn().mockResolvedValue(false),
      saveProspect,
    }));
    vi.doMock('@/lib/firm-outreach/merge-prospects', async () => {
      const actual = await vi.importActual<typeof import('@/lib/firm-outreach/merge-prospects')>(
        '@/lib/firm-outreach/merge-prospects',
      );
      return {
        ...actual,
        buildProspectForCampaign: vi.fn().mockReturnValue(structuredClone(psaExisting)),
      };
    });

    const { syncKentProspectsToAgentCover } = await import(
      '@/lib/firm-outreach/sync-kent-to-agent-cover'
    );
    const stats = await syncKentProspectsToAgentCover({ limit: 200 });
    expect(stats.created).toBe(0);
    expect(stats.updated).toBe(0);
    expect(stats.skippedAlreadyReady).toBeGreaterThanOrEqual(1);
    expect(saveProspect).not.toHaveBeenCalled();
    expect(stats.truncated).toBe(false);
  });
});
