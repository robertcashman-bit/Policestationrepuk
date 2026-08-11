import { NextResponse } from 'next/server';
import { inspectAndRepairCrossSiteQuota } from '@/lib/automation/repairs/cross-site';
import { buildIncidentFingerprint, resolveIncident } from '@/lib/automation/notifications';
import { isOutreachBootstrapAuthorized } from '@/lib/cron-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;

/**
 * Operator / post-deploy kick: remote-trigger sibling `/api/buffer/schedule`
 * (or REPUK fallback when the sibling endpoint is missing) when yesterday's
 * cross-site quota was short.
 *
 * Auth: Bearer CRON_SECRET or x-firm-outreach-bootstrap-secret.
 */
export async function GET(request: Request) {
  if (!isOutreachBootstrapAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const dryRun = url.searchParams.get('dryRun') === '1';
  const date = url.searchParams.get('date')?.trim() || undefined;

  try {
    const result = await inspectAndRepairCrossSiteQuota({
      dryRun,
      date,
      forceRemoteRepair: !dryRun,
    });

    const resolved: string[] = [];
    if (!dryRun) {
      for (const repair of result.repairs) {
        if (
          (repair.kind !== 'crosssite_sibling_remote_schedule' &&
            repair.kind !== 'crosssite_sibling_repuk_fallback') ||
          !repair.verified
        ) {
          continue;
        }
        for (const category of ['quota_supply', 'scheduler'] as const) {
          const fingerprint = buildIncidentFingerprint({
            jobName: 'buffer-cross-site-report',
            category,
            accountOrDestination: repair.target,
            scheduledDate: result.date,
          });
          const res = await resolveIncident({
            fingerprint,
            sendResolutionEmail: false,
            summary: `Sibling today schedule healed (${repair.summary})`,
          });
          if (res.resolved) resolved.push(fingerprint);
        }
      }
    }

    return NextResponse.json({
      ok: result.ok || result.repairs.some((r) => r.verified),
      date: result.date,
      expected: result.expected,
      actual: result.actual,
      repairs: result.repairs,
      issues: result.issues,
      resolvedIncidents: resolved,
    });
  } catch (err) {
    console.error('[cron:buffer-sibling-repair]', err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'sibling repair failed' },
      { status: 500 },
    );
  }
}
