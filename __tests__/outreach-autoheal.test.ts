import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockRecover = vi.fn();
const mockRunAll = vi.fn();
const mockBackfill = vi.fn();
const mockSync = vi.fn();
const mockRevive = vi.fn();
const mockCapacities = vi.fn();
const mockSendHealth = vi.fn();
const mockCountJobs = vi.fn();
const mockListJobIds = vi.fn();
const mockGetJob = vi.fn();
const mockLatestRun = vi.fn();
const mockRunLog = vi.fn();
const mockClaimLock = vi.fn();
const mockSaveJobRun = vi.fn();
const mockCritical = vi.fn();

vi.mock('@/lib/firm-outreach/email-jobs/storage', () => ({
  recoverAbandonedEmailJobs: (...a: unknown[]) => mockRecover(...a),
  countEmailJobsByStatus: (...a: unknown[]) => mockCountJobs(...a),
  listEmailJobIdsByStatus: (...a: unknown[]) => mockListJobIds(...a),
  getEmailJob: (...a: unknown[]) => mockGetJob(...a),
}));

vi.mock('@/lib/firm-outreach/outreach/run-outreach', () => ({
  runFirmOutreachAllCampaigns: (...a: unknown[]) => mockRunAll(...a),
}));

vi.mock('@/lib/firm-outreach/backfill-delivery', () => ({
  backfillDeliveryFromResend: (...a: unknown[]) => mockBackfill(...a),
}));

vi.mock('@/lib/firm-outreach/sync-kent-to-agent-cover', () => ({
  syncKentProspectsToAgentCover: (...a: unknown[]) => mockSync(...a),
}));

vi.mock('@/lib/firm-outreach/revive-agent-cover-ready', () => ({
  reviveAgentCoverKentReady: (...a: unknown[]) => mockRevive(...a),
}));

vi.mock('@/lib/firm-outreach/capacity', () => ({
  getAllWorkspacesCapacity: (...a: unknown[]) => mockCapacities(...a),
}));

vi.mock('@/lib/firm-outreach/outreach/from-address', () => ({
  getOutreachSendHealth: (...a: unknown[]) => mockSendHealth(...a),
}));

vi.mock('@/lib/firm-outreach/job-runs', () => ({
  getLatestJobRun: (...a: unknown[]) => mockLatestRun(...a),
  newJobRunId: () => 'autoheal_test',
  saveJobRun: (...a: unknown[]) => mockSaveJobRun(...a),
  listRecentJobRuns: async () => [],
}));

vi.mock('@/lib/firm-outreach/storage', () => ({
  getLatestOutreachRunLog: (...a: unknown[]) => mockRunLog(...a),
  addDomainSuppression: async () => undefined,
}));

vi.mock('@/lib/firm-outreach/run-lock', () => ({
  claimOutreachRunLock: (...a: unknown[]) => mockClaimLock(...a),
}));

vi.mock('@/lib/firm-outreach/reporting/critical-alert', () => ({
  maybeSendCriticalOutreachAlert: (...a: unknown[]) => mockCritical(...a),
}));

import { detectAutohealFaults } from '@/lib/firm-outreach/autoheal/detect';
import { applyAutohealRepairs } from '@/lib/firm-outreach/autoheal/repair';
import { runOutreachAutoheal } from '@/lib/firm-outreach/autoheal/run-autoheal';

function healthyCap(over = {}) {
  return {
    workspace: 'repuk',
    campaignId: 'whatsapp_invite_v1',
    label: 'REPUK',
    sendingEnabled: true,
    dryRun: false,
    eligibleUnsent: 5,
    pendingJobs: 0,
    retryScheduledJobs: 0,
    claimedJobs: 0,
    processingJobs: 0,
    providerDailyLimit: 90,
    providerUsedToday: 10,
    providerRemainingToday: 80,
    providerBudgetUnlimited: false,
    configuredDailyLimit: null,
    configuredUsedToday: 0,
    configuredRemainingToday: 999,
    configuredDailyUnlimited: true,
    hourlyLimit: null,
    hourlyUsed: 0,
    hourlyRemaining: null,
    currentBatchCapacity: 50,
    effectiveAvailableCapacity: 50,
    limitingFactor: 'batch_size',
    limitingDetail: 'ok',
    nextResetAt: '2026-08-09T00:00:00.000Z',
    utcDate: '2026-08-08',
    ...over,
  };
}

