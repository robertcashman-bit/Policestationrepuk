import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FIRM_OUTREACH_EMAIL_DISABLED_REASON } from '@/lib/firm-outreach/site-config';

const mockBuildReport = vi.fn();
const mockGetDailySendCount = vi.fn();
const mockWasSent = vi.fn();
const mockClaimDigest = vi.fn();
const mockMarkSent = vi.fn();
const mockResendSend = vi.fn();

vi.mock('@/lib/firm-outreach/outreach/activity-report', () => ({
  buildOutreachActivityReport: (...args: unknown[]) => mockBuildReport(...args),
}));

vi.mock('@/lib/firm-outreach/storage', () => ({
  getDailySendCount: (...args: unknown[]) => mockGetDailySendCount(...args),
}));

vi.mock('@/lib/firm-outreach/outreach/daily-digest', () => ({
  outreachDigestDate: () => '2026-06-11',
  wasOutreachDigestSent: (...args: unknown[]) => mockWasSent(...args),
  claimOutreachDigest: (...args: unknown[]) => mockClaimDigest(...args),
  markOutreachDigestSent: (...args: unknown[]) => mockMarkSent(...args),
  localDateInTimezone: (date: Date, _tz: string) => date.toISOString().slice(0, 10),
  NOTIFY_TIMEZONE: 'Europe/London',
}));

vi.mock('resend', () => ({
  Resend: vi.fn(function ResendMock() {
    return {
      domains: {
        list: vi.fn().mockResolvedValue({
          data: [{ name: 'policestationrepuk.org', status: 'verified' }],
        }),
      },
      emails: { send: (...args: unknown[]) => mockResendSend(...args) },
    };
  }),
}));

describe('sendDailyOutreachDigest (permanently disabled)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RESEND_API_KEY = 're_test';
    process.env.FIRM_OUTREACH_DIGEST_EMAIL = 'robertdavidcashman@gmail.com';
  });

  it('returns early without Resend even when force=true', async () => {
    const { sendDailyOutreachDigest } = await import('@/lib/firm-outreach/outreach/digest-email');
    const result = await sendDailyOutreachDigest({ force: true });
    expect(result.sent).toBe(false);
    expect(result.reason).toBe(FIRM_OUTREACH_EMAIL_DISABLED_REASON);
    expect(mockResendSend).not.toHaveBeenCalled();
    expect(mockBuildReport).not.toHaveBeenCalled();
  });
});
