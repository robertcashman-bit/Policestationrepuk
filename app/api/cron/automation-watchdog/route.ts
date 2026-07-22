import { NextResponse } from 'next/server';
import { runAutomationWatchdog } from '@/lib/automation/watchdog';
import { isCronAuthorized } from '@/lib/cron-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 120;

/**
 * Lightweight overdue/stuck/auth watchdog (every 6 hours).
 * Schedule: minute 20 of every 6th hour UTC (Vercel cron: 20 star-slash-6 * * *).
 */
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const dryRun = url.searchParams.get('dryRun') === '1';

  try {
    const result = await runAutomationWatchdog({ dryRun });
    return NextResponse.json(result);
  } catch (err) {
    console.error('[cron:automation-watchdog]', err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'watchdog failed' },
      { status: 500 },
    );
  }
}
