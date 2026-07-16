import { NextResponse } from 'next/server';
import { isCronAuthorized } from '@/lib/cron-auth';
import { sendMorningOutreachResultsEmail } from '@/lib/firm-outreach/outreach/morning-results-email';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 120;

/** 08:00 Europe/London daily — yesterday's outreach sends by site and recipient. */
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const force = new URL(request.url).searchParams.get('force') === '1';
  const result = await sendMorningOutreachResultsEmail({ force });
  return NextResponse.json({ ok: true, mode: 'morning-results', ...result });
}
