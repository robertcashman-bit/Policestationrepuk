import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockClaim = vi.fn();
const mockGetRun = vi.fn();
const mockSaveRun = vi.fn();
const mockMarkSent = vi.fn();
const mockMarkFailed = vi.fn();
const mockBuild = vi.fn();
const mockSaveJobRun = vi.fn();
const mockResendSend = vi.fn();

vi.mock('@/lib/firm-outreach/reporting/daily-report-audit', () => ({
  DAILY_REPORT_TYPE: 'consolidated_0700_london',
  claimDailyReportSlot: (...a: unknown[]) => mockClaim(...a),
  getDailyReportRun: (...a: unknown[]) => mockGetRun(...a),
  saveDailyReportRun: (...a: unknown[]) => mockSaveRun(...a),
  markDailyReportSent: (...a: unknown[]) => mockMarkSent(...a),
  markDailyReportFailed: (...a: unknown[]) => mockMarkFailed(...a),
  hashReportPayload: () => 'hash123',
}));

vi.mock('@/lib/firm-outreach/reporting/build-daily-report', () => ({
  buildConsolidatedDailyReport: (...a: unknown[]) => mockBuild(...a),
}));

vi.mock('@/lib/firm-outreach/job-runs', () => ({
  newJobRunId: () => 'daily_report_test',
  saveJobRun: (...a: unknown[]) => mockSaveJobRun(...a),
}));

vi.mock('resend', () => ({
  Resend: vi.fn(function ResendMock() {
    return { emails: { send: (...a: unknown[]) => mockResendSend(...a) } };
  }),
}));

vi.mock('@/lib/firm-outreach/outreach/from-address', () => ({
  operatorNotifyFromAddress: () => 'PoliceStationRepUK <noreply@policestationrepuk.org>',
}));

import { isLondon0700Hour, previousLondonDate } from '@/lib/firm-outreach/reporting/period';
import { formatDailyReportSubject } from '@/lib/firm-outreach/reporting/format-daily-report';
import { sendConsolidatedDailyReport } from '@/lib/firm-outreach/reporting/send-daily-report';
import type { ConsolidatedDailyReport } from '@/lib/firm-outreach/reporting/build-daily-report';

function sampleReport(over: Partial<ConsolidatedDailyReport> = {}): ConsolidatedDailyReport {
  const baseSection = {
    provider: 'Resend',
    sender: 'x@y.z',
    eligibleRecipientsFound: 10,
    emailsQueued: 2,
    emailsAttempted: 10,
    emailsAcceptedByProvider: 10,
    emailsDelivered: 8,
    temporaryFailures: 0,
    permanentFailures: 0,
    retriesScheduled: 0,
    bounces: 0,
    complaints: 0,
    unsubscribes: 0,
    suppressed: 0,
    duplicateSkips: 0,
    providerAllowance: '90',
    providerUsed: 10,
    providerRemaining: '80',
    nextReset: '2026-08-09T00:00:00.000Z',
    lastSchedulerRun: '2026-08-08T12:00:00.000Z',
    autohealRuns: 2,
    autohealRepairs: ['release_expired_leases:1'],
    outstandingFaults: [] as string[],
    recipients: [
      {
        firmName: 'Alpha LLP',
        email: 'crime@alpha.co.uk',
        providerMessageId: 're_1',
        campaignId: 'whatsapp_invite_v1',
        sentAt: '2026-08-07T10:00:00.000Z',
        workspace: 'repuk' as const,
      },
    ],
    zeroReason: null,
    capacity: {} as ConsolidatedDailyReport['psa']['capacity'],
  };

  return {
    date: '2026-08-07',
    reportingPeriodStart: '2026-08-06T23:00:00.000Z',
    reportingPeriodEnd: '2026-08-07T23:00:00.000Z',
    timezone: 'Europe/London',
    psa: {
      ...baseSection,
      workspace: 'psa',
      label: 'POLICESTATIONAGENT.COM',
      productionUrl: 'https://policestationagent.com',
      status: 'HEALTHY',
      emailsAcceptedByProvider: 0,
      emailsAttempted: 0,
      recipients: [],
      zeroReason: {
        code: 'ZERO_REASON_NO_ELIGIBLE_LEADS',
        message: '0 emails accepted because there were no new eligible unsent recipients.',
      },
    },
    repuk: {
      ...baseSection,
      workspace: 'repuk',
      label: 'POLICESTATIONREPUK.ORG',
      productionUrl: 'https://policestationrepuk.org',
      status: 'HEALTHY',
    },
    totals: {
      eligible: 10,
      attempted: 10,
      accepted: 10,
      delivered: 8,
      failed: 0,
      retrying: 0,
      suppressed: 0,
      overallStatus: 'HEALTHY',
    },
    actionRequired: [],
    ...over,
  };
}

