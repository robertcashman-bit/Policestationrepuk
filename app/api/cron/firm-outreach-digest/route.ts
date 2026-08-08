import { NextResponse } from 'next/server';
import { isCronAuthorized } from '@/lib/cron-auth';
import { outreachRequireApproval } from '@/lib/firm-outreach/constants';
import { sendOutreachApprovalRequestEmail } from '@/lib/firm-outreach/outreach/approval-request-email';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 120;

/**
 * Legacy digest cron — routine status emails removed.
 * Only approval reminders remain when click-to-send mode is on.
 * Consolidated reporting: /api/cron/firm-outreach-daily-report (07:00 Europe/London).
 */
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (outreachRequireApproval()) {
    const result = await sendOutreachApprovalRequestEmail({ reminder: true });
    return NextResponse.json({ ok: true, mode: 'approval-reminder', ...result });
  }

  return NextResponse.json({
    ok: true,
    mode: 'legacy_digest_disabled',
    skipped: true,
    reason:
      'Routine firm-outreach digest emails are disabled. Use /api/cron/firm-outreach-daily-report at 07:00 Europe/London.',
  });
}
