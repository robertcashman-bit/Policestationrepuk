import { describe, expect, it } from 'vitest';
import type { OutreachCapacity } from '@/lib/firm-outreach/capacity';
import { explainZeroAccepted } from '@/lib/firm-outreach/reporting/zero-reason';

function baseCapacity(over: Partial<OutreachCapacity> = {}): OutreachCapacity {
  return {
    workspace: 'repuk',
    campaignId: 'whatsapp_invite_v1',
    label: 'POLICESTATIONREPUK.ORG',
    sendingEnabled: true,
    dryRun: false,
    eligibleUnsent: 0,
    pendingJobs: 0,
    retryScheduledJobs: 0,
    claimedJobs: 0,
    processingJobs: 0,
    providerDailyLimit: 90,
    providerUsedToday: 0,
    providerRemainingToday: 90,
    providerBudgetUnlimited: false,
    configuredDailyLimit: null,
    configuredUsedToday: 0,
    configuredRemainingToday: Number.MAX_SAFE_INTEGER,
    configuredDailyUnlimited: true,
    hourlyLimit: null,
    hourlyUsed: 0,
    hourlyRemaining: null,
    currentBatchCapacity: 50,
    effectiveAvailableCapacity: 0,
    limitingFactor: 'no_eligible_leads',
    limitingDetail: 'No new eligible unsent recipients and no pending/retry jobs.',
    nextResetAt: '2026-08-09T00:00:00.000Z',
    utcDate: '2026-08-08',
    ...over,
  };
}

describe('explainZeroAccepted', () => {
  it('returns null when accepted > 0', () => {
    expect(
      explainZeroAccepted({
        capacity: baseCapacity(),
        attempted: 10,
        accepted: 10,
        suppressed: 0,
      }),
    ).toBeNull();
  });

  it('explains no eligible leads', () => {
    const r = explainZeroAccepted({
      capacity: baseCapacity(),
      attempted: 0,
      accepted: 0,
      suppressed: 0,
    });
    expect(r?.code).toBe('ZERO_REASON_NO_ELIGIBLE_LEADS');
    expect(r?.message).toMatch(/no new eligible unsent recipients/i);
  });

  it('explains provider limit with exact figures', () => {
    const r = explainZeroAccepted({
      capacity: baseCapacity({
        limitingFactor: 'provider_daily_limit',
        providerDailyLimit: 300,
        providerUsedToday: 300,
        providerRemainingToday: 0,
        limitingDetail: 'exhausted',
      }),
      attempted: 0,
      accepted: 0,
      suppressed: 0,
    });
    expect(r?.code).toBe('ZERO_REASON_PROVIDER_LIMIT');
    expect(r?.message).toMatch(/300/);
    expect(r?.message).toMatch(/remaining 0/i);
  });

  it('explains configured daily limit', () => {
    const r = explainZeroAccepted({
      capacity: baseCapacity({
        limitingFactor: 'configured_daily_limit',
        configuredDailyLimit: 100,
        configuredUsedToday: 100,
        configuredDailyUnlimited: false,
      }),
      attempted: 0,
      accepted: 0,
      suppressed: 0,
    });
    expect(r?.code).toBe('ZERO_REASON_CONFIG_LIMIT');
    expect(r?.message).toMatch(/100/);
  });

  it('explains dry-run', () => {
    const r = explainZeroAccepted({
      capacity: baseCapacity({ limitingFactor: 'dry_run', dryRun: true }),
      attempted: 0,
      accepted: 0,
      suppressed: 0,
    });
    expect(r?.code).toBe('ZERO_REASON_DRY_RUN_ENABLED');
  });

  it('explains scheduler failure + autoheal repair', () => {
    const r = explainZeroAccepted({
      capacity: baseCapacity({ limitingFactor: 'none', eligibleUnsent: 5 }),
      attempted: 0,
      accepted: 0,
      suppressed: 0,
      schedulerFailed: true,
      schedulerRepaired: true,
    });
    expect(r?.code).toBe('ZERO_REASON_AUTOHEAL_REPAIRED');
  });

  it('never returns bare "0 emails sent"', () => {
    const r = explainZeroAccepted({
      capacity: baseCapacity({ limitingFactor: 'sending_disabled' }),
      attempted: 0,
      accepted: 0,
      suppressed: 0,
    });
    expect(r?.message).not.toBe('0 emails sent');
    expect(r?.message.length).toBeGreaterThan(20);
  });
});
