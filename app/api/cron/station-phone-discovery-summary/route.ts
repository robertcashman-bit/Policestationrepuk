import { NextResponse } from 'next/server';
import { isCronAuthorized } from '@/lib/cron-auth';
import { runDiscoveryDailySummaryJob } from '@/lib/custody-discovery/discovery-summary';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Daily summary of station phone / custody discovery yield and alert flags.
 * Auth: Bearer ${CRON_SECRET} or x-cron-secret header.
 */
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const summary = await runDiscoveryDailySummaryJob();
  return NextResponse.json({ ok: true, summary });
}
