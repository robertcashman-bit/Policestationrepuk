import { NextResponse } from 'next/server';
import { getAllStations } from '@/lib/data';
import { isCronAuthorized } from '@/lib/cron-auth';
import { saveCronRunLog } from '@/lib/cron-run-log';
import { claimKey } from '@/lib/kv-atomic';
import {
  runStationContactResearch,
  stationResearchEnabled,
} from '@/lib/station-research';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;

const RUN_LOCK_TTL_SECONDS = 270;

/**
 * Continuous station-contact research (main lines / provenance).
 *
 * Safe defaults:
 * - No-op unless STATION_RESEARCH_ENABLED=1
 * - Dry-run unless STATION_RESEARCH_DRY_RUN=0
 * - Never writes stations.json; queues candidates for admin
 *
 * Auth: Bearer ${CRON_SECRET}
 */
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!stationResearchEnabled()) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: 'STATION_RESEARCH_ENABLED is off',
    });
  }

  const lockClaimed = await claimKey('stationresearch:run', RUN_LOCK_TTL_SECONDS);
  if (!lockClaimed) {
    return NextResponse.json(
      { ok: false, error: 'overlap', reason: 'Another station research run is in progress' },
      { status: 409 },
    );
  }

  const startedAt = new Date().toISOString();
  const t0 = Date.now();
  const url = new URL(request.url);
  const limit = Number(url.searchParams.get('limit') || '') || undefined;

  try {
    const stations = await getAllStations();
    const report = await runStationContactResearch({ stations, limit });
    const finishedAt = new Date().toISOString();
    await saveCronRunLog({
      jobName: 'station-contact-research',
      startedAt,
      finishedAt,
      durationMs: Date.now() - t0,
      outcome: report.errors.some((e) => e.includes('max_elapsed')) ? 'partial' : 'success',
      counts: {
        researched: report.stationsResearched,
        candidates: report.candidatesFound,
        queued: report.queuedForAdmin,
        rejected: report.rejected,
      },
    });
    return NextResponse.json({ ok: true, report });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await saveCronRunLog({
      jobName: 'station-contact-research',
      startedAt,
      finishedAt: new Date().toISOString(),
      durationMs: Date.now() - t0,
      outcome: 'error',
      errorMessage: message,
    });
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
