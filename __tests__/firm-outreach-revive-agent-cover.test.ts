import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FirmProspect } from '@/lib/firm-outreach/types';

describe('reviveAgentCoverKentReady', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('revives Kent send_failed prospects with no successful send', async () => {
    const psa: FirmProspect = {
      id: 'fop_psa_fail',
      prospectType: 'firm',
      firmName: 'Foxes Solicitors',
      firmKey: 'foxes-solicitors',
      sources: ['laa'],
      status: 'excluded',
      excludedReason: 'send_failed',
      priorityScore: 40,
      sequenceStep: 0,
      campaignId: 'agent_cover_kent_v1',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      enrichAttempts: 1,
      email: 'crimlaw@foxessolicitors.co.uk',
      county: 'Kent',
      postcode: 'BR1 1LT',
    };
    const store = new Map<string, FirmProspect>([[psa.id, structuredClone(psa)]]);
    const saveProspect = vi.fn(async (p: FirmProspect) => {
      store.set(p.id, p);
    });

    vi.doMock('@/lib/firm-outreach/storage', () => ({
      listProspectIdsByRecordStatus: vi.fn().mockImplementation(async (status: string, opts?: { campaignId?: string }) => {
        if (opts?.campaignId === 'agent_cover_kent_v1' && status === 'excluded') return [psa.id];
        return [];
      }),
      getProspectsByIds: vi.fn().mockImplementation(async (ids: string[]) => {
        const map = new Map<string, FirmProspect>();
        for (const id of ids) {
          if (store.has(id)) map.set(id, structuredClone(store.get(id)!));
        }
        return map;
      }),
      saveProspect,
      isSuppressed: vi.fn().mockResolvedValue(false),
      listSendsForEmail: vi.fn().mockResolvedValue([]),
    }));

    const { reviveAgentCoverKentReady } = await import(
      '@/lib/firm-outreach/revive-agent-cover-ready'
    );
    const stats = await reviveAgentCoverKentReady();
    expect(stats.revived).toBe(1);
    expect(saveProspect).toHaveBeenCalled();
    const saved = saveProspect.mock.calls[0][0] as FirmProspect;
    expect(saved.status).toBe('ready_to_send');
    expect(saved.excludedReason).toBeUndefined();
  });
});
