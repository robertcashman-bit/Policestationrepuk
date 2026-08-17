/**
 * Autoheal fault detection for both outreach workspaces.
 */
import { getAllWorkspacesCapacity, type OutreachCapacity } from '../capacity';
import { countEmailJobsByStatus, getEmailJob, listEmailJobIdsByStatus } from '../email-jobs/storage';
import { getLatestJobRun } from '../job-runs';
import { getOutreachSendHealth } from '../outreach/from-address';
import { getLatestOutreachRunLog } from '../storage';
import { OUTREACH_WORKSPACES, type OutreachWorkspaceId } from '../workspaces';

export type AutohealFaultCode =
  | 'scheduler_stale'
  | 'scheduler_idle_with_eligible'
  | 'queue_empty_with_eligible'
  | 'jobs_stuck_claimed'
  | 'jobs_stuck_processing'
  | 'expired_leases'
  | 'retries_overdue'
  | 'provider_temporary_failures'
  | 'http_429'
  | 'http_5xx'
  | 'network_timeouts'
  | 'accepted_marked_failed'
  | 'missing_provider_message_id'
  | 'accepted_without_provider_id'
  | 'incorrect_daily_counters'
  | 'sending_disabled'
  | 'dry_run_enabled'
  | 'campaign_starved'
  | 'provider_capacity_idle'
  | 'workspace_asymmetric_failure'
  | 'manual_reconciliation_required';

export interface AutohealFault {
  code: AutohealFaultCode;
  workspace: OutreachWorkspaceId | 'both';
  severity: 'critical' | 'recoverable' | 'info';
  detail: string;
  meta?: Record<string, unknown>;
}

function isTruthyEnv(raw: string | undefined): boolean {
  return ['1', 'true', 'yes', 'on'].includes((raw ?? '').trim().toLowerCase());
}

async function countStuckJobs(
  status: 'claimed' | 'processing',
  nowMs: number,
): Promise<{ stuck: number; expiredLeases: number }> {
  const ids = await listEmailJobIdsByStatus(status, 100);
  let stuck = 0;
  let expiredLeases = 0;
  for (const id of ids) {
    const job = await getEmailJob(id);
    if (!job) continue;
    stuck += 1;
    const expires = job.claimExpiresAt ? Date.parse(job.claimExpiresAt) : 0;
    if (!expires || expires <= nowMs) expiredLeases += 1;
  }
  return { stuck, expiredLeases };
}

async function countOverdueRetries(nowMs: number): Promise<number> {
  const ids = await listEmailJobIdsByStatus('retry_scheduled', 100);
  let n = 0;
  for (const id of ids) {
    const job = await getEmailJob(id);
    if (!job) continue;
    if (!job.nextRetryAt || Date.parse(job.nextRetryAt) <= nowMs) n += 1;
  }
  return n;
}

async function scanAmbiguousAcceptedFailed(): Promise<number> {
  // Jobs marked permanently_failed but somehow holding a providerMessageId.
  const ids = await listEmailJobIdsByStatus('permanently_failed', 50);
  let n = 0;
  for (const id of ids) {
    const job = await getEmailJob(id);
    if (job?.providerMessageId) n += 1;
  }
  return n;
}

async function scanAcceptedWithoutProviderId(): Promise<number> {
  const ids = await listEmailJobIdsByStatus('accepted', 50);
  let n = 0;
  for (const id of ids) {
    const job = await getEmailJob(id);
    if (job && !job.providerMessageId) n += 1;
  }
  return n;
}

function schedulerStale(ageMs: number | null): boolean {
  if (ageMs == null) return true;
  return ageMs > 45 * 60_000;
}

