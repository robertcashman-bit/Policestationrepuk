import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET, POST } from '@/app/api/outreach/send-approved/route';

const mockTryClaim = vi.fn();
const mockFinalize = vi.fn();
const mockRelease = vi.fn();
const mockRunAll = vi.fn();
const mockBuildReport = vi.fn();
const mockConfirmEmail = vi.fn();
const mockSendAllowed = vi.fn();

vi.mock('@/lib/firm-outreach/outreach/send-approval-token', () => ({
  tryClaimSendApproval: (...args: unknown[]) => mockTryClaim(...args),
  finalizeSendApproval: (...args: unknown[]) => mockFinalize(...args),
  releaseSendApprovalClaim: (...args: unknown[]) => mockRelease(...args),
}));

vi.mock('@/lib/firm-outreach/outreach/run-outreach', () => ({
  runFirmOutreachAllCampaigns: (...args: unknown[]) => mockRunAll(...args),
}));

vi.mock('@/lib/firm-outreach/outreach/activity-report', () => ({
  buildOutreachActivityReport: (...args: unknown[]) => mockBuildReport(...args),
}));

vi.mock('@/lib/firm-outreach/outreach/send-confirmation-email', () => ({
  sendOutreachSendConfirmationEmail: (...args: unknown[]) => mockConfirmEmail(...args),
}));

vi.mock('@/lib/firm-outreach/constants', () => ({
  outreachSendEnabled: () => true,
  outreachEnabled: () => true,
  dailySendCap: () => 150,
  cronSendBatchSize: () => 25,
}));

vi.mock('@/lib/firm-outreach/pause-state', () => ({
  isOutreachSendAllowed: (...args: unknown[]) => mockSendAllowed(...args),
  isOutreachPaused: vi.fn(async () => false),
  getAdminPauseState: vi.fn(async () => null),
}));

const ENV = process.env;

describe('outreach send-approved route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...ENV };
    mockSendAllowed.mockResolvedValue(true);
    mockTryClaim.mockResolvedValue({
      ok: true,
      payload: { action: 'send_batch', date: '2026-06-13', recipient: 'a@b.com', exp: 999, jti: 'j1' },
    });
    mockFinalize.mockResolvedValue(undefined);
    mockRelease.mockResolvedValue(undefined);
    mockRunAll.mockResolvedValue({
      combined: {
        queued: 5,
        sent: 5,
        skipped: 0,
        suppressed: 0,
        errors: 0,
        elapsedMs: 100,
      },
      byCampaign: {
        whatsapp_invite_v1: {
          queued: 3,
          sent: 3,
          skipped: 0,
          suppressed: 0,
          errors: 0,
          elapsedMs: 50,
        },
        agent_cover_kent_v1: {
          queued: 2,
          sent: 2,
          skipped: 0,
          suppressed: 0,
          errors: 0,
          elapsedMs: 50,
        },
      },
    });
    mockBuildReport.mockResolvedValue({
      report: {
        summary: { readyToSend: 115 },
        sends: [
          {
            firmName: 'Alpha',
            email: 'a@alpha.co.uk',
            touchLabel: 'Initial invite',
            sentAt: `${new Date().toISOString().slice(0, 10)}T10:00:00.000Z`,
          },
        ],
      },
    });
    mockConfirmEmail.mockResolvedValue(true);
  });

  afterEach(() => {
    process.env = { ...ENV };
  });

  it('GET returns 405', async () => {
    const res = GET();
    expect(res.status).toBe(405);
  });

  it('POST redirects to result on success', async () => {
    const form = new FormData();
    form.set('approvalRef', '11111111-1111-4111-8111-111111111111');
    const res = await POST(
      new Request('http://localhost/api/outreach/send-approved', {
        method: 'POST',
        body: form,
      }),
    );
    expect(res.status).toBe(303);
    const location = res.headers.get('location') ?? '';
    expect(location).toContain('sent=5');
    expect(location).toContain('psaSent=2');
    expect(mockRunAll).toHaveBeenCalledWith({ limit: 50, maxElapsedMs: 240_000 });
    expect(mockConfirmEmail).toHaveBeenCalledOnce();
    expect(mockFinalize).toHaveBeenCalledOnce();
    expect(mockRelease).not.toHaveBeenCalled();
  });

  it('POST redirects on expired link', async () => {
    mockTryClaim.mockResolvedValue({
      ok: false,
      status: 410,
      error: 'already used',
    });
    const form = new FormData();
    form.set('approvalRef', 'used-jti');
    const res = await POST(
      new Request('http://localhost/api/outreach/send-approved', {
        method: 'POST',
        body: form,
      }),
    );
    expect(res.headers.get('location')).toContain('expired-or-already-used');
    expect(mockRunAll).not.toHaveBeenCalled();
  });

  it('POST releases claim when send fails', async () => {
    mockRunAll.mockRejectedValue(new Error('send boom'));
    const form = new FormData();
    form.set('approvalRef', '11111111-1111-4111-8111-111111111111');
    const res = await POST(
      new Request('http://localhost/api/outreach/send-approved', {
        method: 'POST',
        body: form,
      }),
    );
    expect(res.headers.get('location')).toContain('send-failed');
    expect(mockRelease).toHaveBeenCalledOnce();
    expect(mockFinalize).not.toHaveBeenCalled();
  });

  it('POST redirects when sends are paused', async () => {
    mockSendAllowed.mockResolvedValue(false);
    const form = new FormData();
    form.set('approvalRef', '11111111-1111-4111-8111-111111111111');
    const res = await POST(
      new Request('http://localhost/api/outreach/send-approved', {
        method: 'POST',
        body: form,
      }),
    );
    expect(res.headers.get('location')).toContain('send-disabled');
    expect(mockRunAll).not.toHaveBeenCalled();
    expect(mockRelease).toHaveBeenCalledOnce();
  });
});
