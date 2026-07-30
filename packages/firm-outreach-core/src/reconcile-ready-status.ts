import { isPlausibleOutreachEmail } from './enrichment/validator';
import type { FirmProspect, FirmProspectStatus } from './types';

const FOLLOWUP_DAY_1 = 7;

function daysSince(iso: string | undefined): number {
  if (!iso) return Infinity;
  return (Date.now() - Date.parse(iso)) / (1000 * 60 * 60 * 24);
}

/** Whether any outreach email was already recorded on this prospect. */
export function prospectHasInitialSend(prospect: Pick<FirmProspect, 'lastEmailAt' | 'sequenceStep'>): boolean {
  // Any lastEmailAt means contact already happened (step 0 initial or later follow-ups).
  // sequenceStep is ignored: stale ready_to_send rows often keep step 1/2 after sends.
  return Boolean(prospect.lastEmailAt);
}

/**
 * ready_to_send + lastEmailAt is a stale index state: a send already happened
 * but status was not moved to sent (or was re-promoted). That floods the send
 * queue with no_step skips and blocks genuine ready initials + due follow-ups.
 */
export function reconcileReadyProspectStatus(
  prospect: Pick<FirmProspect, 'status' | 'lastEmailAt' | 'sequenceStep' | 'email'>,
): FirmProspectStatus | null {
  if (prospect.status !== 'ready_to_send') return null;

  if (prospectHasInitialSend(prospect)) {
    return 'sent';
  }

  const email = prospect.email?.trim();
  if (email && !isPlausibleOutreachEmail(email)) {
    return 'discovered';
  }

  return null;
}

/** True when a sent prospect is due for follow-up step 1 (day 7). */
export function isDueForFollowUpStep1(
  prospect: Pick<FirmProspect, 'sequenceStep' | 'lastEmailAt' | 'waLinkClickedAt' | 'joinedWhatsAppAt'>,
): boolean {
  if (prospect.waLinkClickedAt || prospect.joinedWhatsAppAt) return false;
  if (prospect.sequenceStep !== 0 || !prospect.lastEmailAt) return false;
  return daysSince(prospect.lastEmailAt) >= FOLLOWUP_DAY_1;
}