describe('autoheal detect + repair', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.FIRM_OUTREACH_DRY_RUN;
    mockCapacities.mockResolvedValue({
      psa: healthyCap({ workspace: 'psa', campaignId: 'agent_cover_kent_v1', eligibleUnsent: 3 }),
      repuk: healthyCap(),
    });
    mockSendHealth.mockResolvedValue({
      resendConfigured: true,
      sendHealthy: true,
      sendBlockers: [],
      campaigns: [],
      verifiedDomains: ['policestationrepuk.org'],
    });
    mockCountJobs.mockResolvedValue({ pending: 0, claimed: 1, processing: 0, retry_scheduled: 0 });
    mockListJobIds.mockImplementation(async (status: string) =>
      status === 'claimed' ? ['job1'] : [],
    );
    mockGetJob.mockResolvedValue({
      id: 'job1',
      status: 'claimed',
      claimExpiresAt: '2020-01-01T00:00:00.000Z',
    });
    mockLatestRun.mockResolvedValue({
      status: 'success',
      finished: new Date(Date.now() - 2 * 60 * 60_000).toISOString(),
      accepted: 0,
      claimed: 0,
    });
    mockRunLog.mockResolvedValue({ failures: [] });
    mockRecover.mockResolvedValue(1);
    mockRunAll.mockResolvedValue({
      combined: { accepted: 2, sent: 2, jobsCreated: 2, jobsClaimed: 2, errors: 0 },
      byCampaign: {},
    });
    mockBackfill.mockResolvedValue({ applied: 0, jobsUpdated: 0 });
    mockSync.mockResolvedValue({ created: 1, updated: 0 });
    mockRevive.mockResolvedValue({ revived: 1 });
    mockClaimLock.mockResolvedValue(true);
    mockSaveJobRun.mockResolvedValue(undefined);
    mockCritical.mockResolvedValue(false);
  });

  it('detects expired leases and queue empty with eligible', async () => {
    const { faults } = await detectAutohealFaults();
    const codes = faults.map((f) => f.code);
    expect(codes).toContain('expired_leases');
    expect(codes).toContain('jobs_stuck_claimed');
    expect(codes).toContain('queue_empty_with_eligible');
    expect(codes).toContain('scheduler_stale');
  });

  it('repairs expired leases and triggers outreach batch', async () => {
    const { faults } = await detectAutohealFaults();
    const repair = await applyAutohealRepairs(faults);
    expect(mockRecover).toHaveBeenCalled();
    expect(repair.repairs.some((r) => r.startsWith('release_expired_leases'))).toBe(true);
    expect(repair.outreachTriggered).toBe(true);
    expect(repair.accepted).toBe(2);
  });

  it('does not resend when manual reconciliation required', async () => {
    mockListJobIds.mockImplementation(async (status: string) => {
      if (status === 'permanently_failed') return ['bad1'];
      if (status === 'claimed') return [];
      return [];
    });
    mockGetJob.mockResolvedValue({
      id: 'bad1',
      status: 'permanently_failed',
      providerMessageId: 're_ambiguous',
    });
    const { faults } = await detectAutohealFaults();
    expect(faults.some((f) => f.code === 'manual_reconciliation_required')).toBe(true);
    const repair = await applyAutohealRepairs(faults.filter((f) => f.code.includes('manual') || f.code.includes('accepted_marked')));
    expect(repair.skipped).toContain('skip_resend_ambiguous_provider_acceptance');
  });

  it('runOutreachAutoheal persists a job run', async () => {
    const result = await runOutreachAutoheal({ triggerOutreach: true });
    expect(result.runId).toBe('autoheal_test');
    expect(mockSaveJobRun).toHaveBeenCalled();
    expect(mockCritical).toHaveBeenCalled();
  });

  it('simulation: worker crash after claim → recover abandoned', async () => {
    mockListJobIds.mockImplementation(async (status: string) =>
      status === 'processing' ? ['stuck'] : [],
    );
    mockGetJob.mockResolvedValue({
      id: 'stuck',
      status: 'processing',
      claimExpiresAt: '2020-01-01T00:00:00.000Z',
      providerMessageId: undefined,
    });
    const { faults } = await detectAutohealFaults();
    expect(faults.some((f) => f.code === 'jobs_stuck_processing')).toBe(true);
    const repair = await applyAutohealRepairs(faults);
    expect(mockRecover).toHaveBeenCalled();
    expect(repair.jobsRecovered).toBe(1);
  });

  it('detects campaign_starved when RepUK has inventory but almost no sends', async () => {
    mockCapacities.mockResolvedValue({
      psa: healthyCap({
        workspace: 'psa',
        campaignId: 'agent_cover_kent_v1',
        eligibleUnsent: 20,
        configuredUsedToday: 46,
        pendingJobs: 5,
      }),
      repuk: healthyCap({
        eligibleUnsent: 378,
        configuredUsedToday: 1,
        pendingJobs: 0,
        effectiveAvailableCapacity: 50,
      }),
    });
    mockLatestRun.mockResolvedValue({
      status: 'success',
      finished: new Date().toISOString(),
      accepted: 1,
      claimed: 1,
    });
    mockListJobIds.mockResolvedValue([]);
    const { faults } = await detectAutohealFaults();
    expect(faults.some((f) => f.code === 'campaign_starved' && f.workspace === 'repuk')).toBe(
      true,
    );
    const repair = await applyAutohealRepairs(faults);
    expect(repair.outreachTriggered).toBe(true);
    expect(mockRunAll).toHaveBeenCalled();
    const call = mockRunAll.mock.calls[0]?.[0] as { campaignIds?: string[] };
    expect(call.campaignIds).toContain('whatsapp_invite_v1');
  });
});