export async function detectAutohealFaults(now = new Date()): Promise<{
  faults: AutohealFault[];
  capacities: { psa: OutreachCapacity; repuk: OutreachCapacity };
}> {
  const faults: AutohealFault[] = [];
  const capacities = await getAllWorkspacesCapacity(now);
  const sendHealth = await getOutreachSendHealth();
  const nowMs = now.getTime();
  const jobCounts = await countEmailJobsByStatus();

  if (isTruthyEnv(process.env.FIRM_OUTREACH_DRY_RUN)) {
    faults.push({
      code: 'dry_run_enabled',
      workspace: 'both',
      severity: 'critical',
      detail: 'FIRM_OUTREACH_DRY_RUN is enabled — production sending is blocked.',
    });
  }

  for (const ws of OUTREACH_WORKSPACES) {
    const cap = capacities[ws.id];
    if (!cap.sendingEnabled && !cap.dryRun) {
      faults.push({
        code: 'sending_disabled',
        workspace: ws.id,
        severity: 'critical',
        detail: `${ws.label}: sending disabled while capacity check ran.`,
      });
    }

    const latest = await getLatestJobRun('outreach_worker', ws.id);
    const latestBoth = await getLatestJobRun('outreach_worker', 'both');
    const run = latest ?? latestBoth;
    const ageMs = run?.finished
      ? nowMs - Date.parse(run.finished)
      : run?.started
        ? nowMs - Date.parse(run.started)
        : null;

    if (schedulerStale(ageMs) && cap.eligibleUnsent + cap.pendingJobs > 0 && cap.effectiveAvailableCapacity > 0) {
      faults.push({
        code: 'scheduler_stale',
        workspace: ws.id,
        severity: 'recoverable',
        detail: `${ws.label}: outreach worker last run ${ageMs == null ? 'never' : `${Math.round((ageMs ?? 0) / 60000)}m ago`} with eligible/pending work.`,
        meta: { ageMs },
      });
    }

    if (
      run &&
      (run.accepted ?? 0) === 0 &&
      (run.claimed ?? 0) === 0 &&
      cap.eligibleUnsent > 0 &&
      cap.effectiveAvailableCapacity > 0 &&
      !cap.dryRun &&
      cap.sendingEnabled
    ) {
      faults.push({
        code: 'scheduler_idle_with_eligible',
        workspace: ws.id,
        severity: 'recoverable',
        detail: `${ws.label}: last worker processed nothing despite ${cap.eligibleUnsent} eligible and capacity ${cap.effectiveAvailableCapacity}.`,
      });
    }

    if (
      cap.pendingJobs === 0 &&
      cap.eligibleUnsent > 0 &&
      cap.effectiveAvailableCapacity > 0 &&
      cap.sendingEnabled &&
      !cap.dryRun
    ) {
      faults.push({
        code: 'queue_empty_with_eligible',
        workspace: ws.id,
        severity: 'recoverable',
        detail: `${ws.label}: pending queue empty while ${cap.eligibleUnsent} eligible recipients exist.`,
      });
    }

    if (
      cap.eligibleUnsent >= 20 &&
      cap.configuredUsedToday < 5 &&
      cap.effectiveAvailableCapacity > 0 &&
      cap.sendingEnabled &&
      !cap.dryRun
    ) {
      faults.push({
        code: 'campaign_starved',
        workspace: ws.id,
        severity: 'recoverable',
        detail: `${ws.label}: only ${cap.configuredUsedToday} accepted today with ${cap.eligibleUnsent} eligible and capacity ${cap.effectiveAvailableCapacity}.`,
        meta: {
          eligibleUnsent: cap.eligibleUnsent,
          acceptedToday: cap.configuredUsedToday,
        },
      });
    }

    if (
      cap.providerRemainingToday > 0 &&
      !cap.providerBudgetUnlimited &&
      cap.eligibleUnsent + cap.pendingJobs > 0 &&
      cap.effectiveAvailableCapacity > 0 &&
      schedulerStale(ageMs)
    ) {
      faults.push({
        code: 'provider_capacity_idle',
        workspace: ws.id,
        severity: 'recoverable',
        detail: `${ws.label}: provider remaining ${cap.providerRemainingToday} but queue/worker idle.`,
      });
    }

    const runLog = await getLatestOutreachRunLog(ws.campaignId);
    const failures = runLog?.failures ?? [];
    for (const f of failures.slice(-10)) {
      const msg = `${f.reason ?? ''}`.toLowerCase();
      if (msg.includes('429') || msg.includes('rate limit')) {
        faults.push({
          code: 'http_429',
          workspace: ws.id,
          severity: 'recoverable',
          detail: `${ws.label}: recent HTTP 429 / rate limit in run log.`,
        });
      } else if (/\b5\d\d\b/.test(msg) || msg.includes('server error')) {
        faults.push({
          code: 'http_5xx',
          workspace: ws.id,
          severity: 'recoverable',
          detail: `${ws.label}: recent HTTP 5xx in run log.`,
        });
      } else if (msg.includes('timeout') || msg.includes('econnreset') || msg.includes('enotfound')) {
        faults.push({
          code: 'network_timeouts',
          workspace: ws.id,
          severity: 'recoverable',
          detail: `${ws.label}: recent network/timeout failure in run log.`,
        });
      } else if (msg.includes('transient') || f.transient) {
        faults.push({
          code: 'provider_temporary_failures',
          workspace: ws.id,
          severity: 'recoverable',
          detail: `${ws.label}: recent provider temporary failures.`,
        });
      }
    }
  }

  const claimed = await countStuckJobs('claimed', nowMs);
  const processing = await countStuckJobs('processing', nowMs);
  if (claimed.stuck > 0) {
    faults.push({
      code: 'jobs_stuck_claimed',
      workspace: 'both',
      severity: 'recoverable',
      detail: `${claimed.stuck} job(s) stuck in claimed (${claimed.expiredLeases} expired leases).`,
      meta: claimed,
    });
  }
  if (processing.stuck > 0) {
    faults.push({
      code: 'jobs_stuck_processing',
      workspace: 'both',
      severity: 'recoverable',
      detail: `${processing.stuck} job(s) stuck in processing (${processing.expiredLeases} expired leases).`,
      meta: processing,
    });
  }
  if (claimed.expiredLeases + processing.expiredLeases > 0) {
    faults.push({
      code: 'expired_leases',
      workspace: 'both',
      severity: 'recoverable',
      detail: `${claimed.expiredLeases + processing.expiredLeases} expired worker lease(s).`,
    });
  }

  const overdue = await countOverdueRetries(nowMs);
  if (overdue > 0) {
    faults.push({
      code: 'retries_overdue',
      workspace: 'both',
      severity: 'recoverable',
      detail: `${overdue} retry_scheduled job(s) are overdue.`,
    });
  }

  const ambiguous = await scanAmbiguousAcceptedFailed();
  if (ambiguous > 0) {
    faults.push({
      code: 'accepted_marked_failed',
      workspace: 'both',
      severity: 'critical',
      detail: `${ambiguous} permanently_failed job(s) still have provider message IDs — manual reconciliation required (do not resend).`,
    });
    faults.push({
      code: 'manual_reconciliation_required',
      workspace: 'both',
      severity: 'critical',
      detail: 'Ambiguous provider acceptance vs local failure — will not auto-resend.',
      meta: { count: ambiguous },
    });
  }

  const missingId = await scanAcceptedWithoutProviderId();
  if (missingId > 0) {
    faults.push({
      code: 'accepted_without_provider_id',
      workspace: 'both',
      severity: 'critical',
      detail: `${missingId} accepted job(s) lack provider message IDs.`,
    });
    faults.push({
      code: 'manual_reconciliation_required',
      workspace: 'both',
      severity: 'critical',
      detail: 'Accepted-without-ID requires manual reconciliation.',
    });
  }

  // Asymmetric: one workspace healthy with capacity, other failed with eligible.
  const psaFailed =
    capacities.psa.eligibleUnsent > 0 &&
    capacities.psa.effectiveAvailableCapacity === 0 &&
    capacities.psa.limitingFactor !== 'no_eligible_leads' &&
    capacities.psa.limitingFactor !== 'provider_daily_limit' &&
    capacities.psa.limitingFactor !== 'configured_daily_limit';
  const repukFailed =
    capacities.repuk.eligibleUnsent > 0 &&
    capacities.repuk.effectiveAvailableCapacity === 0 &&
    capacities.repuk.limitingFactor !== 'no_eligible_leads' &&
    capacities.repuk.limitingFactor !== 'provider_daily_limit' &&
    capacities.repuk.limitingFactor !== 'configured_daily_limit';
  if (psaFailed !== repukFailed) {
    faults.push({
      code: 'workspace_asymmetric_failure',
      workspace: 'both',
      severity: 'recoverable',
      detail: `Asymmetric workspace health: PSA limiting=${capacities.psa.limitingFactor}, RepUK limiting=${capacities.repuk.limitingFactor}.`,
    });
  }

  if (!sendHealth.resendConfigured) {
    faults.push({
      code: 'provider_temporary_failures',
      workspace: 'both',
      severity: 'critical',
      detail: 'RESEND_API_KEY not configured.',
    });
  }

  void jobCounts;
  return { faults, capacities };
}
