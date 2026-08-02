import { Resend } from 'resend';
import {
  addSuppression,
  applySendWebhookEvent,
  getProspect,
  listRecentSends,
  saveProspect,
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
  // Bound KV reads tightly — full SEND_INDEX scans previously caused 504s on cron.
  const recent = await listRecentSends(Math.min(80, Math.max(limit * 2, 30)));
  const stuck = recent.filter((s) => s.resendMessageId && s.status === 'sent');
  const stuckMessageIds = stuck
    .map((s) => s.resendMessageId!)
    .filter(Boolean);

  // Also cover accepted jobs whose send row may already say delivered but job did not.
  const acceptedIds = await listEmailJobIdsByStatus('accepted', limit);
  const acceptedMessageIds: string[] = [];
  for (const id of acceptedIds) {
    const job = await getEmailJob(id);
    if (job?.providerMessageId) acceptedMessageIds.push(job.providerMessageId);
  }

  // Reserve half the budget for accepted-only jobs so a stuck-send backlog
  // cannot starve job reconciliation in a single cron run.
  const stuckSet = new Set(stuckMessageIds);
  const acceptedOnly = acceptedMessageIds.filter((id) => !stuckSet.has(id));
  const acceptedSlots = Math.min(acceptedOnly.length, Math.ceil(limit / 2));
  const pickedAccepted = acceptedOnly.slice(0, acceptedSlots);
  const pickedStuck = stuckMessageIds.slice(0, limit - pickedAccepted.length);
  const leftover = limit - pickedStuck.length - pickedAccepted.length;
  const messageIds = [
    ...pickedStuck,
    ...pickedAccepted,
    ...acceptedOnly.slice(acceptedSlots, acceptedSlots + leftover),
  ];

  for (const messageId of messageIds) {
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

      if (send && (eventType === 'email.bounced' || eventType === 'email.complained')) {
        const reason = eventType === 'email.complained' ? 'complaint' : 'bounce';
        await addSuppression(send.email, reason);
        const prospect = await getProspect(send.prospectId);
        if (prospect) {
          const prev = prospect.status;
          prospect.status = reason === 'complaint' ? 'unsubscribed' : 'bounced';
          prospect.updatedAt = new Date().toISOString();
          await saveProspect(prospect, prev);
        }
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
