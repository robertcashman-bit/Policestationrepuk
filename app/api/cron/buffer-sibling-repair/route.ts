import { NextResponse } from 'next/server';
import { withAutomationJob } from '@/lib/automation/with-job';
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
    const wrapped = await withAutomationJob({
      jobName: 'buffer-sibling-repair',
      triggerSource: 'cron',
      dryRun,
      run: async ({ executionId }) => {
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
                executionId,
                sendResolutionEmail: false,
                summary: `Sibling today schedule healed (${repair.summary})`,
              });
              if (res.resolved) resolved.push(fingerprint);
            }
          }
        }

        const healed = result.ok || result.repairs.some((r) => r.verified);
        return {
          status: healed
            ? result.ok
              ? ('successful' as const)
              : ('repaired' as const)
            : ('partially_successful' as const),
          result: {
            ok: healed,
            date: result.date,
            expected: result.expected,
            actual: result.actual,
            repairs: result.repairs,
            issues: result.issues,
            resolvedIncidents: resolved,
          },
          counts: {
            quotaExpected: result.expected,
            quotaAchieved: result.actual,
            recordsRepaired: result.repairs.filter((r) => r.verified).length,
          },
          repairs: result.repairs.map((r) => r.summary),
          errorMessage: healed
            ? null
            : result.issues.map((i) => i.summary).join('; ') || 'sibling repair incomplete',
        };
      },
    });

    if (wrapped.skipped) {
      return NextResponse.json({ ok: true, skipped: true, reason: wrapped.reason });
    }

    if (!wrapped.result) {
      return NextResponse.json(
        { ok: false, error: wrapped.reason ?? 'sibling repair failed' },
        { status: 500 },
      );
    }

    return NextResponse.json(wrapped.result);
  } catch (err) {
    console.error('[cron:buffer-sibling-repair]', err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'sibling repair failed' },
      { status: 500 },
    );
  }
}
