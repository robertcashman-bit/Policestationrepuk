/**
 * Precise classifications when accepted count is zero.
 * Never report bare "0 emails sent".
 */
import type { OutreachCapacity, OutreachLimitingFactor } from '../capacity';

export type ZeroSendReasonCode =
  | 'ZERO_REASON_NO_ELIGIBLE_LEADS'
  | 'ZERO_REASON_PROVIDER_LIMIT'
  | 'ZERO_REASON_CONFIG_LIMIT'
  | 'ZERO_REASON_SCHEDULER_FAILURE'
  | 'ZERO_REASON_PROVIDER_ERROR'
  | 'ZERO_REASON_QUEUE_FAILURE'
  | 'ZERO_REASON_ALL_SUPPRESSED'
  | 'ZERO_REASON_ALL_PREVIOUSLY_SENT'
  | 'ZERO_REASON_SENDING_DISABLED'
  | 'ZERO_REASON_DRY_RUN_ENABLED'
  | 'ZERO_REASON_HOURLY_LIMIT'
  | 'ZERO_REASON_APPROVAL_REQUIRED'
  | 'ZERO_REASON_AUTOHEAL_REPAIRED'
  | 'ZERO_REASON_BATCH_SIZE'
  | 'ZERO_REASON_PENDING_JOBS'
  | 'ZERO_REASON_UNKNOWN';

export interface ZeroSendExplanation {
  code: ZeroSendReasonCode;
  message: string;
}

const LIMIT_TO_CODE: Partial<Record<OutreachLimitingFactor, ZeroSendReasonCode>> = {
  no_eligible_leads: 'ZERO_REASON_NO_ELIGIBLE_LEADS',
  provider_daily_limit: 'ZERO_REASON_PROVIDER_LIMIT',
  configured_daily_limit: 'ZERO_REASON_CONFIG_LIMIT',
  hourly_limit: 'ZERO_REASON_HOURLY_LIMIT',
  sending_disabled: 'ZERO_REASON_SENDING_DISABLED',
  dry_run: 'ZERO_REASON_DRY_RUN_ENABLED',
  approval_required: 'ZERO_REASON_APPROVAL_REQUIRED',
  batch_size: 'ZERO_REASON_BATCH_SIZE',
  pending_jobs_only: 'ZERO_REASON_PENDING_JOBS',
};

