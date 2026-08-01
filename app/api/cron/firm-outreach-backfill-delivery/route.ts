import { NextResponse } from 'next/server';
import { isOutreachBootstrapAuthorized } from '@/lib/cron-auth';
import { backfillDeliveryFromResend } from '@/lib/firm-outreach/backfill-delivery';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 120;

/**
 * Reconcile delivery/bounce status from Resend emails.get when webhooks were down.
 */
export async function GET(request: Request) {
  if (!isOutreachBootstrapAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const limit = Math.min(
    100,
    Math.max(1, Number(url.searchParams.get('limit') || 50) || 50),
  );

  const result = await backfillDeliveryFromResend({ limit });
  return NextResponse.json({ ok: true, mode: 'backfill-delivery', ...result });
}
