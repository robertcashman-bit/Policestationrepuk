import { Resend } from 'resend';
import {
  applySendWebhookEvent,
  listRecentSends,
} from '@/lib/firm-outreach/storage';
import {
  findEmailJobForWebhook,
  listEmailJobIdsByStatus,
  getEmailJob,
  markJobFromWebhookEvent,
} from '@/lib/firm-outreach/email-jobs/storage';
const LAST_EVENT_TO_WEBHOOK: Record<string, string> = {
  sent: 'email.sent',
  delivered: 'email.delivered',
  opened: 'email.opened',
  clicked: 'email.clicked',
  bounced: 'email.bounced',
  complained: 'email.complained',
};

export interface BackfillDeliveryResult {
  scanned: number;
  applied: number;
  jobsUpdated: number;
  skipped: number;
  errors: number;
  samples: Array<{ resendMessageId: string; lastEvent: string; applied: boolean }>;
}

function mapLastEvent(lastEvent: string | undefined): string | null {
  if (!lastEvent) return null;
  return LAST_EVENT_TO_WEBHOOK[lastEvent] ?? null;
}

/**
 * Reconcile sends stuck at `sent` (and accepted jobs) by reading Resend's
 * emails.get last_event — substitutes for dashboard webhook replay.
 */
export async function backfillDeliveryFromResend(opts?: {
  limit?: number;
  apiKey?: string;
}): Promise<BackfillDeliveryResult> {
  const limit = opts?.limit ?? 50;
  const key = (opts?.apiKey ?? process.env.RESEND_API_KEY)?.trim();
  const result: BackfillDeliveryResult = {
    scanned: 0,
    applied: 0,
    jobsUpdated: 0,
    skipped: 0,
    errors: 0,
    samples: [],
  };
  if (!key) {
    result.errors = 1;
    return result;
  }

  const resend = new Resend(key);
  const recent = await listRecentSends(Math.max(limit * 3, 100));
  const stuck = recent.filter((s) => s.resendMessageId && s.status === 'sent');
  const targets = stuck.slice(0, limit);

  // Also cover accepted jobs whose send row may already say delivered but job did not.
  const acceptedIds = await listEmailJobIdsByStatus('accepted', limit);
  const messageIds = new Set(targets.map((s) => s.resendMessageId!).filter(Boolean));
  for (const id of acceptedIds) {
    if (messageIds.size >= limit) break;
    const job = await getEmailJob(id);
    if (job?.providerMessageId) messageIds.add(job.providerMessageId);
  }

  for (const messageId of [...messageIds].slice(0, limit)) {
    result.scanned++;
    try {
      const { data, error } = await resend.emails.get(messageId);
      if (error || !data) {
        result.errors++;
        continue;
      }
      const lastEvent = (data as { last_event?: string }).last_event;
      const eventType = mapLastEvent(lastEvent);
      if (!eventType || eventType === 'email.sent') {
        result.skipped++;
        result.samples.push({
          resendMessageId: messageId,
          lastEvent: lastEvent ?? 'none',
          applied: false,
        });
        continue;
      }

      const send = await applySendWebhookEvent({
        resendMessageId: messageId,
        eventType,
        at: new Date().toISOString(),
      });
      const job =
        (await findEmailJobForWebhook({
          providerMessageId: messageId,
          sendId: send?.id,
        })) ?? null;
      let jobUpdated = false;
      if (job) {
        const updated = await markJobFromWebhookEvent(job, eventType);
        jobUpdated = Boolean(updated && updated.status !== 'accepted');
        if (jobUpdated) result.jobsUpdated++;
      }

      if (send || jobUpdated) {
        result.applied++;
        result.samples.push({
          resendMessageId: messageId,
          lastEvent: lastEvent ?? eventType,
          applied: true,
        });
      } else {
        result.skipped++;
        result.samples.push({
          resendMessageId: messageId,
          lastEvent: lastEvent ?? eventType,
          applied: false,
        });
      }
    } catch {
      result.errors++;
    }
  }

  return result;
}
