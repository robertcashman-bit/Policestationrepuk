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
    vi.doMock('@/lib/firm-outreach/email-jobs/storage', () => ({
      getEmailJobByIdempotencyKey: vi.fn().mockResolvedValue(null),
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

  it('does not revive when a terminal accepted PSA job already exists', async () => {
    const psa: FirmProspect = {
      id: 'fop_psa_ready_loop',
      prospectType: 'firm',
      firmName: 'Loop Solicitors',
      firmKey: 'loop-solicitors',
      sources: ['laa'],
      status: 'excluded',
      excludedReason: 'duplicate_email',
      priorityScore: 40,
      sequenceStep: 0,
      campaignId: 'agent_cover_kent_v1',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      enrichAttempts: 1,
      email: 'info@loopsolicitors.co.uk',
      county: 'Kent',
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
    vi.doMock('@/lib/firm-outreach/email-jobs/storage', () => ({
      getEmailJobByIdempotencyKey: vi.fn().mockResolvedValue({
        id: 'job_1',
        status: 'accepted',
        campaignId: 'agent_cover_kent_v1',
        acceptedAt: '2026-08-01T12:00:00.000Z',
        updatedAt: '2026-08-01T12:00:00.000Z',
      }),
    }));

    const { reviveAgentCoverKentReady } = await import(
      '@/lib/firm-outreach/revive-agent-cover-ready'
    );
    const stats = await reviveAgentCoverKentReady();
    expect(stats.revived).toBe(0);
    expect(stats.skippedTerminalJob).toBe(1);
    expect(saveProspect).toHaveBeenCalled();
    const saved = saveProspect.mock.calls[0][0] as FirmProspect;
    expect(saved.status).toBe('sent');
  });
});
