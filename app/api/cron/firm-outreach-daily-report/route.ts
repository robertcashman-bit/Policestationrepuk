import { NextResponse } from 'next/server';
import { isCronAuthorized, isOutreachBootstrapAuthorized } from '@/lib/cron-auth';
import { sendConsolidatedDailyReport } from '@/lib/firm-outreach/reporting/send-daily-report';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 120;

/**
 * Consolidated dual-workspace daily report.
 * Cron fires at 06:00 and 07:00 UTC; handler only sends during the 07:00 Europe/London hour.
 */
export async function GET(request: Request) {
  if (!isCronAuthorized(request) && !isOutreachBootstrapAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const force = url.searchParams.get('force') === '1';
  const retryFailed = url.searchParams.get('retry') === '1';

  const result = await sendConsolidatedDailyReport({ force, retryFailed });
  return NextResponse.json({
    mode: 'daily_report_0700_london',
    ...result,
  });
}
