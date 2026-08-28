/**
 * Authoritative outreach capacity for a workspace.
 * "Sent" for limit accounting = provider-accepted count (daily KV counter + Resend soft budget).
 */
import {
  isResendDailyLimitUnlimited,
  resendDailyLimit,
  resendOutreachBudget,
} from '@robertcashman/firm-outreach-core';
import {
  dailySendCap,
  isDailySendCapUnlimited,
  isCronSendBatchUnlimited,
  cronSendBatchSize,
  outreachSendEnabled,
} from './constants';
import { isOutreachSendAllowed } from './pause-state';
import {
  countEmailJobsByStatus,
  countClaimableJobsForCampaign,
  getEmailJob,
  listEmailJobIdsByStatus,
} from './email-jobs/storage';
import {
  getDailySendCount,
  getGlobalResendQuotaRemaining,
  getHourlySendCount,
  getResendSendCount,
  utcHourBucket,
} from './storage';
import { isAgentCoverOutreachDisabled } from './site-config';
import {
  type OutreachWorkspace,
  type OutreachWorkspaceId,
  workspaceById,
} from './workspaces';

export type OutreachLimitingFactor =
  | 'none'
  | 'sending_disabled'
  | 'dry_run'
  | 'provider_daily_limit'
  | 'configured_daily_limit'
  | 'hourly_limit'
  | 'batch_size'
  | 'no_eligible_leads'
  | 'pending_jobs_only'
  | 'approval_required';

export interface OutreachCapacity {
  workspace: OutreachWorkspaceId;
  campaignId: string;
  label: string;
  sendingEnabled: boolean;
  dryRun: boolean;
  eligibleUnsent: number;
  pendingJobs: number;
  retryScheduledJobs: number;
  claimedJobs: number;
  processingJobs: number;
  providerDailyLimit: number | null;
  providerUsedToday: number;
  providerRemainingToday: number;
  providerBudgetUnlimited: boolean;
  configuredDailyLimit: number | null;
  configuredUsedToday: number;
  configuredRemainingToday: number;
  configuredDailyUnlimited: boolean;
  hourlyLimit: number | null;
  hourlyUsed: number;
  hourlyRemaining: number | null;
  currentBatchCapacity: number;
  effectiveAvailableCapacity: number;
  limitingFactor: OutreachLimitingFactor;
  limitingDetail: string;
  nextResetAt: string;
  utcDate: string;
}

function isTruthyEnv(raw: string | undefined): boolean {
  return ['1', 'true', 'yes', 'on'].includes((raw ?? '').trim().toLowerCase());
}

function hourlyCap(): number {
  const n = Number(process.env.FIRM_OUTREACH_HOURLY_CAP ?? 0);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

function nextUtcMidnightIso(now = new Date()): string {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  return d.toISOString();
}

function nextUtcHourIso(now = new Date()): string {
  const d = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours() + 1),
  );
  return d.toISOString();
}

export async function countEligibleUnsent(campaignId: string, scanLimit = 400): Promise<number> {
  // Permanently-disabled PSA: skip walking the shared ready index entirely.
  if (campaignId === 'agent_cover_kent_v1' && isAgentCoverOutreachDisabled()) {
    return 0;
  }
  // Align with the worker: ready must be sendable *and* have a due next step,
  // plus due follow-ups on sent rows. Counting raw ready (or parked leftovers)
  // while ignoring follow-ups produced live Aug 26–27: digests "18 ready" /
  // daily report eligible=0 / accepted=0.
  const { selectOutreachCandidates } = await import('./outreach/candidate-selection');
  const selection = await selectOutreachCandidates({
    campaignId,
    readyLimit: scanLimit,
    sentLimit: scanLimit,
    maxReadyScan: Math.max(scanLimit * 4, 400),
    skipIndexedSendCheck: true,
    excludeFirmCooldown: false,
  });
  return selection.readyEligible + selection.followUpEligible;
}

