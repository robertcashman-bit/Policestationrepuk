import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FIRM_OUTREACH_EMAIL_DISABLED_REASON } from '@/lib/firm-outreach/site-config';

const mockResendSend = vi.fn();

vi.mock('resend', () => ({
  Resend: vi.fn(function ResendMock() {
    return { emails: { send: (...args: unknown[]) => mockResendSend(...args) } };
  }),
}));

vi.mock('@/lib/firm-outreach/outreach/activity-report', () => ({
  buildOutreachActivityReport: vi.fn(async () => {
    throw new Error('digest must not build report when permanently disabled');
  }),
}));

vi.mock('@/lib/firm-outreach/reporting/build-daily-report', () => ({
  buildConsolidatedDailyReport: vi.fn(async () => {
    throw new Error('daily report must not build when permanently disabled');
  }),
}));

vi.mock('@/lib/firm-outreach/job-runs', () => ({
  newJobRunId: () => 'daily_report_off',
  saveJobRun: vi.fn(async () => undefined),
}));

describe('Operator outreach emails permanently off (no Resend)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RESEND_API_KEY = 're_test';
    process.env.FIRM_OUTREACH_DIGEST_EMAIL = 'robertdavidcashman@gmail.com';
    process.env.OUTREACH_ADMIN_EMAIL = 'robertdavidcashman@gmail.com';
  });

  it('sendDailyOutreachDigest returns early without Resend', async () => {
    const { sendDailyOutreachDigest } = await import('@/lib/firm-outreach/outreach/digest-email');
    const result = await sendDailyOutreachDigest({ force: true });
    expect(result.sent).toBe(false);
    expect(result.reason).toBe(FIRM_OUTREACH_EMAIL_DISABLED_REASON);
    expect(mockResendSend).not.toHaveBeenCalled();
  });

  it('sendConsolidatedDailyReport skips without Resend', async () => {
    const { sendConsolidatedDailyReport } = await import(
      '@/lib/firm-outreach/reporting/send-daily-report'
    );
    const result = await sendConsolidatedDailyReport({
      force: true,
      now: new Date('2026-08-28T06:30:00.000Z'),
    });
    expect(result.ok).toBe(true);
    expect(result.skipped).toBe(true);
    expect(result.reason).toBe(FIRM_OUTREACH_EMAIL_DISABLED_REASON);
    expect(mockResendSend).not.toHaveBeenCalled();
  });

  it('sendOutreachApprovalRequestEmail returns early without Resend', async () => {
    const { sendOutreachApprovalRequestEmail } = await import(
      '@/lib/firm-outreach/outreach/approval-request-email'
    );
    const result = await sendOutreachApprovalRequestEmail({ force: true });
    expect(result.sent).toBe(false);
    expect(result.reason).toBe(FIRM_OUTREACH_EMAIL_DISABLED_REASON);
    expect(mockResendSend).not.toHaveBeenCalled();
  });

  it('maybeSendCriticalOutreachAlert never emails', async () => {
    const { maybeSendCriticalOutreachAlert } = await import(
      '@/lib/firm-outreach/reporting/critical-alert'
    );
    const sent = await maybeSendCriticalOutreachAlert({
      faults: [
        {
          code: 'sending_disabled',
          workspace: 'repuk',
          severity: 'critical',
          detail: 'sending disabled',
        },
      ],
      capacities: {
        psa: {
          eligibleUnsent: 1,
          effectiveAvailableCapacity: 0,
          limitingFactor: 'sending_disabled',
        } as never,
        repuk: {
          eligibleUnsent: 1,
          effectiveAvailableCapacity: 0,
          limitingFactor: 'sending_disabled',
        } as never,
      },
      runId: 'autoheal_off',
    });
    expect(sent).toBe(false);
    expect(mockResendSend).not.toHaveBeenCalled();
  });
});
