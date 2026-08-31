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

export interface ResendWebhookEvent {
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

/**
 * Match sends/jobs and apply suppressions. May hit slow KV paths — must only
 * run after the HTTP 200 ack so Resend does not disable the endpoint.
 */
export async function processResendWebhookSideEffects(
  body: ResendWebhookEvent,
): Promise<void> {
  const type = body.type ?? '';
  const at = body.created_at ?? new Date().toISOString();
  const emails = emailsFromEvent(body.data);
  const resendMessageId = body.data?.email_id;

  if (
    type !== 'email.sent' &&
    type !== 'email.delivered' &&
    type !== 'email.opened' &&
    type !== 'email.clicked' &&
    type !== 'email.bounced' &&
    type !== 'email.complained'
  ) {
    return;
  }

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
