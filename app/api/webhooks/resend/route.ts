import { NextResponse, after } from 'next/server';
import { verifyResendWebhookSignature } from '@/lib/firm-outreach/resend-webhook-verify';
import {
  processResendWebhookSideEffects,
  type ResendWebhookEvent,
} from '@/lib/firm-outreach/resend-webhook-process';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
/** Delivery webhooks must ack quickly; side effects run via after(). */
export const maxDuration = 15;

export async function POST(request: Request) {
  const rawBody = await request.text();

  const ok = verifyResendWebhookSignature(
    rawBody,
    {
      id: request.headers.get('svix-id'),
      timestamp: request.headers.get('svix-timestamp'),
      signature: request.headers.get('svix-signature'),
    },
    process.env.RESEND_WEBHOOK_SECRET,
  );
  if (!ok) {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
  }

  let body: ResendWebhookEvent;
  try {
    body = JSON.parse(rawBody) as ResendWebhookEvent;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Ack immediately after a valid signature. KV/job matching can stall during
  // outreach bursts; Resend disables endpoints that keep timing out.
  after(async () => {
    try {
      await processResendWebhookSideEffects(body);
    } catch (err) {
      console.error('[resend webhook] handler error after verify:', err);
    }
  });

  return NextResponse.json({ ok: true });
}
