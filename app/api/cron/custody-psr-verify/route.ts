import { NextResponse } from 'next/server';
import { isCronAuthorized } from '@/lib/cron-auth';
import { saveCronRunLog } from '@/lib/cron-run-log';
import {
  getPsrCrawlMode,
  runPsrVerifyBatch,
  setPsrCrawlMode,
} from '@/lib/custody-discovery/psr-verify';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;

/**
 * PSR candidate verify loop — every 2h via vercel.json.
 *
 * Phase 1 (backfill): larger batches, force packing, custody-hit priority.
 * Phase 2 (steady): smaller batches + fingerprint/TTL skips.
 *
 * Query:
 * - `limit` — override batch size
 * - `mode=backfill|steady` — force mode (admin/ops)
 * - `suiteId=` — force recheck one suite
 *
 * Pause: CUSTODY_PSR_VERIFY=false
 * Auth: Bearer ${CRON_SECRET} or x-cron-secret.
 */
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startedAt = new Date().toISOString();
  const t0 = Date.now();
  const url = new URL(request.url);
  const limitParam = Number(url.searchParams.get('limit'));
  const modeParam = url.searchParams.get('mode');
  const suiteId = url.searchParams.get('suiteId')?.trim() || undefined;

  if (modeParam === 'backfill' || modeParam === 'steady') {
    await setPsrCrawlMode(modeParam);
  }

  const mode = await getPsrCrawlMode();
  const stats = await runPsrVerifyBatch({
    limit: Number.isFinite(limitParam) && limitParam > 0 ? limitParam : undefined,
    forceSuiteId: suiteId,
  });

  await saveCronRunLog({
    jobName: 'custody-psr-verify',
    startedAt,
    finishedAt: new Date().toISOString(),
    durationMs: Date.now() - t0,
    outcome: stats.locked || !stats.enabled ? 'skipped' : 'success',
    skipReason: !stats.enabled
      ? 'CUSTODY_PSR_VERIFY=false'
      : stats.locked
        ? 'lock_held'
        : stats.budgetExhausted
          ? 'serper_budget'
          : undefined,
    counts: {
      processed: stats.processed,
      verified: stats.verified,
      probable: stats.probable,
      queued: stats.queued,
      failed: stats.failed,
      serperUsed: stats.serperUsed,
    },
  });

  return NextResponse.json({ ok: true, requestedMode: mode, ...stats });
}
