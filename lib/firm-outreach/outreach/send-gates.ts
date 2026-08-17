import { normalizeEmail } from '../normalize';
import { isPlausibleOutreachEmail } from '../enrichment/validator';
import {
  emailHasAcceptedSendOnDate,
  emailHasInitialOutreachFromOtherProspect,
  isSuppressed,
  listSendsForEmail,
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
  // Indexed lookup only. A full send-table scan here (allowFullScan) made
  // every never-mailed inbox reload all historical sends — Vercel 300s 504s.
  const today = opts.today ?? new Date().toISOString().slice(0, 10);
  const sends = await listSendsForEmail(opts.email);
  if (emailHasAcceptedSendOnDate(sends, opts.email, today)) return 'duplicate';
  if (
    opts.step === 0 &&
    emailHasInitialOutreachFromOtherProspect(sends, opts.email, opts.prospectId)
  ) {
    return 'duplicate';
  }
  return null;
}

/** Remaining ms for the next campaign, or null when the shared tick budget is gone. */
export function remainingCampaignBudgetMs(opts: {
  startedMs: number;
  nowMs: number;
  totalBudgetMs: number;
  reserveMs?: number;
  minSliceMs?: number;
}): number | null {
  const reserveMs = opts.reserveMs ?? 8_000;
  const minSliceMs = opts.minSliceMs ?? 12_000;
  const remaining = opts.totalBudgetMs - (opts.nowMs - opts.startedMs) - reserveMs;
  return remaining < minSliceMs ? null : remaining;
}

/**
 * Equal guaranteed slice per campaign, plus leftover from campaigns that finished early.
 * Prevents the first campaign from consuming the whole Vercel tick.
 */
export function nextCampaignTimeSlice(opts: {
  totalBudgetMs: number;
  campaignCount: number;
  leftoverMs: number;
  minSliceMs?: number;
}): number {
  const count = Math.max(1, opts.campaignCount);
  const minSliceMs = opts.minSliceMs ?? 45_000;
  const guaranteed = Math.max(minSliceMs, Math.floor(opts.totalBudgetMs / count));
  return guaranteed + Math.max(0, opts.leftoverMs);
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
