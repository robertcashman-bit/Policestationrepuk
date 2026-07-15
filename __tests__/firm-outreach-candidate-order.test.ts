import { describe, expect, it } from 'vitest';
import { orderProspectsForSendQueue } from '@/lib/firm-outreach/outreach/candidate-order';
import { nextOutreachStep } from '@/lib/firm-outreach/outreach/sequence';
import type { FirmProspect } from '@/lib/firm-outreach/types';

function prospect(overrides: Partial<FirmProspect>): FirmProspect {
  return {
    id: 'p1',
    firmKey: 'firm-1',
    firmName: 'Firm 1',
    prospectType: 'firm',
    status: 'ready_to_send',
    sequenceStep: 0,
    campaignId: 'whatsapp_invite_v1',
    priorityScore: 10,
    sources: [],
    enrichAttempts: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('nextOutreachStep', () => {
  it('returns 0 for fresh ready_to_send', () => {
    expect(nextOutreachStep(prospect({}))).toBe(0);
  });

  it('returns null for ready_to_send that already emailed (stale-ready)', () => {
    expect(
      nextOutreachStep(
        prospect({ lastEmailAt: '2026-07-01T00:00:00.000Z', status: 'ready_to_send' }),
      ),
    ).toBeNull();
  });

  it('returns 1 for sent step-0 due for follow-up', () => {
    const now = Date.parse('2026-07-15T16:00:00.000Z');
    expect(
      nextOutreachStep(
        prospect({
          status: 'sent',
          sequenceStep: 0,
          lastEmailAt: '2026-07-08T12:00:00.000Z',
        }),
        now,
      ),
    ).toBe(1);
  });
});

describe('orderProspectsForSendQueue', () => {
  it('places due prospects ahead of higher-score no_step rows before any slice', () => {
    const deadWeight = Array.from({ length: 130 }, (_, i) =>
      prospect({
        id: `dead-${i}`,
        firmKey: `dead-${i}`,
        // Already emailed → no next step, but high score
        status: 'ready_to_send',
        lastEmailAt: '2026-06-01T00:00:00.000Z',
        priorityScore: 900,
        email: `dead${i}@example.com`,
      }),
    );
    const due = prospect({
      id: 'due-1',
      firmKey: 'due-1',
      status: 'sent',
      sequenceStep: 0,
      lastEmailAt: '2026-07-08T00:00:00.000Z',
      priorityScore: 1,
      email: 'due@example.com',
    });

    const ordered = orderProspectsForSendQueue([...deadWeight, due], Date.parse('2026-07-15T16:00:00.000Z'));
    // Cron used to scan ~125 after truncating the raw index; due must survive that window.
    const first125 = ordered.slice(0, 125);
    expect(first125.some((p) => p.id === 'due-1')).toBe(true);
    expect(ordered[0]?.id).toBe('due-1');
  });
});
