import { newJobRunId, saveJobRun } from '../job-runs';
import { claimOutreachRunLock } from '../run-lock';
import { detectAutohealFaults } from './detect';
import { applyAutohealRepairs } from './repair';
import { maybeSendCriticalOutreachAlert } from '../reporting/critical-alert';

export interface AutohealRunResult {
  ok: boolean;
  skipped?: boolean;
  reason?: string;
  runId: string;
  faults: Awaited<ReturnType<typeof detectAutohealFaults>>['faults'];
  repairs: string[];
  skippedRepairs: string[];
  jobsRecovered: number;
  jobsCreated: number;
  accepted: number;
  errors: string[];
  capacities: Awaited<ReturnType<typeof detectAutohealFaults>>['capacities'];
}

export async function runOutreachAutoheal(opts?: {
  triggerOutreach?: boolean;
  maxElapsedMs?: number;
}): Promise<AutohealRunResult> {
  const runId = newJobRunId('autoheal');
  const started = new Date().toISOString();

  const locked = await claimOutreachRunLock('autoheal');
  if (!locked) {
    await saveJobRun({
      workspace: 'both',
      runId,
      runType: 'autoheal',
      started,
      finished: new Date().toISOString(),
      status: 'skipped',
      errorSummary: 'overlap',
    });
    return {
      ok: true,
      skipped: true,
      reason: 'overlap',
      runId,
      faults: [],
      repairs: [],
      skippedRepairs: [],
      jobsRecovered: 0,
      jobsCreated: 0,
      accepted: 0,
      errors: [],
      capacities: await detectAutohealFaults().then((d) => d.capacities),
    };
  }

  const { faults, capacities } = await detectAutohealFaults();
  const repair = await applyAutohealRepairs(faults, {
    triggerOutreach: opts?.triggerOutreach,
    maxElapsedMs: opts?.maxElapsedMs,
  });

  const status =
    repair.errors.length > 0
      ? 'partial'
      : faults.some((f) => f.severity === 'critical')
        ? 'partial'
        : 'success';

  await saveJobRun({
    workspace: 'both',
    runId,
    runType: 'autoheal',
    started,
    finished: new Date().toISOString(),
    status,
    eligibleBefore: capacities.psa.eligibleUnsent + capacities.repuk.eligibleUnsent,
    pendingBefore: capacities.psa.pendingJobs + capacities.repuk.pendingJobs,
    accepted: repair.accepted,
    failed: repair.errors.length,
    repairsPerformed: repair.repairs,
    errorSummary: repair.errors.slice(0, 5).join('; ') || undefined,
    providerCapacityBefore: Math.min(
      capacities.psa.providerRemainingToday,
      capacities.repuk.providerRemainingToday,
    ),
    meta: {
      faultCodes: faults.map((f) => f.code),
      skipped: repair.skipped,
      jobsRecovered: repair.jobsRecovered,
      jobsCreated: repair.jobsCreated,
      outreachTriggered: repair.outreachTriggered,
    },
  });

  await maybeSendCriticalOutreachAlert({ faults, capacities, runId }).catch((err) => {
    console.warn('[firm-outreach autoheal] critical alert failed', err);
  });

  return {
    ok: repair.errors.length === 0,
    runId,
    faults,
    repairs: repair.repairs,
    skippedRepairs: repair.skipped,
    jobsRecovered: repair.jobsRecovered,
    jobsCreated: repair.jobsCreated,
    accepted: repair.accepted,
    errors: repair.errors,
    capacities,
  };
}
