import { describe, expect, it } from 'vitest';
import {
  firmCooldownEligibleAt,
  isSendableReadyProspect,
} from '@/lib/firm-outreach/sendable-ready';
import type { FirmProspect } from '@/lib/firm-outreach/types';

function baseProspect(over: Partial<FirmProspect> = {}): FirmProspect {
  return {
    id: 'fop_test',
    prospectType: 'solicitor',
    firmName: 'Test Firm',
    firmKey: 'test-firm',
    sources: ['laa'],
    status: 'ready_to_send',
    priorityScore: 10,
    sequenceStep: 0,
    campaignId: 'whatsapp_invite_v1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    enrichAttempts: 1,
    email: 'crime@realcriminalfirm.co.uk',
    ...over,
  };
}

describe('isSendableReadyProspect', () => {
  it('accepts ready prospects with firm email', () => {
    expect(isSendableReadyProspect(baseProspect())).toBe(true);
  });

  it('rejects parked firm_cooldown via nextEligibleAt', () => {
    expect(
      isSendableReadyProspect(
        baseProspect({
          nextEligibleAt: new Date(Date.now() + 7 * 86_400_000).toISOString(),
          excludedReason: 'firm_cooldown',
        }),
      ),
    ).toBe(false);
  });

  it('rejects press/junk email domains', () => {
    expect(
      isSendableReadyProspect(baseProspect({ email: 'feedback@thetimes.com' })),
    ).toBe(false);
    expect(
      isSendableReadyProspect(baseProspect({ email: 'crime@telegraph.co.uk' })),
    ).toBe(false);
  });

  it('rejects missing email', () => {
    expect(isSendableReadyProspect(baseProspect({ email: undefined }))).toBe(false);
  });
});

describe('firmCooldownEligibleAt', () => {
  it('adds cooldown days to same-inbox send time', () => {
    const at = firmCooldownEligibleAt('2026-01-01T00:00:00.000Z', 21);
    expect(at.startsWith('2026-01-22')).toBe(true);
  });
});

describe('FIRM_SEND_COOLDOWN_DAYS', () => {
  it('is capped at 21 days', async () => {
    const { FIRM_SEND_COOLDOWN_DAYS } = await import('@/lib/firm-outreach/sendable-ready');
    expect(FIRM_SEND_COOLDOWN_DAYS).toBe(21);
  });
});
