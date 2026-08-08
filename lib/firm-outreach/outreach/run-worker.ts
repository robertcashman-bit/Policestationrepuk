/**
 * Frequent outreach worker tick — restart-safe small durable batches.
 */
import { validateOutreachEnv } from '@robertcashman/firm-outreach-core';
import { getAllWorkspacesCapacity } from '../capacity';
import { cronSendBatchSize, outreachRequireApproval, outreachSendEnabled } from '../constants';
import { recoverAbandonedEmailJobs } from '../email-jobs/storage';
import { newJobRunId, saveJobRun } from '../job-runs';
import { isOutreachSendAllowed } from '../pause-state';
import { claimOutreachRunLock } from '../run-lock';
import { runFirmOutreachAllCampaigns } from './run-outreach';

export async function runOutreachWorkerTick(opts?: {
  limit?: number;
  maxElapsedMs?: number;
}): Promise<{
  ok: boolean;
  skipped?: boolean;
  reason?: string;
  runId: string;
  accepted: number;
  claimed: number;
  jobsCreated: number;
  byCampaign?: Record<string, unknown>;
}> {
  const runId = newJobRunId('worker');
  const started = new Date().toISOString();

  if (outreachRequireApproval()) {
    await saveJobRun({
      workspace: 'both',
      runId,
      runType: 'outreach_worker',
      started,
      finished: new Date().toISOString(),
      status: 'skipped',
      errorSummary: 'approval_required',
    });
    return { ok: true, skipped: true, reason: 'approval_required', runId, accepted: 0, claimed: 0, jobsCreated: 0 };
  }

  if (!outreachSendEnabled() || !(await isOutreachSendAllowed())) {
    await saveJobRun({
      workspace: 'both',
      runId,
      runType: 'outreach_worker',
      started,
      finished: new Date().toISOString(),
      status: 'skipped',
      errorSummary: 'sending_disabled',
    });
    return { ok: true, skipped: true, reason: 'sending_disabled', runId, accepted: 0, claimed: 0, jobsCreated: 0 };
  }

  const envCheck = validateOutreachEnv({ forLiveSend: true, requireCronSecret: false });
  if (!envCheck.ok) {
    await saveJobRun({
      workspace: 'both',
      runId,
      runType: 'outreach_worker',
      started,
      finished: new Date().toISOString(),
      status: 'failed',
      errorSummary: envCheck.errors.join(';'),
    });
    return {
      ok: false,
      skipped: true,
      reason: `env_invalid:${envCheck.errors.join(',')}`,
      runId,
      accepted: 0,
      claimed: 0,
      jobsCreated: 0,
    };
  }

  const locked = await claimOutreachRunLock('send');
  if (!locked) {
    await saveJobRun({
      workspace: 'both',
      runId,
      runType: 'outreach_worker',
      started,
      finished: new Date().toISOString(),
      status: 'skipped',
      errorSummary: 'overlap',
    });
    return { ok: true, skipped: true, reason: 'overlap', runId, accepted: 0, claimed: 0, jobsCreated: 0 };
  }

  const before = await getAllWorkspacesCapacity();
  const recovered = await recoverAbandonedEmailJobs({ limit: 80 });

  const multi = await runFirmOutreachAllCampaigns({
    limit: opts?.limit ?? cronSendBatchSize(),
    maxElapsedMs: opts?.maxElapsedMs ?? 240_000,
  });

  const after = await getAllWorkspacesCapacity();
  const accepted = multi.combined.accepted ?? multi.combined.sent ?? 0;
  const claimed = multi.combined.jobsClaimed ?? 0;
  const jobsCreated = multi.combined.jobsCreated ?? 0;

  await saveJobRun({
    workspace: 'both',
    runId,
    runType: 'outreach_worker',
    started,
    finished: new Date().toISOString(),
    status: multi.combined.errors > 0 ? 'partial' : 'success',
    eligibleBefore: before.psa.eligibleUnsent + before.repuk.eligibleUnsent,
    pendingBefore: before.psa.pendingJobs + before.repuk.pendingJobs,
    claimed,
    attempted: accepted + (multi.combined.errors ?? 0) + (multi.combined.permanentlyFailed ?? 0),
    accepted,
    failed: multi.combined.errors ?? 0,
    retried: multi.combined.retryScheduled ?? 0,
    suppressed: multi.combined.suppressed ?? 0,
    eligibleAfter: after.psa.eligibleUnsent + after.repuk.eligibleUnsent,
    pendingAfter: after.psa.pendingJobs + after.repuk.pendingJobs,
    providerCapacityBefore: before.psa.providerRemainingToday,
    providerCapacityAfter: after.psa.providerRemainingToday,
    repairsPerformed: recovered > 0 ? [`recover_abandoned:${recovered}`] : undefined,
    errorSummary: multi.combined.skippedReason,
    meta: {
      byCampaign: Object.fromEntries(
        Object.entries(multi.byCampaign).map(([k, v]) => [
          k,
          { accepted: v.accepted ?? v.sent, claimed: v.jobsClaimed, created: v.jobsCreated },
        ]),
      ),
    },
  });

  // Also stamp per-workspace latest pointers for dashboard asymmetry checks.
  for (const ws of ['psa', 'repuk'] as const) {
    const camp = ws === 'psa' ? 'agent_cover_kent_v1' : 'whatsapp_invite_v1';
    const stats = multi.byCampaign[camp];
    if (!stats) continue;
    await saveJobRun({
      workspace: ws,
      runId: `${runId}_${ws}`,
      runType: 'outreach_worker',
      started,
      finished: new Date().toISOString(),
      status: (stats.errors ?? 0) > 0 ? 'partial' : 'success',
      accepted: stats.accepted ?? stats.sent ?? 0,
      claimed: stats.jobsClaimed ?? 0,
      meta: { parentRunId: runId },
    });
  }

  return {
    ok: true,
    runId,
    accepted,
    claimed,
    jobsCreated,
    byCampaign: multi.byCampaign,
  };
}