export function explainZeroAccepted(input: {
  capacity: OutreachCapacity;
  attempted: number;
  accepted: number;
  suppressed: number;
  alreadySentSkips?: number;
  schedulerFailed?: boolean;
  schedulerRepaired?: boolean;
  providerAuthFailed?: boolean;
  queueFailure?: boolean;
  queueRepairedJobs?: number;
  outstandingFaults?: string[];
}): ZeroSendExplanation | null {
  if (input.accepted > 0) return null;

  if (input.providerAuthFailed) {
    return {
      code: 'ZERO_REASON_PROVIDER_ERROR',
      message:
        '0 emails accepted because provider authentication failed. API returned HTTP 401/403. Human action required.',
    };
  }

  if (input.schedulerFailed && input.schedulerRepaired) {
    return {
      code: 'ZERO_REASON_AUTOHEAL_REPAIRED',
      message:
        '0 emails accepted due to scheduler failure. Autoheal restored processing. Outreach has resumed or will on the next worker tick.',
    };
  }

  if (input.schedulerFailed) {
    return {
      code: 'ZERO_REASON_SCHEDULER_FAILURE',
      message:
        '0 emails accepted due to scheduler failure. Autoheal could not fully restore the scheduler — see ACTION REQUIRED.',
    };
  }

  if (input.queueFailure) {
    const n = input.queueRepairedJobs ?? 0;
    return {
      code: 'ZERO_REASON_QUEUE_FAILURE',
      message:
        n > 0
          ? `0 emails accepted because eligible contacts were not being queued. Autoheal repaired the queue and created ${n} pending job(s).`
          : '0 emails accepted because eligible contacts were not being queued. Autoheal attempted repair.',
    };
  }

  const fromLimit = LIMIT_TO_CODE[input.capacity.limitingFactor];
  if (fromLimit) {
    return {
      code: fromLimit,
      message: formatLimitZeroMessage(fromLimit, input.capacity),
    };
  }

  if ((input.alreadySentSkips ?? 0) > 0 && input.capacity.eligibleUnsent <= 0) {
    return {
      code: 'ZERO_REASON_ALL_PREVIOUSLY_SENT',
      message:
        '0 emails accepted because all matched contacts were already provider-accepted for this campaign step.',
    };
  }

  if (input.suppressed > 0 && input.capacity.eligibleUnsent <= 0 && input.attempted === 0) {
    return {
      code: 'ZERO_REASON_ALL_SUPPRESSED',
      message:
        '0 emails accepted because remaining candidates were suppressed (unsubscribe, bounce, complaint, or manual exclusion).',
    };
  }

  if (input.outstandingFaults?.length) {
    return {
      code: 'ZERO_REASON_PROVIDER_ERROR',
      message: `0 emails accepted due to verified fault(s): ${input.outstandingFaults.join('; ')}.`,
    };
  }

  // Prefer capacity detail over UNKNOWN when capacity already explained idle state.
  if (input.capacity.limitingDetail && input.capacity.limitingFactor !== 'none') {
    return {
      code: LIMIT_TO_CODE[input.capacity.limitingFactor] ?? 'ZERO_REASON_UNKNOWN',
      message: `0 emails accepted. ${input.capacity.limitingDetail}`,
    };
  }

  return {
    code: 'ZERO_REASON_UNKNOWN',
    message:
      '0 emails accepted and diagnostics could not yet classify the cause. Autoheal must investigate before the next report.',
  };
}

function formatLimitZeroMessage(code: ZeroSendReasonCode, capacity: OutreachCapacity): string {
  switch (code) {
    case 'ZERO_REASON_NO_ELIGIBLE_LEADS':
      return '0 emails accepted because there were no new eligible unsent recipients.';
    case 'ZERO_REASON_PROVIDER_LIMIT':
      return `0 emails accepted because the provider allowance was exhausted. Limit ${capacity.providerDailyLimit ?? 'n/a'}, used ${capacity.providerUsedToday}, remaining 0, reset ${capacity.nextResetAt}.`;
    case 'ZERO_REASON_CONFIG_LIMIT':
      return `0 emails accepted because the configured workspace daily limit was ${capacity.configuredDailyLimit} and ${capacity.configuredUsedToday} had already been accepted.`;
    case 'ZERO_REASON_HOURLY_LIMIT':
      return `0 emails accepted because the configured hourly limit (${capacity.hourlyLimit}) was reached. Resets next UTC hour.`;
    case 'ZERO_REASON_SENDING_DISABLED':
      return '0 emails accepted because sending is disabled (env pause or KV pause).';
    case 'ZERO_REASON_DRY_RUN_ENABLED':
      return '0 emails accepted because FIRM_OUTREACH_DRY_RUN is enabled in this environment.';
    case 'ZERO_REASON_APPROVAL_REQUIRED':
      return '0 emails accepted because FIRM_OUTREACH_REQUIRE_APPROVAL=true (manual Confirm required).';
    case 'ZERO_REASON_BATCH_SIZE':
      return `0 emails accepted in this reporting period. Current batch capacity is ${capacity.currentBatchCapacity} — eligible leads remain and will send on later worker ticks.`;
    case 'ZERO_REASON_PENDING_JOBS':
      return `0 emails accepted in this reporting period. ${capacity.pendingJobs + capacity.retryScheduledJobs} durable job(s) are still drainable.`;
    default:
      return `0 emails accepted. ${capacity.limitingDetail}`;
  }
}