export async function getOutreachCapacity(
  workspaceId: OutreachWorkspaceId,
  opts?: { now?: Date; eligibleScanLimit?: number; sampleJobs?: boolean },
): Promise<OutreachCapacity> {
  const workspace: OutreachWorkspace = workspaceById(workspaceId);
  const now = opts?.now ?? new Date();
  const utcDate = now.toISOString().slice(0, 10);
  const hourBucket = utcHourBucket(now);

  const dryRun = isTruthyEnv(process.env.FIRM_OUTREACH_DRY_RUN);
  const sendAllowed = await isOutreachSendAllowed();
  const campaignSendable =
    workspaceId !== 'psa' || !isAgentCoverOutreachDisabled();
  const sendingEnabled =
    campaignSendable && outreachSendEnabled() && sendAllowed && !dryRun;

  const [
    eligibleUnsent,
    jobCounts,
    configuredUsedToday,
    providerUsedToday,
    providerRemainingToday,
    hourlyUsed,
  ] = await Promise.all([
    countEligibleUnsent(workspace.campaignId, opts?.eligibleScanLimit ?? 400),
    countEmailJobsByStatus(),
    getDailySendCount(utcDate, workspace.campaignId),
    getResendSendCount(utcDate),
    getGlobalResendQuotaRemaining(utcDate),
    getHourlySendCount(workspace.campaignId, hourBucket),
  ]);

  // Status indexes are global — filter pending/retry to this workspace.
  // Worker ticks skip the per-job fetch (sampleJobs: false) so capacity
  // snapshots cannot eat the 300s Vercel ceiling before any send happens.
  let pendingJobs = 0;
  let retryScheduledJobs = 0;
  if (opts?.sampleJobs === false) {
    pendingJobs = await countClaimableJobsForCampaign(workspace.campaignId);
    retryScheduledJobs = 0;
  } else {
    const pendingIds = await listEmailJobIdsByStatus('pending', 200);
    const retryIds = await listEmailJobIdsByStatus('retry_scheduled', 200);
    for (const id of pendingIds) {
      const job = await getEmailJob(id);
      if (job?.campaignId === workspace.campaignId) pendingJobs++;
    }
    for (const id of retryIds) {
      const job = await getEmailJob(id);
      if (job?.campaignId === workspace.campaignId) retryScheduledJobs++;
    }
  }
  // Claimed/processing stay global for overlap observability only.
  const claimedJobs = jobCounts.claimed ?? 0;
  const processingJobs = jobCounts.processing ?? 0;

  const providerLimitRaw = resendDailyLimit();
  const providerBudgetUnlimited = isResendDailyLimitUnlimited(providerLimitRaw);
  const providerDailyLimit = providerBudgetUnlimited ? null : resendOutreachBudget();
  const configuredCap = dailySendCap();
  const configuredDailyUnlimited = isDailySendCapUnlimited(configuredCap);
  const configuredDailyLimit = configuredDailyUnlimited ? null : configuredCap;
  const configuredRemainingToday = configuredDailyUnlimited
    ? Number.MAX_SAFE_INTEGER
    : Math.max(0, configuredCap - configuredUsedToday);

  const hourLimit = hourlyCap();
  const hourlyLimit = hourLimit > 0 ? hourLimit : null;
  const hourlyRemaining =
    hourlyLimit == null ? null : Math.max(0, hourlyLimit - hourlyUsed);

  const batchSize = cronSendBatchSize();
  const batchUnlimited = isCronSendBatchUnlimited(batchSize);

  let limitingFactor: OutreachLimitingFactor = 'none';
  let limitingDetail = 'Capacity available.';
  let effective = Number.MAX_SAFE_INTEGER;

  if (dryRun) {
    limitingFactor = 'dry_run';
    limitingDetail = 'FIRM_OUTREACH_DRY_RUN is enabled — live provider sends are blocked.';
    effective = 0;
  } else if (!campaignSendable) {
    limitingFactor = 'sending_disabled';
    limitingDetail =
      'Police Station Agent / agent_cover_kent_v1 outreach is permanently disabled in this repo.';
    effective = 0;
  } else if (!outreachSendEnabled() || !sendAllowed) {
    limitingFactor = 'sending_disabled';
    limitingDetail = !outreachSendEnabled()
      ? 'FIRM_OUTREACH_SEND_ENABLED=false (or FIRM_OUTREACH_PAUSED).'
      : 'Outreach pause flag is active in KV.';
    effective = 0;
  } else if (isTruthyEnv(process.env.FIRM_OUTREACH_REQUIRE_APPROVAL)) {
    limitingFactor = 'approval_required';
    limitingDetail =
      'FIRM_OUTREACH_REQUIRE_APPROVAL=true — automated worker will not send until Confirm.';
    effective = 0;
  } else {
    if (!batchUnlimited) {
      effective = Math.min(effective, batchSize);
    }
    if (!providerBudgetUnlimited && providerRemainingToday <= 0) {
      limitingFactor = 'provider_daily_limit';
      limitingDetail = `Brevo/Resend soft daily allowance: ${providerDailyLimit}. Accepted today (shared): ${providerUsedToday}. Remaining: 0. Resets at ${nextUtcMidnightIso(now)}.`;
      effective = 0;
    } else if (!providerBudgetUnlimited) {
      effective = Math.min(effective, providerRemainingToday);
    }

    if (effective > 0 && !configuredDailyUnlimited && configuredRemainingToday <= 0) {
      limitingFactor = 'configured_daily_limit';
      limitingDetail = `Configured workspace daily limit was ${configuredDailyLimit} and ${configuredUsedToday} had already been accepted. Resets at ${nextUtcMidnightIso(now)}.`;
      effective = 0;
    } else if (effective > 0 && !configuredDailyUnlimited) {
      effective = Math.min(effective, configuredRemainingToday);
    }

    if (effective > 0 && hourlyLimit != null && (hourlyRemaining ?? 0) <= 0) {
      limitingFactor = 'hourly_limit';
      limitingDetail = `Configured hourly limit ${hourlyLimit}; used ${hourlyUsed} in ${hourBucket}. Resets at ${nextUtcHourIso(now)}.`;
      effective = 0;
    } else if (effective > 0 && hourlyRemaining != null) {
      effective = Math.min(effective, hourlyRemaining);
    }

    if (effective > 0 && eligibleUnsent <= 0 && pendingJobs + retryScheduledJobs <= 0) {
      limitingFactor = 'no_eligible_leads';
      limitingDetail = 'No new eligible unsent recipients and no pending/retry jobs.';
      effective = 0;
    } else if (
      effective > 0 &&
      eligibleUnsent <= 0 &&
      pendingJobs + retryScheduledJobs > 0
    ) {
      limitingFactor = 'pending_jobs_only';
      limitingDetail = `No new eligible leads; ${pendingJobs + retryScheduledJobs} durable job(s) still drainable.`;
      effective = Math.min(
        effective,
        pendingJobs + retryScheduledJobs,
        batchUnlimited ? Number.MAX_SAFE_INTEGER : batchSize,
      );
    } else if (
      effective > 0 &&
      limitingFactor === 'none' &&
      !batchUnlimited &&
      effective === batchSize
    ) {
      limitingFactor = 'batch_size';
      limitingDetail = `Current batch capacity is ${batchSize} (cron/worker batch size).`;
    }
  }

  if (
    effective > 0 &&
    limitingFactor === 'none' &&
    !providerBudgetUnlimited &&
    !batchUnlimited &&
    providerRemainingToday < batchSize
  ) {
    limitingFactor = 'provider_daily_limit';
    limitingDetail = `Provider soft allowance remaining today: ${providerRemainingToday} of ${providerDailyLimit}.`;
  }

  return {
    workspace: workspace.id,
    campaignId: workspace.campaignId,
    label: workspace.label,
    sendingEnabled,
    dryRun,
    eligibleUnsent,
    pendingJobs,
    retryScheduledJobs,
    claimedJobs,
    processingJobs,
    providerDailyLimit,
    providerUsedToday,
    providerRemainingToday: providerBudgetUnlimited
      ? Number.MAX_SAFE_INTEGER
      : providerRemainingToday,
    providerBudgetUnlimited,
    configuredDailyLimit,
    configuredUsedToday,
    configuredRemainingToday: configuredDailyUnlimited
      ? Number.MAX_SAFE_INTEGER
      : configuredRemainingToday,
    configuredDailyUnlimited,
    hourlyLimit,
    hourlyUsed,
    hourlyRemaining,
    currentBatchCapacity: batchSize,
    effectiveAvailableCapacity: Math.max(
      0,
      batchUnlimited ? effective : Math.min(effective, batchSize),
    ),
    limitingFactor,
    limitingDetail,
    nextResetAt: nextUtcMidnightIso(now),
    utcDate,
  };
}

export async function getAllWorkspacesCapacity(
  now = new Date(),
  opts?: { eligibleScanLimit?: number; sampleJobs?: boolean },
) {
  const [psa, repuk] = await Promise.all([
    getOutreachCapacity('psa', { now, ...opts }),
    getOutreachCapacity('repuk', { now, ...opts }),
  ]);
  return { psa, repuk };
}
