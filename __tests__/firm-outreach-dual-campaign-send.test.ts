import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AGENT_COVER_KENT_CAMPAIGN_ID } from '@/lib/firm-outreach/campaign-scope';
import {
  FIRM_OUTREACH_CAMPAIGN_ID,
  OUTREACH_CAMPAIGN_IDS,
} from '@/lib/firm-outreach/site-config';
import { psaSendReserve } from '@/lib/firm-outreach/send-quota-split';

const mockRunFirmOutreach = vi.fn();
const mockClaimLock = vi.fn();
const mockGetGlobalQuota = vi.fn();
const mockListReadyIds = vi.fn();
const mockCountByStatus = vi.fn();
const mockDigest = vi.fn();
const mockNotifyFailure = vi.fn();
const mockSendHealth = vi.fn();

vi.mock('@/lib/firm-outreach/outreach/run-outreach', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/firm-outreach/outreach/run-outreach')>();
  return {
    ...actual,
    runFirmOutreach: (...args: unknown[]) => mockRunFirmOutreach(...args),
    runFirmOutreachAllCampaigns: async (opts?: {
      dryRun?: boolean;
      limit?: number;
      maxElapsedMs?: number;
      campaignIds?: readonly string[];
    }) => {
      const campaignIds = opts?.campaignIds ?? OUTREACH_CAMPAIGN_IDS;
      const byCampaign: Record<string, unknown> = {};
      for (const campaignId of campaignIds) {
        byCampaign[campaignId] = await mockRunFirmOutreach({
          campaignId,
          dryRun: opts?.dryRun,
          limit: opts?.limit,
          maxElapsedMs: opts?.maxElapsedMs,
        });
      }
      return {
        byCampaign,
        combined: actual.mergeOutreachRunStats(
          ...(Object.values(byCampaign) as Parameters<typeof actual.mergeOutreachRunStats>),
        ),
      };
    },
  };
});
vi.mock('@/lib/firm-outreach/run-lock', () => ({
  claimOutreachRunLock: (...args: unknown[]) => mockClaimLock(...args),
}));
vi.mock('@/lib/firm-outreach/storage', () => ({
  countProspectsByStatus: (...args: unknown[]) => mockCountByStatus(...args),
  getGlobalResendQuotaRemaining: (...args: unknown[]) => mockGetGlobalQuota(...args),
  listProspectIdsByRecordStatus: (...args: unknown[]) => mockListReadyIds(...args),
}));
vi.mock('@/lib/firm-outreach/outreach/digest-email', () => ({
  sendDailyOutreachDigest: (...args: unknown[]) => mockDigest(...args),
}));
vi.mock('@/lib/firm-outreach/outreach/send-failure-email', () => ({
  maybeNotifyOutreachSendFailure: (...args: unknown[]) => mockNotifyFailure(...args),
}));
vi.mock('@/lib/firm-outreach/outreach/from-address', () => ({
  getOutreachSendHealth: (...args: unknown[]) => mockSendHealth(...args),
}));
vi.mock('@/lib/firm-outreach/cleanup-non-firm-emails', () => ({
  cleanupNonFirmProspectEmails: vi.fn(async () => ({ reset: 0, targets: [] })),
}));
vi.mock('@/lib/firm-outreach/discovery/run-discovery', () => ({
  runFirmDiscovery: vi.fn(async () => ({
    laaRows: 0,
    dsccFirms: 0,
    dsccSolicitors: 0,
    archiveRows: 0,
    directoryRows: 0,
    created: 0,
    updated: 0,
    excluded: 0,
    elapsedMs: 0,
  })),
}));
vi.mock('@/lib/firm-outreach/sync-kent-to-agent-cover', () => ({
  syncKentProspectsToAgentCover: vi.fn(async () => ({
    scanned: 0,
    kentEligible: 0,
    created: 0,
    updated: 0,
    skippedNoEmail: 0,
    skippedSuppressed: 0,
    skippedDuplicate: 0,
    skippedExistingSent: 0,
    skippedAlreadyReady: 0,
    dryRun: false,
  })),
}));
vi.mock('@/lib/firm-outreach/enrichment/run-enrich', () => ({
  runFirmEnrichment: vi.fn(async () => ({
    processed: 0,
    emailsFound: 0,
    readyToSend: 0,
    noEmail: 0,
    errors: 0,
    elapsedMs: 0,
  })),
}));
vi.mock('@/lib/firm-outreach/requalify-prospects', () => ({
  requalifyAllProspects: vi.fn(async () => ({
    scanned: 0,
    downgradedFromReady: 0,
    reconciledFromReady: 0,
    mxDowngradedFromReady: 0,
    promotedToReady: 0,
    heldForReview: 0,
    websiteVerified: 0,
    stillReady: 0,
    dedupedFromReady: 0,
    junkDemotedFromReady: 0,
    cooldownParked: 0,
    sendableReady: 0,
    samples: [],
  })),
}));
vi.mock('@/lib/legal-directory/laa-fetch', () => ({
  fetchLaaCrimeProviders: vi.fn(async () => ({
    refreshed: false,
    source: 'cache',
    records: [],
  })),
}));
vi.mock('@/lib/dscc-register-lookup', () => ({
  ensureDsccRegisterCache: vi.fn(async () => ({ count: 0, syncedAt: null })),
}));
vi.mock('@/lib/firm-outreach/constants', async () => {
  const actual = await vi.importActual<typeof import('@/lib/firm-outreach/constants')>(
    '@/lib/firm-outreach/constants',
  );
  return {
    ...actual,
    outreachEnabled: () => true,
    outreachSendEnabled: () => true,
  };
});

