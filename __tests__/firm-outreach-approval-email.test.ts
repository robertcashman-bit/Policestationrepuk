import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FIRM_OUTREACH_EMAIL_DISABLED_REASON } from '@/lib/firm-outreach/site-config';

const mockIssueToken = vi.fn();
const mockWasSent = vi.fn();
const mockMarkSent = vi.fn();
const mockBuildReport = vi.fn();
const mockGetDailySendCount = vi.fn();
const mockResendSend = vi.fn();

vi.mock('@/lib/firm-outreach/outreach/send-approval-token', () => ({
  issueSendApprovalToken: (...args: unknown[]) => mockIssueToken(...args),
  wasOutreachApprovalEmailSent: (...args: unknown[]) => mockWasSent(...args),
  markOutreachApprovalEmailSent: (...args: unknown[]) => mockMarkSent(...args),
  outreachApprovalDate: () => '2026-06-13',
}));

vi.mock('@/lib/firm-outreach/outreach/activity-report', () => ({
  buildOutreachActivityReport: (...args: unknown[]) => mockBuildReport(...args),
}));

vi.mock('@/lib/firm-outreach/storage', () => ({
  getDailySendCount: (...args: unknown[]) => mockGetDailySendCount(...args),
}));

vi.mock('resend', () => ({
  Resend: vi.fn(function ResendMock() {
    return { emails: { send: (...args: unknown[]) => mockResendSend(...args) } };
  }),
}));

describe('sendOutreachApprovalRequestEmail (permanently disabled)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RESEND_API_KEY = 're_test';
    process.env.FIRM_OUTREACH_DIGEST_EMAIL = 'robertdavidcashman@gmail.com';
  });

  it('never sends approval email', async () => {
    const { sendOutreachApprovalRequestEmail } = await import(
      '@/lib/firm-outreach/outreach/approval-request-email'
    );
    const result = await sendOutreachApprovalRequestEmail({ force: true });
    expect(result.sent).toBe(false);
    expect(result.reason).toBe(FIRM_OUTREACH_EMAIL_DISABLED_REASON);
    expect(mockResendSend).not.toHaveBeenCalled();
  });
});

describe('sendOutreachSendConfirmationEmail (permanently disabled)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RESEND_API_KEY = 're_test';
  });

  it('returns false without Resend', async () => {
    const { sendOutreachSendConfirmationEmail } = await import(
      '@/lib/firm-outreach/outreach/send-confirmation-email'
    );
    const ok = await sendOutreachSendConfirmationEmail({
      stats: { queued: 0, sent: 1, skipped: 0, suppressed: 0, errors: 0, elapsedMs: 1 },
      receipts: [],
      readyRemaining: 0,
    });
    expect(ok).toBe(false);
    expect(mockResendSend).not.toHaveBeenCalled();
  });
});
