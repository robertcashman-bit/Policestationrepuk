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
});
