import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockListSends = vi.fn(async () => [] as unknown[]);
const mockSuppressed = vi.fn(async () => false);

vi.mock('@/lib/firm-outreach/storage', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/firm-outreach/storage')>();
  return {
    ...actual,
    isSuppressed: (...args: unknown[]) => mockSuppressed(...args),
    listSendsForEmail: (...args: unknown[]) => mockListSends(...args),
  };
});

import { outreachEmailSendBlocker } from '@/lib/firm-outreach/outreach/send-gates';

describe('outreachEmailSendBlocker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListSends.mockResolvedValue([]);
    mockSuppressed.mockResolvedValue(false);
  });

  it('uses a single indexed send lookup without a full-table scan', async () => {
    const blocked = await outreachEmailSendBlocker({
      email: 'info@firm.co.uk',
      prospectId: 'fop_a',
      campaignId: 'whatsapp_invite_v1',
      step: 0,
      emailsSentThisRun: new Set(),
      today: '2026-08-14',
    });
    expect(blocked).toBeNull();
    expect(mockListSends).toHaveBeenCalledTimes(1);
    expect(mockListSends).toHaveBeenCalledWith('info@firm.co.uk');
    expect(mockListSends.mock.calls[0][1]).toBeUndefined();
  });

  it('blocks a same-day accepted send from the indexed history', async () => {
    mockListSends.mockResolvedValue([
      {
        id: 'fos_1',
        prospectId: 'fop_other',
        email: 'info@firm.co.uk',
        sequenceStep: 1,
        status: 'sent',
        sentAt: '2026-08-14T08:00:00.000Z',
        createdAt: '2026-08-14T08:00:00.000Z',
      },
    ]);
    await expect(
      outreachEmailSendBlocker({
        email: 'info@firm.co.uk',
        prospectId: 'fop_a',
        campaignId: 'whatsapp_invite_v1',
        step: 0,
        emailsSentThisRun: new Set(),
        today: '2026-08-14',
      }),
    ).resolves.toBe('duplicate');
  });

  /**
   * Live 2026-08-21 failure mode: digest showed 482 RepUK sendable / 0 sent.
   * Candidate selection was campaign-scoped (PR #13) but the live send gate still
   * treated historical agent_cover_kent_v1 initials as duplicates — every enqueue
   * skipped, queue never drained.
   */
  it('does not treat PSA Kent initial history as a RepUK duplicate (482-ready/0-sent gate)', async () => {
    mockListSends.mockResolvedValue([
      {
        id: 'fos_psa',
        prospectId: 'fop_psa',
        email: 'crime@firm.co.uk',
        campaignId: 'agent_cover_kent_v1',
        sequenceStep: 0,
        status: 'sent',
        sentAt: '2026-08-10T12:00:00.000Z',
        createdAt: '2026-08-10T12:00:00.000Z',
      },
    ]);
    await expect(
      outreachEmailSendBlocker({
        email: 'crime@firm.co.uk',
        prospectId: 'fop_repuk',
        campaignId: 'whatsapp_invite_v1',
        step: 0,
        emailsSentThisRun: new Set(),
        today: '2026-08-21',
      }),
    ).resolves.toBeNull();
  });

  it('still blocks same-campaign initial duplicates for RepUK', async () => {
    mockListSends.mockResolvedValue([
      {
        id: 'fos_repuk',
        prospectId: 'fop_other',
        email: 'crime@firm.co.uk',
        campaignId: 'whatsapp_invite_v1',
        sequenceStep: 0,
        status: 'sent',
        sentAt: '2026-08-10T12:00:00.000Z',
        createdAt: '2026-08-10T12:00:00.000Z',
      },
    ]);
    await expect(
      outreachEmailSendBlocker({
        email: 'crime@firm.co.uk',
        prospectId: 'fop_repuk',
        campaignId: 'whatsapp_invite_v1',
        step: 0,
        emailsSentThisRun: new Set(),
        today: '2026-08-21',
      }),
    ).resolves.toBe('duplicate');
  });
});