describe('psaSendReserve', () => {
  const ENV = process.env;

  beforeEach(() => {
    process.env = { ...ENV };
    delete process.env.FIRM_OUTREACH_PSA_DAILY_RESERVE;
  });

  afterEach(() => {
    process.env = ENV;
  });

  it('reserves a PSA floor from shared remaining quota', () => {
    expect(psaSendReserve({ globalRemaining: 40, psaReadyCount: 18 })).toEqual({
      psaLimit: 10,
      repukLimit: 30,
    });
  });

  it('gives all remaining slots to PSA when pool is tiny', () => {
    expect(psaSendReserve({ globalRemaining: 2, psaReadyCount: 18 })).toEqual({
      psaLimit: 2,
      repukLimit: 0,
    });
  });

  it('gives full pool to RepUK when PSA ready is empty', () => {
    expect(psaSendReserve({ globalRemaining: 40, psaReadyCount: 0 })).toEqual({
      psaLimit: 0,
      repukLimit: 40,
    });
  });

  it('honours FIRM_OUTREACH_PSA_DAILY_RESERVE', () => {
    process.env.FIRM_OUTREACH_PSA_DAILY_RESERVE = '3';
    expect(psaSendReserve({ globalRemaining: 40, psaReadyCount: 18 })).toEqual({
      psaLimit: 3,
      repukLimit: 37,
    });
  });
});

describe('runFirmOutreachPipeline dual-campaign send', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClaimLock.mockResolvedValue(true);
    mockGetGlobalQuota.mockResolvedValue(40);
    mockListReadyIds.mockResolvedValue(Array.from({ length: 18 }, (_, i) => `psa-${i}`));
    mockCountByStatus.mockResolvedValue({ ready_to_send: 200 });
    mockDigest.mockResolvedValue({ sent: false, date: '2026-07-23' });
    mockNotifyFailure.mockResolvedValue(undefined);
    mockSendHealth.mockResolvedValue({
      sendHealthy: true,
      sendBlockers: [],
      campaigns: [],
      resendConfigured: true,
      verifiedDomains: ['policestationrepuk.org'],
    });
    mockRunFirmOutreach.mockImplementation(async (opts?: { campaignId?: string }) => ({
      queued: 0,
      sent: opts?.campaignId === AGENT_COVER_KENT_CAMPAIGN_ID ? 5 : 20,
      skipped: 0,
      suppressed: 0,
      errors: 0,
      elapsedMs: 10,
    }));
  });

  it('invokes runFirmOutreach for both PSA and RepUK campaign IDs', async () => {
    const { runFirmOutreachPipeline } = await import('@/lib/firm-outreach/run-pipeline');
    const result = await runFirmOutreachPipeline({
      skipDiscovery: true,
      skipEnrich: true,
      skipDigest: true,
      skipCleanup: true,
      skipCounts: true,
      sendLimit: 25,
    });

    expect(mockRunFirmOutreach).toHaveBeenCalled();
    const campaignIds = mockRunFirmOutreach.mock.calls.map(
      (c) => (c[0] as { campaignId?: string }).campaignId,
    );
    expect(campaignIds).toContain(AGENT_COVER_KENT_CAMPAIGN_ID);
    expect(campaignIds).toContain(FIRM_OUTREACH_CAMPAIGN_ID);

    // PSA first (daily reserve / Kent cover priority)
    expect(campaignIds[0]).toBe(AGENT_COVER_KENT_CAMPAIGN_ID);
    expect(result.agentCoverSend?.sent).toBe(5);
    // `send` is the combined stats across both campaigns
    expect(result.send.sent).toBe(25);
  });
});