describe('daily report period helpers', () => {
  it('detects London 07:00 hour in winter (GMT)', () => {
    // 2026-01-15 07:30 UTC = 07:30 London (GMT)
    expect(isLondon0700Hour(new Date('2026-01-15T07:30:00.000Z'))).toBe(true);
    expect(isLondon0700Hour(new Date('2026-01-15T08:30:00.000Z'))).toBe(false);
  });

  it('detects London 07:00 hour in summer (BST)', () => {
    // 2026-07-15 06:30 UTC = 07:30 London (BST)
    expect(isLondon0700Hour(new Date('2026-07-15T06:30:00.000Z'))).toBe(true);
    expect(isLondon0700Hour(new Date('2026-07-15T07:30:00.000Z'))).toBe(false);
  });

  it('previousLondonDate is yesterday in London', () => {
    expect(previousLondonDate(new Date('2026-08-08T10:00:00.000Z'))).toBe('2026-08-07');
  });
});

describe('sendConsolidatedDailyReport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RESEND_API_KEY = 're_test';
    process.env.OUTREACH_ADMIN_EMAIL = 'admin@example.com';
    mockClaim.mockResolvedValue(true);
    mockGetRun.mockResolvedValue(null);
    mockSaveRun.mockResolvedValue(undefined);
    mockMarkSent.mockResolvedValue(undefined);
    mockMarkFailed.mockResolvedValue(undefined);
    mockSaveJobRun.mockResolvedValue(undefined);
    mockBuild.mockResolvedValue(sampleReport());
    mockResendSend.mockResolvedValue({ data: { id: 're_daily_1' } });
  });

  it('skips outside 07:00 London unless forced', async () => {
    const result = await sendConsolidatedDailyReport({
      now: new Date('2026-01-15T12:00:00.000Z'),
    });
    expect(result.skipped).toBe(true);
    expect(result.reason).toBe('not_0700_london');
    expect(mockResendSend).not.toHaveBeenCalled();
  });

  it('scenario 1: 10 successful sends reflected in subject + send', async () => {
    mockBuild.mockResolvedValue(
      sampleReport({
        totals: {
          eligible: 10,
          attempted: 10,
          accepted: 10,
          delivered: 10,
          failed: 0,
          retrying: 0,
          suppressed: 0,
          overallStatus: 'HEALTHY',
        },
      }),
    );
    const result = await sendConsolidatedDailyReport({
      now: new Date('2026-01-15T07:05:00.000Z'),
      force: true,
    });
    expect(result.ok).toBe(true);
    expect(result.providerMessageId).toBe('re_daily_1');
    expect(mockResendSend).toHaveBeenCalledOnce();
    const arg = mockResendSend.mock.calls[0][0];
    expect(arg.subject).toContain('Daily Outreach Report');
    expect(arg.html).toContain('POLICESTATIONAGENT.COM');
    expect(arg.html).toContain('POLICESTATIONREPUK.ORG');
  });

  it('scenario 13: second trigger is idempotent', async () => {
    mockGetRun.mockResolvedValue({
      emailStatus: 'sent',
      providerMessageId: 're_daily_1',
      totalAcceptedCount: 10,
    });
    const result = await sendConsolidatedDailyReport({
      now: new Date('2026-01-15T07:10:00.000Z'),
      force: true,
    });
    expect(result.alreadySent).toBe(true);
    expect(mockResendSend).not.toHaveBeenCalled();
  });

  it('scenario 12: failed send marks retrying and can retry same report', async () => {
    mockResendSend.mockRejectedValueOnce(new Error('temporary'));
    const fail = await sendConsolidatedDailyReport({
      now: new Date('2026-01-15T07:05:00.000Z'),
      force: true,
    });
    expect(fail.ok).toBe(false);
    expect(mockMarkFailed).toHaveBeenCalled();

    mockGetRun.mockResolvedValue({
      id: 'drr_x',
      emailStatus: 'retrying',
      createdAt: '2026-01-15T07:05:00.000Z',
      totalAcceptedCount: 10,
    });
    mockResendSend.mockResolvedValueOnce({ data: { id: 're_daily_retry' } });
    const retry = await sendConsolidatedDailyReport({
      now: new Date('2026-01-15T07:20:00.000Z'),
      force: true,
      retryFailed: true,
    });
    expect(retry.ok).toBe(true);
    expect(retry.providerMessageId).toBe('re_daily_retry');
  });

  it('includes precise zero-send explanation for PSA', async () => {
    const report = sampleReport();
    expect(formatDailyReportSubject(report)).toContain('2026-08-07');
    const result = await sendConsolidatedDailyReport({
      now: new Date('2026-01-15T07:05:00.000Z'),
      force: true,
    });
    expect(result.ok).toBe(true);
    const html = mockResendSend.mock.calls[0][0].html as string;
    expect(html).toMatch(/0 emails accepted because there were no new eligible/);
    expect(html).not.toMatch(/>0 emails sent</);
  });
});
