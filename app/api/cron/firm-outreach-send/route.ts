import { NextResponse } from 'next/server';
import { isOutreachBootstrapAuthorized } from '@/lib/cron-auth';
import { cronSendBatchSize } from '@/lib/firm-outreach/constants';
import { runOutreachWorkerTick } from '@/lib/firm-outreach/outreach/run-worker';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;

/**
 * Frequent outreach worker tick (job-first drain).
 * No routine digest/status emails — reporting is the 07:00 London consolidated report.
 */
export async function GET(request: Request) {
  if (!isOutreachBootstrapAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const paramLimit = Number(url.searchParams.get('limit') || 0);
  const sendLimit = paramLimit > 0 ? paramLimit : cronSendBatchSize();
  const result = await runOutreachWorkerTick({
    limit: sendLimit,
    maxElapsedMs: 280_000,
  });
  return NextResponse.json({
    mode: 'outreach-worker',
    ...result,
  });
}
