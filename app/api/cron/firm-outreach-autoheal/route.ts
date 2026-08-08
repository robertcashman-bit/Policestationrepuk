import { NextResponse } from 'next/server';
import { isCronAuthorized, isOutreachBootstrapAuthorized } from '@/lib/cron-auth';
import { runOutreachAutoheal } from '@/lib/firm-outreach/autoheal/run-autoheal';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;

/** Autoheal / reconciliation every ~10–15 minutes (staggered cron). */
export async function GET(request: Request) {
  if (!isCronAuthorized(request) && !isOutreachBootstrapAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const noSend = url.searchParams.get('noSend') === '1';
  const result = await runOutreachAutoheal({
    triggerOutreach: !noSend,
    maxElapsedMs: 180_000,
  });

  return NextResponse.json({
    ok: result.ok,
    mode: 'autoheal',
    runId: result.runId,
    skipped: result.skipped,
    reason: result.reason,
    faultCount: result.faults.length,
    faults: result.faults.map((f) => ({
      code: f.code,
      workspace: f.workspace,
      severity: f.severity,
      detail: f.detail,
    })),
    repairs: result.repairs,
    skippedRepairs: result.skippedRepairs,
    jobsRecovered: result.jobsRecovered,
    jobsCreated: result.jobsCreated,
    accepted: result.accepted,
    errors: result.errors,
    capacity: {
      psa: {
        eligible: result.capacities.psa.eligibleUnsent,
        effective: result.capacities.psa.effectiveAvailableCapacity,
        limiting: result.capacities.psa.limitingFactor,
        detail: result.capacities.psa.limitingDetail,
      },
      repuk: {
        eligible: result.capacities.repuk.eligibleUnsent,
        effective: result.capacities.repuk.effectiveAvailableCapacity,
        limiting: result.capacities.repuk.limitingFactor,
        detail: result.capacities.repuk.limitingDetail,
      },
    },
  });
}
