import type { OutreachCapacity } from '../capacity';

export type WorkspaceHealthStatus =
  | 'HEALTHY'
  | 'DEGRADED'
  | 'FAILED'
  | 'NO_ELIGIBLE_LEADS'
  | 'LIMIT_REACHED';

export function classifyWorkspaceHealth(input: {
  capacity: OutreachCapacity;
  lastSchedulerOk: boolean;
  lastSchedulerAgeMs: number | null;
  outstandingFaults: string[];
  providerAuthOk: boolean;
  acceptedToday: number;
  temporaryFailures: number;
  pendingBacklog: number;
}): WorkspaceHealthStatus {
  if (!input.providerAuthOk || input.outstandingFaults.some((f) => f.includes('auth'))) {
    return 'FAILED';
  }

  if (
    input.capacity.sendingEnabled &&
    !input.capacity.dryRun &&
    input.capacity.eligibleUnsent > 0 &&
    input.capacity.effectiveAvailableCapacity > 0 &&
    (!input.lastSchedulerOk ||
      (input.lastSchedulerAgeMs != null && input.lastSchedulerAgeMs > 45 * 60_000))
  ) {
    return 'FAILED';
  }

  if (
    input.capacity.limitingFactor === 'provider_daily_limit' ||
    input.capacity.limitingFactor === 'configured_daily_limit' ||
    input.capacity.limitingFactor === 'hourly_limit'
  ) {
    return 'LIMIT_REACHED';
  }

  if (
    input.capacity.limitingFactor === 'no_eligible_leads' ||
    (input.capacity.eligibleUnsent <= 0 &&
      input.capacity.pendingJobs + input.capacity.retryScheduledJobs <= 0 &&
      input.capacity.sendingEnabled)
  ) {
    return 'NO_ELIGIBLE_LEADS';
  }

  if (
    input.capacity.limitingFactor === 'sending_disabled' ||
    input.capacity.limitingFactor === 'dry_run'
  ) {
    return 'FAILED';
  }

  if (
    input.temporaryFailures > 0 ||
    input.pendingBacklog > 50 ||
    input.outstandingFaults.length > 0 ||
    !input.lastSchedulerOk
  ) {
    return 'DEGRADED';
  }

  return 'HEALTHY';
}
