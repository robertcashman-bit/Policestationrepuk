import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockCountJobs = vi.fn();
const mockListJobIds = vi.fn();
const mockGetEmailJob = vi.fn();
const mockDailyCount = vi.fn();
const mockResendCount = vi.fn();
const mockQuotaRemaining = vi.fn();
const mockHourly = vi.fn();
const mockListReady = vi.fn();
const mockSendAllowed = vi.fn();

vi.mock('@/lib/firm-outreach/email-jobs/storage', () => ({
  countEmailJobsByStatus: (...a: unknown[]) => mockCountJobs(...a),
  listEmailJobIdsByStatus: (...a: unknown[]) => mockListJobIds(...a),
  getEmailJob: (...a: unknown[]) => mockGetEmailJob(...a),
}));

vi.mock('@/lib/firm-outreach/storage', () => ({
  getDailySendCount: (...a: unknown[]) => mockDailyCount(...a),
  getResendSendCount: (...a: unknown[]) => mockResendCount(...a),
  getGlobalResendQuotaRemaining: (...a: unknown[]) => mockQuotaRemaining(...a),
  getHourlySendCount: (...a: unknown[]) => mockHourly(...a),
  listProspectsByRecordStatus: (...a: unknown[]) => mockListReady(...a),
  utcHourBucket: () => '2026-08-08T12',
}));

vi.mock('@/lib/firm-outreach/pause-state', () => ({
  isOutreachSendAllowed: (...a: unknown[]) => mockSendAllowed(...a),
}));

import { getOutreachCapacity } from '@/lib/firm-outreach/capacity';

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
    mockListJobIds.mockResolvedValue([]);
    mockGetEmailJob.mockResolvedValue(null);
    mockDailyCount.mockResolvedValue(0);
    mockResendCount.mockResolvedValue(10);
    mockQuotaRemaining.mockResolvedValue(80);
    mockHourly.mockResolvedValue(0);
    mockListReady.mockResolvedValue([
      {
        id: '1',
        campaignId: 'whatsapp_invite_v1',
        status: 'ready_to_send',
        email: 'crime@alpha.co.uk',
        nextEligibleAt: undefined,
      },
      {
        id: '2',
        campaignId: 'whatsapp_invite_v1',
        status: 'ready_to_send',
        email: 'duty@beta.co.uk',
      },
    ]);
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
    const cap = await getOutreachCapacity('psa');
    expect(cap.limitingFactor).toBe('dry_run');
    expect(cap.effectiveAvailableCapacity).toBe(0);
  });

  it('detects no eligible leads', async () => {
    mockListReady.mockResolvedValue([]);
    mockCountJobs.mockResolvedValue({ pending: 0, retry_scheduled: 0 });
    const cap = await getOutreachCapacity('repuk');
    expect(cap.limitingFactor).toBe('no_eligible_leads');
  });

  it('counts pending jobs only for the requested workspace campaign', async () => {
    mockListReady.mockResolvedValue([]);
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
    const psa = await getOutreachCapacity('psa');
    expect(psa.pendingJobs).toBe(1);
    expect(psa.limitingFactor).toBe('pending_jobs_only');
  });

  it('calls getHourlySendCount with campaignId first', async () => {
    await getOutreachCapacity('psa');
    expect(mockHourly).toHaveBeenCalledWith('agent_cover_kent_v1', '2026-08-08T12');
  });
});
