import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FirmOutreachSend } from '@/lib/firm-outreach/types';

const mockListAllSends = vi.fn();
const mockWasMorning = vi.fn();
const mockClaimMorning = vi.fn();
const mockMarkMorning = vi.fn();
const mockResendSend = vi.fn();

vi.mock('@/lib/firm-outreach/storage', () => ({
  listAllSends: (...args: unknown[]) => mockListAllSends(...args),
}));

vi.mock('@/lib/firm-outreach/outreach/daily-digest', () => ({
  outreachDigestDate: () => '2026-07-16',
  previousDigestDate: () => '2026-07-15',
  isMorningDigestSendWindow: () => true,
  wasMorningDigestSent: (...args: unknown[]) => mockWasMorning(...args),
  claimMorningDigest: (...args: unknown[]) => mockClaimMorning(...args),
  markMorningDigestSent: (...args: unknown[]) => mockMarkMorning(...args),
  localDateInTimezone: (date: Date, _tz: string) => date.toISOString().slice(0, 10),
  NOTIFY_TIMEZONE: 'Europe/London',
}));

vi.mock('resend', () => ({
  Resend: vi.fn(function ResendMock() {
    return { emails: { send: (...args: unknown[]) => mockResendSend(...args) } };
  }),
}));

function send(overrides: Partial<FirmOutreachSend> = {}): FirmOutreachSend {
  return {
    id: 'fos_1',
    prospectId: 'fop_1',
    firmName: 'Alpha LLP',
    prospectType: 'firm',
    email: 'crime@alpha.co.uk',
    campaignId: 'whatsapp_invite_v1',
    sequenceStep: 0,
    subject: 'Test',
    status: 'sent',
    createdAt: '2026-07-15T10:00:00.000Z',
    sentAt: '2026-07-15T12:05:00.000Z',
    resendMessageId: 're_msg_1',
    ...overrides,
  };
}

describe('buildMorningOutreachResults', () => {
  it('groups real sends by website with recipient details', async () => {
    const { buildMorningOutreachResults } = await import(
      '@/lib/firm-outreach/outreach/morning-results-email'
    );

    const results = buildMorningOutreachResults(
      [
        send(),
        send({
          id: 'fos_2',
          firmName: 'Beta LLP',
          email: 'info@beta.co.uk',
          campaignId: 'agent_cover_kent_v1',
          sentAt: '2026-07-15T16:30:00.000Z',
          resendMessageId: 're_msg_2',
        }),
        send({ id: 'fos_3', resendMessageId: undefined }),
        send({ id: 'fos_4', sentAt: '2026-07-14T12:00:00.000Z' }),
      ],
      '2026-07-15',
    );

    expect(results.totalSent).toBe(2);
    expect(results.byCampaign.find((b) => b.site === 'policestationrepuk.org')?.count).toBe(1);
    expect(results.byCampaign.find((b) => b.site === 'policestationagent.com')?.count).toBe(1);
    expect(results.byCampaign[1]?.sends[0]?.email).toBe('info@beta.co.uk');
  });
});

describe('sendMorningOutreachResultsEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RESEND_API_KEY = 're_test';
    process.env.FIRM_OUTREACH_DIGEST_EMAIL = 'robertdavidcashman@gmail.com';
    mockWasMorning.mockResolvedValue(false);
    mockClaimMorning.mockResolvedValue(true);
    mockListAllSends.mockResolvedValue([
      send(),
      send({
        id: 'fos_2',
        firmName: 'Beta LLP',
        email: 'info@beta.co.uk',
        campaignId: 'agent_cover_kent_v1',
        sentAt: '2026-07-15T16:30:00.000Z',
        resendMessageId: 're_msg_2',
      }),
    ]);
    mockResendSend.mockResolvedValue({ data: { id: 'msg_1' } });
  });

  it('emails counts, sites, and recipients for yesterday', async () => {
    vi.resetModules();
    const { sendMorningOutreachResultsEmail } = await import(
      '@/lib/firm-outreach/outreach/morning-results-email'
    );

    const result = await sendMorningOutreachResultsEmail({ force: true });
    expect(result.sent).toBe(true);
    expect(result.totalSent).toBe(2);
    expect(result.reportDate).toBe('2026-07-15');

    expect(mockResendSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'robertdavidcashman@gmail.com',
        subject: expect.stringContaining('2 sent on 2026-07-15'),
        html: expect.stringContaining('policestationrepuk.org'),
      }),
    );

    const html = mockResendSend.mock.calls[0]?.[0]?.html as string;
    expect(html).toContain('policestationagent.com');
    expect(html).toContain('crime@alpha.co.uk');
    expect(html).toContain('info@beta.co.uk');
    expect(mockMarkMorning).toHaveBeenCalledWith('2026-07-16');
  });

  it('skips outside the 8am London window unless forced', async () => {
    vi.doMock('@/lib/firm-outreach/outreach/daily-digest', () => ({
      outreachDigestDate: () => '2026-07-16',
      previousDigestDate: () => '2026-07-15',
      isMorningDigestSendWindow: () => false,
      wasMorningDigestSent: vi.fn(),
      claimMorningDigest: vi.fn(),
      markMorningDigestSent: vi.fn(),
      localDateInTimezone: (date: Date) => date.toISOString().slice(0, 10),
      NOTIFY_TIMEZONE: 'Europe/London',
    }));

    vi.resetModules();
    const { sendMorningOutreachResultsEmail } = await import(
      '@/lib/firm-outreach/outreach/morning-results-email'
    );

    const result = await sendMorningOutreachResultsEmail();
    expect(result.sent).toBe(false);
    expect(result.reason).toBe('outside_send_window');
    expect(mockResendSend).not.toHaveBeenCalled();
  });
});

describe('firm-outreach-morning-digest cron', () => {
  const ENV = process.env;

  beforeEach(() => {
    process.env = { ...ENV, CRON_SECRET: 'cron-test-secret' };
  });

  afterEach(() => {
    process.env = { ...ENV };
  });

  it('returns 401 without cron secret', async () => {
    const { GET } = await import('@/app/api/cron/firm-outreach-morning-digest/route');
    const res = await GET(new Request('http://localhost/api/cron/firm-outreach-morning-digest'));
    expect(res.status).toBe(401);
  });
});
