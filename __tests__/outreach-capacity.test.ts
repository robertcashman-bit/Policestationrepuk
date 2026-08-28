import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/firm-outreach/site-config', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/firm-outreach/site-config')>();
  return {
    ...actual,
    FIRM_OUTREACH_EMAIL_PERMANENTLY_DISABLED: false,
    SENDABLE_OUTREACH_CAMPAIGN_IDS: ['whatsapp_invite_v1'] as const,
    isFirmOutreachEmailPermanentlyDisabled: () => false,
    isFirmOutreachOperatorMailDisabled: () => false,
    isAgentCoverOutreachDisabled: () => true,
    isOutreachCampaignSendable: (campaignId: string) => campaignId === 'whatsapp_invite_v1',
  };
});


const mockCountJobs = vi.fn();
const mockClaimableForCampaign = vi.fn();
const mockListJobIds = vi.fn();
const mockGetEmailJob = vi.fn();
const mockDailyCount = vi.fn();
const mockResendCount = vi.fn();
const mockQuotaRemaining = vi.fn();
const mockHourly = vi.fn();
const mockSelect = vi.fn();
const mockSendAllowed = vi.fn();

vi.mock('@/lib/firm-outreach/email-jobs/storage', () => ({
  countEmailJobsByStatus: (...a: unknown[]) => mockCountJobs(...a),
  countClaimableJobsForCampaign: (...a: unknown[]) => mockClaimableForCampaign(...a),
  listEmailJobIdsByStatus: (...a: unknown[]) => mockListJobIds(...a),
  getEmailJob: (...a: unknown[]) => mockGetEmailJob(...a),
}));

vi.mock('@/lib/firm-outreach/storage', () => ({
  getDailySendCount: (...a: unknown[]) => mockDailyCount(...a),
  getResendSendCount: (...a: unknown[]) => mockResendCount(...a),
  getGlobalResendQuotaRemaining: (...a: unknown[]) => mockQuotaRemaining(...a),
  getHourlySendCount: (...a: unknown[]) => mockHourly(...a),
  utcHourBucket: () => '2026-08-08T12',
}));

vi.mock('@/lib/firm-outreach/outreach/candidate-selection', () => ({
  selectOutreachCandidates: (...a: unknown[]) => mockSelect(...a),
}));

vi.mock('@/lib/firm-outreach/pause-state', () => ({
  isOutreachSendAllowed: (...a: unknown[]) => mockSendAllowed(...a),
}));

import { getOutreachCapacity } from '@/lib/firm-outreach/capacity';

function emptySelection(over: { readyEligible?: number; followUpEligible?: number } = {}) {
  return {
    candidates: [],
    readyScanned: 0,
    sentScanned: 0,
    readyEligible: over.readyEligible ?? 0,
    followUpEligible: over.followUpEligible ?? 0,
    skippedIndexedSend: 0,
    skippedIdempotentJob: 0,
    firmCooldownSkipped: 0,
    staleReadyToReconcile: [],
    staleFollowUpsToReconcile: [],
    readyIndexWalked: 0,
    selectionTimedOut: false,
  };
}

