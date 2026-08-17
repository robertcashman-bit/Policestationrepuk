import { describe, expect, it } from 'vitest';
import type { OutreachCapacity } from '@/lib/firm-outreach/capacity';
import { classifyWorkspaceHealth } from '@/lib/firm-outreach/reporting/health-status';

function cap(over: Partial<OutreachCapacity> = {}): OutreachCapacity {
  return {
    workspace: 'psa',
    campaignId: 'agent_cover_kent_v1',
    label: 'PSA',
    sendingEnabled: true,
    dryRun: false,
    eligibleUnsent: 10,
    pendingJobs: 2,
    retryScheduledJobs: 0,
    claimedJobs: 0,
    processingJobs: 0,
    providerDailyLimit: 90,
    providerUsedToday: 10,
    providerRemainingToday: 80,
    providerBudgetUnlimited: false,
    configuredDailyLimit: null,
    configuredUsedToday: 0,
    configuredRemainingToday: 999,
    configuredDailyUnlimited: true,
    hourlyLimit: null,
    hourlyUsed: 0,
    hourlyRemaining: null,
    currentBatchCapacity: 50,
    effectiveAvailableCapacity: 50,
    limitingFactor: 'batch_size',
    limitingDetail: 'ok',
    nextResetAt: '2026-08-09T00:00:00.000Z',
    utcDate: '2026-08-08',
    ...over,
  };
}

describe('classifyWorkspaceHealth', () => {
  it('HEALTHY when scheduler ok and capacity available', () => {
    expect(
      classifyWorkspaceHealth({
        capacity: cap(),
        lastSchedulerOk: true,
        lastSchedulerAgeMs: 5 * 60_000,
        outstandingFaults: [],
        providerAuthOk: true,
        acceptedToday: 3,
        temporaryFailures: 0,
        pendingBacklog: 2,
      }),
    ).toBe('HEALTHY');
  });

  it('NO_ELIGIBLE_LEADS is not a failure', () => {
    expect(
      classifyWorkspaceHealth({
        capacity: cap({
          eligibleUnsent: 0,
          pendingJobs: 0,
          retryScheduledJobs: 0,
          limitingFactor: 'no_eligible_leads',
          effectiveAvailableCapacity: 0,
        }),
        lastSchedulerOk: true,
        lastSchedulerAgeMs: 5 * 60_000,
        outstandingFaults: [],
        providerAuthOk: true,
        acceptedToday: 0,
        temporaryFailures: 0,
        pendingBacklog: 0,
      }),
    ).toBe('NO_ELIGIBLE_LEADS');
  });

  it('LIMIT_REACHED only for verified hard limits', () => {
    expect(
      classifyWorkspaceHealth({
        capacity: cap({
          limitingFactor: 'provider_daily_limit',
          effectiveAvailableCapacity: 0,
          providerRemainingToday: 0,
        }),
        lastSchedulerOk: true,
        lastSchedulerAgeMs: 5 * 60_000,
        outstandingFaults: [],
        providerAuthOk: true,
        acceptedToday: 90,
        temporaryFailures: 0,
        pendingBacklog: 5,
      }),
    ).toBe('LIMIT_REACHED');
  });

  it('is not FAILED when the reporting period already accepted sends', () => {
    expect(
      classifyWorkspaceHealth({
        capacity: cap(),
        lastSchedulerOk: false,
        lastSchedulerAgeMs: 2 * 60 * 60_000,
        outstandingFaults: [],
        providerAuthOk: true,
        acceptedToday: 217,
        temporaryFailures: 0,
        pendingBacklog: 5,
      }),
    ).toBe('DEGRADED');
  });

  it('FAILED when eligible exist but scheduler stale', () => {
    expect(
      classifyWorkspaceHealth({
        capacity: cap(),
        lastSchedulerOk: false,
        lastSchedulerAgeMs: 2 * 60 * 60_000,
        outstandingFaults: [],
        providerAuthOk: true,
        acceptedToday: 0,
        temporaryFailures: 0,
        pendingBacklog: 5,
      }),
    ).toBe('FAILED');
  });

  it('DEGRADED with temporary failures', () => {
    expect(
      classifyWorkspaceHealth({
        capacity: cap(),
        lastSchedulerOk: true,
        lastSchedulerAgeMs: 5 * 60_000,
        outstandingFaults: [],
        providerAuthOk: true,
        acceptedToday: 1,
        temporaryFailures: 4,
        pendingBacklog: 10,
      }),
    ).toBe('DEGRADED');
  });

  it('DEGRADED when a campaign is starved despite eligible inventory', () => {
    expect(
      classifyWorkspaceHealth({
        capacity: cap({
          workspace: 'repuk',
          campaignId: 'whatsapp_invite_v1',
          eligibleUnsent: 378,
          pendingJobs: 1,
          configuredUsedToday: 1,
        }),
        lastSchedulerOk: true,
        lastSchedulerAgeMs: 5 * 60_000,
        outstandingFaults: [],
        providerAuthOk: true,
        acceptedToday: 1,
        temporaryFailures: 0,
        pendingBacklog: 1,
      }),
    ).toBe('DEGRADED');
  });
});
