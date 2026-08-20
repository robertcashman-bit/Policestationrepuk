import { NextResponse } from 'next/server';
import { isCronAuthorized } from '@/lib/cron-auth';
import { outreachRequireApproval } from '@/lib/firm-outreach/constants';
import { sendOutreachApprovalRequestEmail } from '@/lib/firm-outreach/outreach/approval-request-email';
import { sendDailyOutreachDigest } from '@/lib/firm-outreach/outreach/digest-email';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 120;

/**
 * 17:00 UTC firm-outreach digest.
 * Primary product: PoliceStationRepUK (`whatsapp_invite_v1`) ready/sent counts.
 * When click-to-send mode is on, sends an approval reminder instead.
 */
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (outreachRequireApproval()) {
    const result = await sendOutreachApprovalRequestEmail({ reminder: true });
    return NextResponse.json({ ok: true, mode: 'approval-reminder', ...result });
  }

  const url = new URL(request.url);
  const force = url.searchParams.get('force') === '1';
  const result = await sendDailyOutreachDigest({ force });
  return NextResponse.json({
    ok: true,
    mode: 'repuk_daily_digest',
    campaignId: 'whatsapp_invite_v1',
    ...result,
  });
}
