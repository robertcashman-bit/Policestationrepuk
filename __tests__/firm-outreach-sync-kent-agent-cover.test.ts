import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FirmProspect } from '@/lib/firm-outreach/types';

describe('syncKentProspectsToAgentCover', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('clones Kent RepUK prospects with email into PSA once', async () => {
    const repuk: FirmProspect = {
      id: 'fop_repuk',
      prospectType: 'firm',
      firmName: 'Kent Crime LLP',
      firmKey: 'kent-crime-llp',
      sources: ['laa'],
      status: 'ready_to_send',
      priorityScore: 40,
      sequenceStep: 0,
      campaignId: 'whatsapp_invite_v1',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      enrichAttempts: 1,
      email: 'crime@kentcrime.co.uk',
      county: 'Kent',
      postcode: 'TN1 1AA',
    };

    const store = new Map<string, FirmProspect>([[repuk.id, structuredClone(repuk)]]);
    const saveProspect = vi.fn(async (p: FirmProspect) => {
      store.set(p.id, p);
    });

    vi.doMock('@/lib/firm-outreach/storage', () => ({
      listProspectIdsByRecordStatus: vi.fn().mockImplementation(async (status: string) => {
        if (status === 'ready_to_send') return [repuk.id];
        return [];
      }),
      getProspectsByIds: vi.fn().mockImplementation(async (ids: string[]) => {
        const map = new Map<string, FirmProspect>();
        for (const id of ids) {
          if (store.has(id)) map.set(id, structuredClone(store.get(id)!));
        }
        return map;
      }),
      getProspect: vi.fn().mockImplementation(async (id: string) =>
        store.has(id) ? structuredClone(store.get(id)!) : null,
      ),
      saveProspect,
      isSuppressed: vi.fn().mockResolvedValue(false),
      isDuplicateInitialSend: vi.fn().mockResolvedValue(false),
    }));

    const { syncKentProspectsToAgentCover } = await import(
      '@/lib/firm-outreach/sync-kent-to-agent-cover'
    );
    const stats = await syncKentProspectsToAgentCover();
    expect(stats.kentEligible).toBe(1);
    expect(stats.created).toBe(1);
    expect(saveProspect).toHaveBeenCalled();
    const saved = saveProspect.mock.calls[0][0] as FirmProspect;
    expect(saved.campaignId).toBe('agent_cover_kent_v1');
    expect(saved.email).toBe('crime@kentcrime.co.uk');
    expect(saved.status).toBe('ready_to_send');
  });

  it('clones Kent RepUK duplicate_email exclusions into PSA ready', async () => {
    const repuk: FirmProspect = {
      id: 'fop_dup',
      prospectType: 'firm',
      firmName: 'Maidstone Defence',
      firmKey: 'maidstone-defence',
      sources: ['laa'],
      status: 'excluded',
      excludedReason: 'duplicate_email',
      priorityScore: 40,
      sequenceStep: 0,
      campaignId: 'whatsapp_invite_v1',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      enrichAttempts: 1,
      email: 'crime@maidstonedefence.co.uk',
      county: 'Kent',
      postcode: 'ME14 1AA',
    };
    const store = new Map<string, FirmProspect>([[repuk.id, structuredClone(repuk)]]);
    const saveProspect = vi.fn(async (p: FirmProspect) => {
      store.set(p.id, p);
    });
    vi.doMock('@/lib/firm-outreach/storage', () => ({
      listProspectIdsByRecordStatus: vi.fn().mockImplementation(async (status: string) => {
        if (status === 'excluded') return [repuk.id];
        return [];
      }),
      getProspectsByIds: vi.fn().mockImplementation(async (ids: string[]) => {
        const map = new Map<string, FirmProspect>();
        for (const id of ids) {
          if (store.has(id)) map.set(id, structuredClone(store.get(id)!));
        }
        return map;
      }),
      getProspect: vi.fn().mockResolvedValue(null),
      saveProspect,
      isSuppressed: vi.fn().mockResolvedValue(false),
      isDuplicateInitialSend: vi.fn().mockResolvedValue(false),
    }));
    const { syncKentProspectsToAgentCover } = await import(
      '@/lib/firm-outreach/sync-kent-to-agent-cover'
    );
    const stats = await syncKentProspectsToAgentCover();
    expect(stats.kentEligible).toBe(1);
    expect(stats.created).toBe(1);
    const saved = saveProspect.mock.calls[0][0] as FirmProspect;
    expect(saved.campaignId).toBe('agent_cover_kent_v1');
    expect(saved.status).toBe('ready_to_send');
  });

  it('clones nationwide RepUK prospects into PSA (Kent cover offer, any region)', async () => {
    const repuk: FirmProspect = {
      id: 'fop_north',
      prospectType: 'firm',
      firmName: 'Northern LLP',
      firmKey: 'northern-llp',
      sources: ['laa'],
      status: 'ready_to_send',
      priorityScore: 40,
      sequenceStep: 0,
      campaignId: 'whatsapp_invite_v1',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      enrichAttempts: 1,
      email: 'info@northern.co.uk',
      county: 'Greater Manchester',
      postcode: 'M1 1AE',
    };
    const store = new Map<string, FirmProspect>([[repuk.id, structuredClone(repuk)]]);
    const saveProspect = vi.fn(async (p: FirmProspect) => {
      store.set(p.id, p);
    });
    vi.doMock('@/lib/firm-outreach/storage', () => ({
      listProspectIdsByRecordStatus: vi.fn().mockImplementation(async (status: string) => {
        if (status === 'ready_to_send') return [repuk.id];
        return [];
      }),
      getProspectsByIds: vi.fn().mockImplementation(async (ids: string[]) => {
        const map = new Map<string, FirmProspect>();
        for (const id of ids) {
          if (store.has(id)) map.set(id, structuredClone(store.get(id)!));
        }
        return map;
      }),
      getProspect: vi.fn().mockResolvedValue(null),
      saveProspect,
      isSuppressed: vi.fn().mockResolvedValue(false),
      isDuplicateInitialSend: vi.fn().mockResolvedValue(false),
    }));
    const { syncKentProspectsToAgentCover } = await import(
      '@/lib/firm-outreach/sync-kent-to-agent-cover'
    );
    const stats = await syncKentProspectsToAgentCover();
    expect(stats.eligible).toBe(1);
    expect(stats.created).toBe(1);
    const saved = saveProspect.mock.calls[0][0] as FirmProspect;
    expect(saved.campaignId).toBe('agent_cover_kent_v1');
    expect(saved.email).toBe('info@northern.co.uk');
    expect(saved.status).toBe('ready_to_send');
  });
});
