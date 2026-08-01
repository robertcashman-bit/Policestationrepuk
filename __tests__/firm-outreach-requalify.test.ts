import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { FirmProspect } from '@/lib/firm-outreach/types';

const baseProspect = (): FirmProspect => ({
  id: 'p1',
  firmKey: 'acme',
  firmName: 'Acme Law',
  prospectType: 'firm',
  status: 'ready_to_send',
  sequenceStep: 0,
  sources: ['laa'],
  priorityScore: 10,
  campaignId: 'c',
  enrichAttempts: 1,
  email: '2062d0a4929b45348643784b5cb39c36@sentry.wixpress.com',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
});

describe('requalifyAllProspects', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('downgrades ready_to_send with implausible/junk email', async () => {
    const saveProspect = vi.fn();
    vi.doMock('@/lib/dscc-register-lookup', () => ({
      ensureDsccRegisterCache: vi.fn().mockResolvedValue({ entries: [] }),
    }));
    vi.doMock('@/lib/legal-directory/laa-fetch', () => ({
      readLaaCrimeJson: vi.fn().mockReturnValue([]),
    }));
    vi.doMock('@/lib/firm-outreach/storage', () => ({
      listAllProspectIds: vi.fn().mockResolvedValue(['p1']),
      listProspectIdsByStatus: vi.fn().mockResolvedValue([]),
      listProspectsForFirmKey: vi.fn().mockResolvedValue([]),
      getProspect: vi.fn().mockResolvedValue(structuredClone(baseProspect())),
      saveProspect,
    }));
    vi.doMock('@/lib/firm-outreach/crime-website-verify', () => ({
      websiteIndicatesCrimePractice: vi.fn().mockResolvedValue(false),
    }));

    const { requalifyAllProspects } = await import('@/lib/firm-outreach/requalify-prospects');
    const result = await requalifyAllProspects({ verifyWebsites: false });

    expect(result.junkDemotedFromReady).toBe(1);
    expect(result.downgradedFromReady).toBe(1);
    expect(saveProspect).toHaveBeenCalled();
  });

  it('promotes a qualified discovered prospect with email to ready_to_send', async () => {
    const prospect: FirmProspect = {
      ...baseProspect(),
      id: 'p2',
      status: 'discovered',
      email: 'info@example.co.uk',
      lastEmailAt: undefined,
    };

    const saveProspect = vi.fn();
    vi.doMock('@/lib/dscc-register-lookup', () => ({
      ensureDsccRegisterCache: vi.fn().mockResolvedValue({ entries: [] }),
    }));
    vi.doMock('@/lib/legal-directory/laa-fetch', () => ({
      readLaaCrimeJson: vi.fn().mockReturnValue([]),
    }));
    vi.doMock('@/lib/firm-outreach/storage', () => ({
      listAllProspectIds: vi.fn().mockResolvedValue(['p2']),
      listProspectIdsByStatus: vi.fn().mockResolvedValue([]),
      listProspectsForFirmKey: vi.fn().mockResolvedValue([]),
      getProspect: vi.fn().mockResolvedValue(structuredClone(prospect)),
      saveProspect,
    }));
    vi.doMock('@/lib/firm-outreach/crime-website-verify', () => ({
      websiteIndicatesCrimePractice: vi.fn().mockResolvedValue(false),
    }));

    const { requalifyAllProspects } = await import('@/lib/firm-outreach/requalify-prospects');
    const result = await requalifyAllProspects({ verifyWebsites: false });

    expect(result.promotedToReady).toBe(1);
    expect(saveProspect).toHaveBeenCalled();
    const saved = saveProspect.mock.calls[0][0] as FirmProspect;
    expect(saved.status).toBe('ready_to_send');
  });

  it('downgrades ready_to_send when MX validation fails', async () => {
    const prospect = {
      ...baseProspect(),
      email: 'info@example.co.uk',
    };

    const saveProspect = vi.fn();
    vi.doMock('@/lib/dscc-register-lookup', () => ({
      ensureDsccRegisterCache: vi.fn().mockResolvedValue({ entries: [] }),
    }));
    vi.doMock('@/lib/legal-directory/laa-fetch', () => ({
      readLaaCrimeJson: vi.fn().mockReturnValue([]),
    }));
    vi.doMock('@/lib/firm-outreach/storage', () => ({
      listAllProspectIds: vi.fn().mockResolvedValue(['p1']),
      listProspectIdsByStatus: vi.fn().mockResolvedValue([]),
      listProspectsForFirmKey: vi.fn().mockResolvedValue([]),
      getProspect: vi.fn().mockResolvedValue(structuredClone(prospect)),
      saveProspect,
    }));
    vi.doMock('@/lib/firm-outreach/crime-website-verify', () => ({
      websiteIndicatesCrimePractice: vi.fn().mockResolvedValue(false),
    }));
    vi.doMock('@/lib/firm-outreach/enrichment/validator', async (importOriginal) => {
      const actual = await importOriginal<typeof import('@/lib/firm-outreach/enrichment/validator')>();
      return {
        ...actual,
        validateEmailForSend: vi.fn().mockResolvedValue({ ok: false, reason: 'no_mx' }),
      };
    });

    const { requalifyAllProspects } = await import('@/lib/firm-outreach/requalify-prospects');
    const result = await requalifyAllProspects({ verifyWebsites: false });

    expect(result.mxDowngradedFromReady).toBe(1);
    expect(result.downgradedFromReady).toBe(1);
    expect(saveProspect).toHaveBeenCalled();
  });

  it('restores solicitors excluded as duplicate_firm_ready', async () => {
    const prospect: FirmProspect = {
      ...baseProspect(),
      id: 'p-firm-dup',
      prospectType: 'firm',
      status: 'excluded',
      excludedReason: 'duplicate_firm_ready',
      email: 'alice@acmelaw.co.uk',
      lastEmailAt: undefined,
    };
    const saveProspect = vi.fn();
    vi.doMock('@/lib/dscc-register-lookup', () => ({
      ensureDsccRegisterCache: vi.fn().mockResolvedValue({ entries: [] }),
    }));
    vi.doMock('@/lib/legal-directory/laa-fetch', () => ({
      readLaaCrimeJson: vi.fn().mockReturnValue([]),
    }));
    vi.doMock('@/lib/firm-outreach/storage', () => ({
      listAllProspectIds: vi.fn().mockResolvedValue(['p-firm-dup']),
      listProspectIdsByStatus: vi.fn().mockResolvedValue([]),
      listProspectsForFirmKey: vi.fn().mockResolvedValue([]),
      getProspect: vi.fn().mockResolvedValue(structuredClone(prospect)),
      saveProspect,
    }));
    vi.doMock('@/lib/firm-outreach/crime-website-verify', () => ({
      websiteIndicatesCrimePractice: vi.fn().mockResolvedValue(false),
    }));

    const { requalifyAllProspects } = await import('@/lib/firm-outreach/requalify-prospects');
    const result = await requalifyAllProspects({ verifyWebsites: false });

    expect(result.promotedToReady).toBe(1);
    expect(saveProspect).toHaveBeenCalled();
    const saved = saveProspect.mock.calls[0][0] as FirmProspect;
    expect(saved.status).toBe('ready_to_send');
    expect(saved.excludedReason).toBeUndefined();
  });

  it('keeps multiple solicitors at the same firm ready when emails differ', async () => {
    const alice: FirmProspect = {
      ...baseProspect(),
      id: 'p-alice',
      prospectType: 'firm',
      firmKey: 'acme',
      email: 'alice@acmelaw.co.uk',
      priorityScore: 20,
    };
    const bob: FirmProspect = {
      ...baseProspect(),
      id: 'p-bob',
      prospectType: 'firm',
      firmKey: 'acme',
      email: 'info@acmelaw.co.uk',
      priorityScore: 10,
    };
    const byId: Record<string, FirmProspect> = {
      'p-alice': structuredClone(alice),
      'p-bob': structuredClone(bob),
    };
    const saveProspect = vi.fn(async (p: FirmProspect) => {
      byId[p.id] = p;
    });
    vi.doMock('@/lib/dscc-register-lookup', () => ({
      ensureDsccRegisterCache: vi.fn().mockResolvedValue({ entries: [] }),
    }));
    vi.doMock('@/lib/legal-directory/laa-fetch', () => ({
      readLaaCrimeJson: vi.fn().mockReturnValue([]),
    }));
    vi.doMock('@/lib/firm-outreach/storage', () => ({
      listAllProspectIds: vi.fn().mockResolvedValue(['p-alice', 'p-bob']),
      listProspectIdsByStatus: vi.fn().mockImplementation(async (status: string) =>
        Object.values(byId)
          .filter((p) => p.status === status)
          .map((p) => p.id),
      ),
      listProspectsForFirmKey: vi.fn().mockResolvedValue([alice, bob]),
      getProspect: vi.fn().mockImplementation(async (id: string) => structuredClone(byId[id])),
      saveProspect,
    }));
    vi.doMock('@/lib/firm-outreach/crime-website-verify', () => ({
      websiteIndicatesCrimePractice: vi.fn().mockResolvedValue(false),
    }));
    vi.doMock('@/lib/firm-outreach/enrichment/validator', async (importOriginal) => {
      const actual = await importOriginal<typeof import('@/lib/firm-outreach/enrichment/validator')>();
      return {
        ...actual,
        validateEmailForSend: vi.fn().mockResolvedValue({ ok: true }),
      };
    });

    const { requalifyAllProspects } = await import('@/lib/firm-outreach/requalify-prospects');
    const result = await requalifyAllProspects({ verifyWebsites: false, readyOnly: true });

    expect(result.dedupedFromReady).toBe(0);
    expect(byId['p-alice']!.status).toBe('ready_to_send');
    expect(byId['p-bob']!.status).toBe('ready_to_send');
  });
});
