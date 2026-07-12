import { NextResponse } from 'next/server';
import { processUnsubscribe } from '@/lib/firm-outreach/outreach/process-unsubscribe';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * RFC 8058 one-click unsubscribe target for the `List-Unsubscribe` /
 * `List-Unsubscribe-Post: List-Unsubscribe=One-Click` headers. Gmail, Yahoo and other
 * bulk-sender mailbox providers POST here (no interactive confirmation), so it must
 * process the opt-out and return 2xx.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const result = await processUnsubscribe(token);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: 'invalid_or_expired_token' }, { status: 400 });
  }
  return NextResponse.json({ ok: true, unsubscribed: true });
}

/** Fallback for clients that GET the header URL — process then show the friendly page. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  await processUnsubscribe(token);
  return NextResponse.redirect(new URL(`/outreach/unsubscribe/${token}`, request.url));
}
