import { normalizeEmail } from '../normalize';
import { isPlausibleOutreachEmail } from '../enrichment/validator';
import {
  hasAcceptedOutreachToday,
  isDuplicateInitialSend,
  isSuppressed,
} from '../storage';

export type OutreachSendBlocker = 'suppressed' | 'duplicate' | 'junk_email';

export async function outreachEmailSendBlocker(opts: {
  email: string;
  prospectId: string;
  campaignId: string;
  step: number;
  emailsSentThisRun: Set<string>;
  today?: string;
}): Promise<OutreachSendBlocker | null> {
  const normalized = normalizeEmail(opts.email);
  if (opts.emailsSentThisRun.has(normalized)) return 'duplicate';
  if (await isSuppressed(opts.email)) return 'suppressed';
  if (!isPlausibleOutreachEmail(opts.email)) return 'junk_email';
  if (await hasAcceptedOutreachToday(opts.email, opts.today)) return 'duplicate';
  if (opts.step === 0 && (await isDuplicateInitialSend(opts.email, opts.prospectId, opts.campaignId))) {
    return 'duplicate';
  }
  return null;
}

export async function orderCampaignsByFewestSendsToday(
  campaignIds: readonly string[],
  getSentToday: (campaignId: string) => Promise<number>,
): Promise<string[]> {
  const scored = await Promise.all(
    campaignIds.map(async (id, index) => ({
      id,
      index,
      sent: await getSentToday(id),
    })),
  );
  scored.sort((a, b) => a.sent - b.sent || a.index - b.index);
  return scored.map((row) => row.id);
}
