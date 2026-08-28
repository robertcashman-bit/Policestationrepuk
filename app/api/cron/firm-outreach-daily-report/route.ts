import { NextResponse } from 'next/server';
import { isCronAuthorized, isOutreachBootstrapAuthorized } from '@/lib/cron-auth';
import { FIRM_OUTREACH_EMAIL_DISABLED_REASON } from '@/lib/firm-outreach/site-config';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 30;

/** Daily report cron retained for manual hits but never emails. */
export async function GET(request: Request) {
  if (!isCronAuthorized(request) && !isOutreachBootstrapAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json({
    ok: true,
    skipped: true,
    reason: FIRM_OUTREACH_EMAIL_DISABLED_REASON,
    mode: 'permanently_disabled',
  });
}
