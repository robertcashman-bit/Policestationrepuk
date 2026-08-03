import { NextResponse } from 'next/server';
import { verifyRepukBufferSchedule } from '@/lib/buffer/engine-run';
import {
  buildIncidentFingerprint,
  resolveIncident,
} from '@/lib/automation/notifications';
import { withAutomationJob } from '@/lib/automation/with-job';
import { isOutreachBootstrapAuthorized } from '@/lib/cron-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** Daily verify — confirm >=5 posts scheduled today; gap-fill if under quota. */
export async function GET(request: Request) {
  // Cron Bearer or firm-outreach bootstrap header (post-deploy kick).
  if (!isOutreachBootstrapAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const wrapped = await withAutomationJob({
      jobName: 'buffer-verify',
      triggerSource: 'cron',
      run: async ({ executionId }) => {
        const result = await verifyRepukBufferSchedule({ gapFill: true });
        const resolved: string[] = [];
        if (result.ok && result.scheduledCount >= result.requiredCount) {
          // Clear false "missed window" incidents once today's quota is met.
          // Resolve both schedule-engine date and UTC day (legacy healthcheck fingerprints).
          const dates = new Set(
            [result.date, new Date().toISOString().slice(0, 10)].filter(Boolean),
          );
          for (const jobName of ['buffer-blog-posts', 'buffer-verify'] as const) {
            for (const scheduledDate of dates) {
              const fingerprint = buildIncidentFingerprint({
                jobName,
                category: 'scheduler',
                scheduledDate,
              });
              const res = await resolveIncident({
                fingerprint,
                executionId,
                sendResolutionEmail: false,
                summary: `Buffer quota met (${result.scheduledCount}/${result.requiredCount})`,
              });
              if (res.resolved) resolved.push(fingerprint);
            }
          }
        }
        return {
          status: result.ok ? 'successful' : 'partially_successful',
          result: { ...result, resolvedIncidents: resolved },
          counts: {
            quotaExpected: result.requiredCount,
            quotaAchieved: result.scheduledCount,
            recordsRepaired: result.gapFilled,
          },
          errorMessage: result.ok ? null : result.issues.join('; ') || 'under quota',
          repairs: result.gapFilled
            ? [`gap-filled ${result.gapFilled} posts`]
            : [],
        };
      },
    });

    if (wrapped.skipped) {
      return NextResponse.json({ ok: true, skipped: true, reason: wrapped.reason });
    }

    const result = wrapped.result!;
    return NextResponse.json(result, { status: result.ok ? 200 : 422 });
  } catch (err) {
    console.error('[cron:buffer-verify]', err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'verify failed' },
      { status: 500 },
    );
  }
}