describe('getOutreachCapacity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.FIRM_OUTREACH_DRY_RUN;
    delete process.env.FIRM_OUTREACH_REQUIRE_APPROVAL;
    process.env.FIRM_OUTREACH_SEND_ENABLED = 'true';
    process.env.FIRM_OUTREACH_PAUSED = 'false';
    process.env.FIRM_OUTREACH_RESEND_DAILY_LIMIT = '100';
    process.env.FIRM_OUTREACH_RESEND_HEADROOM = '10';
    delete process.env.FIRM_OUTREACH_DAILY_CAP;
    delete process.env.FIRM_OUTREACH_HOURLY_CAP;
    mockSendAllowed.mockResolvedValue(true);
    mockCountJobs.mockResolvedValue({ pending: 3, retry_scheduled: 1, claimed: 0, processing: 0 });
    mockClaimableForCampaign.mockResolvedValue(0);
    mockListJobIds.mockResolvedValue([]);
    mockGetEmailJob.mockResolvedValue(null);
    mockDailyCount.mockResolvedValue(0);
    mockResendCount.mockResolvedValue(10);
    mockQuotaRemaining.mockResolvedValue(80);
    mockHourly.mockResolvedValue(0);
    mockSelect.mockResolvedValue(emptySelection({ readyEligible: 2 }));
  });

  it('reports effective capacity from provider remaining and eligible', async () => {
    const cap = await getOutreachCapacity('repuk');
    expect(cap.eligibleUnsent).toBe(2);
    expect(cap.providerRemainingToday).toBe(80);
    expect(cap.effectiveAvailableCapacity).toBeGreaterThan(0);
    expect(cap.limitingFactor).not.toBe('provider_daily_limit');
  });

  it('names provider limit precisely when exhausted', async () => {
    mockQuotaRemaining.mockResolvedValue(0);
    mockResendCount.mockResolvedValue(90);
    const cap = await getOutreachCapacity('repuk');
    expect(cap.effectiveAvailableCapacity).toBe(0);
    expect(cap.limitingFactor).toBe('provider_daily_limit');
    expect(cap.limitingDetail).toMatch(/Remaining: 0/i);
    expect(cap.limitingDetail).not.toBe('Email limit reached.');
  });

  it('detects dry-run as limiting factor', async () => {
    process.env.FIRM_OUTREACH_DRY_RUN = '1';
    const cap = await getOutreachCapacity('repuk');
    expect(cap.limitingFactor).toBe('dry_run');
    expect(cap.effectiveAvailableCapacity).toBe(0);
  });

  it('detects no eligible leads', async () => {
    mockSelect.mockResolvedValue(emptySelection());
    mockCountJobs.mockResolvedValue({ pending: 0, retry_scheduled: 0 });
    const cap = await getOutreachCapacity('repuk');
    expect(cap.limitingFactor).toBe('no_eligible_leads');
  });

  it('marks PSA agent-cover capacity as permanently sending_disabled', async () => {
    mockSelect.mockResolvedValue(emptySelection());
    mockCountJobs.mockResolvedValue({ pending: 0, retry_scheduled: 0 });
    const psa = await getOutreachCapacity('psa');
    expect(psa.sendingEnabled).toBe(false);
    expect(psa.limitingFactor).toBe('sending_disabled');
    expect(psa.limitingDetail).toMatch(/permanently disabled/i);
    expect(psa.effectiveAvailableCapacity).toBe(0);
  });

  it('counts pending jobs only for the requested workspace campaign', async () => {
    mockSelect.mockResolvedValue(emptySelection());
    mockListJobIds.mockImplementation(async (status: string) => {
      if (status === 'pending') return ['job_repuk', 'job_psa'];
      return [];
    });
    mockGetEmailJob.mockImplementation(async (id: string) => {
      if (id === 'job_repuk') {
        return { id, campaignId: 'whatsapp_invite_v1', status: 'pending' };
      }
      if (id === 'job_psa') {
        return { id, campaignId: 'agent_cover_kent_v1', status: 'pending' };
      }
      return null;
    });
    const repuk = await getOutreachCapacity('repuk');
    expect(repuk.pendingJobs).toBe(1);
    expect(repuk.limitingFactor).toBe('pending_jobs_only');
  });

  it('calls getHourlySendCount with campaignId first', async () => {
    await getOutreachCapacity('psa');
    expect(mockHourly).toHaveBeenCalledWith('agent_cover_kent_v1', '2026-08-08T12');
  });

  it('uses the campaign pending zset when sampleJobs is false', async () => {
    mockClaimableForCampaign.mockResolvedValue(4);
    mockCountJobs.mockResolvedValue({ pending: 12, retry_scheduled: 3, claimed: 0, processing: 0 });
    const cap = await getOutreachCapacity('repuk', { sampleJobs: false });
    expect(mockListJobIds).not.toHaveBeenCalled();
    expect(mockClaimableForCampaign).toHaveBeenCalledWith('whatsapp_invite_v1');
    expect(cap.pendingJobs).toBe(4);
    expect(cap.retryScheduledJobs).toBe(0);
  });

  it('does not scan eligibility for permanently-disabled PSA capacity', async () => {
    mockSelect.mockClear();
    const psa = await getOutreachCapacity('psa', { eligibleScanLimit: 400 });
    expect(mockSelect).not.toHaveBeenCalled();
    expect(psa.eligibleUnsent).toBe(0);
    expect(psa.limitingFactor).toBe('sending_disabled');
  });

  it('sums ready + due follow-ups into eligibleUnsent', async () => {
    mockSelect.mockResolvedValue(emptySelection({ readyEligible: 3, followUpEligible: 9 }));
    const cap = await getOutreachCapacity('repuk');
    expect(cap.eligibleUnsent).toBe(12);
  });
});
