/**
 * Safe deterministic autoheal repairs.
 * Never bypasses suppression / unsubscribe / bounce / complaint.
 * Never resends when provider acceptance is ambiguous.
 */
import { recoverAbandonedEmailJobs } from '../email-jobs/storage';
import { runFirmOutreachAllCampaigns } from '../outreach/run-outreach';
import { backfillDeliveryFromResend } from '../backfill-delivery';
import { reviveAgentCoverKentReady } from '../revive-agent-cover-ready';
import { syncKentProspectsToAgentCover } from '../sync-kent-to-agent-cover';
import type { AutohealFault } from './detect';

export interface AutohealRepairResult {
  repairs: string[];
  skipped: string[];
  jobsRecovered: number;
  jobsCreated: number;
  outreachTriggered: boolean;
  accepted: number;
  errors: string[];
}

function has(faults: AutohealFault[], code: AutohealFault['code']): boolean {
  return faults.some((f) => f.code === code);
}

export async function applyAutohealRepairs(
  faults: AutohealFault[],
  opts?: { triggerOutreach?: boolean; maxElapsedMs?: number },
): Promise<AutohealRepairResult> {
  const repairs: string[] = [];
  const skipped: string[] = [];
  const errors: string[] = [];
  let jobsRecovered = 0;
  let jobsCreated = 0;
  let outreachTriggered = false;
  let accepted = 0;

  if (has(faults, 'manual_reconciliation_required') || has(faults, 'accepted_marked_failed')) {
    skipped.push('skip_resend_ambiguous_provider_acceptance');
  }

  if (
    has(faults, 'expired_leases') ||
    has(faults, 'jobs_stuck_claimed') ||
    has(faults, 'jobs_stuck_processing')
  ) {
    try {
      jobsRecovered = await recoverAbandonedEmailJobs({ limit: 100 });
      if (jobsRecovered > 0) {
        repairs.push(`release_expired_leases:${jobsRecovered}`);
        repairs.push(`requeue_abandoned_jobs:${jobsRecovered}`);
      } else {
        repairs.push('release_expired_leases:0');
      }
    } catch (err) {
      errors.push(`recover_abandoned:${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (has(faults, 'queue_empty_with_eligible') || has(faults, 'campaign_starved')) {
    try {
      const sync = await syncKentProspectsToAgentCover({
        limit: 80,
        maxElapsedMs: 40_000,
      });
      repairs.push(`psa_sync:created=${sync.created ?? 0},updated=${sync.updated ?? 0}`);
      const revived = await reviveAgentCoverKentReady({ limit: 80, maxElapsedMs: 30_000 });
      repairs.push(`revive_psa_ready:${revived.revived ?? 0}`);
    } catch (err) {
      errors.push(`queue_refill:${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Delivery backfill for accepted-without-local-delivery confirmation.
  if (has(faults, 'missing_provider_message_id') || has(faults, 'accepted_without_provider_id')) {
    skipped.push('no_auto_fix_accepted_without_provider_id');
  } else {
    try {
      const backfill = await backfillDeliveryFromResend({ limit: 40 });
      const n = (backfill?.applied ?? 0) + (backfill?.jobsUpdated ?? 0);
      if (n > 0) {
        repairs.push(`webhook_backfill:${n}`);
      }
    } catch (err) {
      errors.push(`backfill:${err instanceof Error ? err.message : String(err)}`);
    }
  }

  const shouldTrigger =
    opts?.triggerOutreach !== false &&
    (has(faults, 'scheduler_stale') ||
      has(faults, 'scheduler_idle_with_eligible') ||
      has(faults, 'provider_capacity_idle') ||
      has(faults, 'retries_overdue') ||
      has(faults, 'queue_empty_with_eligible') ||
      has(faults, 'expired_leases') ||
      has(faults, 'http_429') ||
      has(faults, 'http_5xx') ||
      has(faults, 'network_timeouts') ||
      has(faults, 'provider_temporary_failures'));

  if (has(faults, 'dry_run_enabled') || has(faults, 'sending_disabled')) {
    skipped.push('will_not_send_while_disabled_or_dry_run');
  } else if (shouldTrigger) {
    try {
      outreachTriggered = true;
      const multi = await runFirmOutreachAllCampaigns({
        limit: 25,
        maxElapsedMs: opts?.maxElapsedMs ?? 120_000,
      });
      accepted = multi.combined.accepted ?? multi.combined.sent ?? 0;
      jobsCreated = multi.combined.jobsCreated ?? 0;
      repairs.push(
        `trigger_outreach_batch:accepted=${accepted},jobsCreated=${jobsCreated},claimed=${multi.combined.jobsClaimed ?? 0}`,
      );
    } catch (err) {
      errors.push(`trigger_outreach:${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (faults.length === 0) {
    repairs.push('no_faults_detected');
  }

  return {
    repairs,
    skipped,
    jobsRecovered,
    jobsCreated,
    outreachTriggered,
    accepted,
    errors,
  };
}
