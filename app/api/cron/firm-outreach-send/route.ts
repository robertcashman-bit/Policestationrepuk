import { NextResponse } from 'next/server';
import { isOutreachBootstrapAuthorized } from '@/lib/cron-auth';
import { FIRM_OUTREACH_EMAIL_DISABLED_REASON } from '@/lib/firm-outreach/site-config';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 30;

/** Send worker cron retained for manual hits but never sends. */
export async function GET(request: Request) {
  if (!isOutreachBootstrapAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json({
    ok: true,
    skipped: true,
    reason: FIRM_OUTREACH_EMAIL_DISABLED_REASON,
    mode: 'permanently_disabled',
    accepted: 0,
    claimed: 0,
    jobsCreated: 0,
  });
}
