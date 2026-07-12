import { NextResponse } from 'next/server';
import { isCronAuthorized } from '@/lib/cron-auth';
import { maybeAlertOutreachWatchdog, runOutreachWatchdog } from '@/lib/firm-outreach/outreach/watchdog';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 120;

/** Hourly outreach watchdog — auto-repair phantom sends / cap drift and alert on failures. */
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runOutreachWatchdog({ autoRepair: true });
    await maybeAlertOutreachWatchdog(result);
    return NextResponse.json(result, { status: result.ok ? 200 : 422 });
  } catch (err) {
    console.error('[cron:firm-outreach-watchdog]', err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'watchdog failed' },
      { status: 500 },
    );
  }
}
