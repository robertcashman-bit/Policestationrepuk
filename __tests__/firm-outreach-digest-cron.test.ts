import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockIsCronAuthorized = vi.fn();
const mockRequireApproval = vi.fn();
const mockSendDigest = vi.fn();
const mockSendApproval = vi.fn();

vi.mock('@/lib/cron-auth', () => ({
  isCronAuthorized: (...a: unknown[]) => mockIsCronAuthorized(...a),
}));

vi.mock('@/lib/firm-outreach/constants', () => ({
  outreachRequireApproval: (...a: unknown[]) => mockRequireApproval(...a),
}));

vi.mock('@/lib/firm-outreach/outreach/digest-email', () => ({
  sendDailyOutreachDigest: (...a: unknown[]) => mockSendDigest(...a),
}));

vi.mock('@/lib/firm-outreach/outreach/approval-request-email', () => ({
  sendOutreachApprovalRequestEmail: (...a: unknown[]) => mockSendApproval(...a),
}));

describe('firm-outreach-digest cron', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsCronAuthorized.mockReturnValue(true);
    mockRequireApproval.mockReturnValue(false);
    mockSendDigest.mockResolvedValue({ sent: true, date: '2026-08-20' });
  });

  it('sends the RepUK daily digest (not legacy disabled / not Kent-agent)', async () => {
    const { GET } = await import('@/app/api/cron/firm-outreach-digest/route');
    const res = await GET(new Request('https://policestationrepuk.org/api/cron/firm-outreach-digest'));
    const body = await res.json();
    expect(body.mode).toBe('repuk_daily_digest');
    expect(body.campaignId).toBe('whatsapp_invite_v1');
    expect(mockSendDigest).toHaveBeenCalledOnce();
    expect(mockSendApproval).not.toHaveBeenCalled();
  });

  it('keeps approval reminders when click-to-send is on', async () => {
    mockRequireApproval.mockReturnValue(true);
    mockSendApproval.mockResolvedValue({ sent: true, date: '2026-08-20' });
    const { GET } = await import('@/app/api/cron/firm-outreach-digest/route');
    const res = await GET(new Request('https://policestationrepuk.org/api/cron/firm-outreach-digest'));
    const body = await res.json();
    expect(body.mode).toBe('approval-reminder');
    expect(mockSendDigest).not.toHaveBeenCalled();
  });
});
