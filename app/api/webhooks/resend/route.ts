import { NextResponse } from 'next/server';
import {
  addSuppression,
  applySendWebhookEvent,
  getProspect,
  saveProspect,
} from '@/lib/firm-outreach/storage';
import {
  findEmailJobForWebhook,
  markJobFromWebhookEvent,
} from '@/lib/firm-outreach/email-jobs/storage';
import { verifyResendWebhookSignature } from '@/lib/firm-outreach/resend-webhook-verify';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
/** Delivery webhooks must ack quickly; avoid long fallback scans. */
export const maxDuration = 15;

interface ResendWebhookEvent {
  type?: string;
  created_at?: string;
  data?: {
    to?: string | string[];
    email_id?: string;
  };
}

function emailsFromEvent(data: ResendWebhookEvent['data']): string[] {
  const toRaw = data?.to;
  if (Array.isArray(toRaw)) return toRaw.map((e) => e.toLowerCase());
  if (toRaw) return [toRaw.toLowerCase()];
  return [];
}

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

  const type = body.type ?? '';
  const at = body.created_at ?? new Date().toISOString();
  const emails = emailsFromEvent(body.data);
  const resendMessageId = body.data?.email_id;

  try {
    if (
      type === 'email.sent' ||
      type === 'email.delivered' ||
      type === 'email.opened' ||
      type === 'email.clicked' ||
      type === 'email.bounced' ||
      type === 'email.complained'
    ) {
      const reason = type === 'email.complained' ? 'complaint' : 'bounce';
      const targets = emails.length > 0 ? emails : [undefined];
      // Resolve the email job once — providerMessageId/sendId do not vary by recipient.
      let job = resendMessageId
        ? await findEmailJobForWebhook({ providerMessageId: resendMessageId })
        : null;
      let jobMarked = false;
      for (const email of targets) {
        const send = await applySendWebhookEvent({
          resendMessageId,
          email,
          eventType: type,
          at,
        });

        if (!job && send?.id) {
          job = await findEmailJobForWebhook({
            providerMessageId: resendMessageId,
            sendId: send.id,
          });
        }
        if (job && !jobMarked) {
          await markJobFromWebhookEvent(job, type);
          jobMarked = true;
        }

        if (send && (type === 'email.bounced' || type === 'email.complained')) {
          await addSuppression(send.email, reason);
          const prospect = await getProspect(send.prospectId);
          if (prospect) {
            const prev = prospect.status;
            prospect.status = reason === 'complaint' ? 'unsubscribed' : 'bounced';
            prospect.updatedAt = new Date().toISOString();
            await saveProspect(prospect, prev);
          }
        }
      }
    }
  } catch (err) {
    // Signature was valid — ack so Resend does not mark the endpoint failing.
    console.error('[resend webhook] handler error after verify:', err);
  }

  return NextResponse.json({ ok: true });
}
