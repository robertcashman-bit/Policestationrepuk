import type { FirmProspect } from '../types';

export const FOLLOWUP_DAY_1 = 7;
export const FOLLOWUP_DAY_2 = 21;

export function daysSinceIso(iso: string | undefined, nowMs = Date.now()): number {
  if (!iso) return Infinity;
  return (nowMs - Date.parse(iso)) / (1000 * 60 * 60 * 24);
}

export function dueForFollowUp(prospect: FirmProspect, nowMs = Date.now()): boolean {
  if (prospect.waLinkClickedAt || prospect.joinedWhatsAppAt) return false;
  if (!prospect.lastEmailAt) return prospect.status === 'ready_to_send';

  const days = daysSinceIso(prospect.lastEmailAt, nowMs);
  if (prospect.sequenceStep === 0 && days >= FOLLOWUP_DAY_1) return true;
  if (prospect.sequenceStep === 1 && days >= FOLLOWUP_DAY_2 - FOLLOWUP_DAY_1) return true;
  return false;
}

/**
 * Next outreach sequence step for this prospect, or null if nothing is due.
 * Kept in sync with the send loop in run-outreach.ts.
 */
export function nextOutreachStep(prospect: FirmProspect, nowMs = Date.now()): number | null {
  if (prospect.status === 'ready_to_send' && prospect.sequenceStep === 0 && !prospect.lastEmailAt) {
    return 0;
  }
  if (prospect.status === 'sent' && prospect.sequenceStep === 0 && dueForFollowUp(prospect, nowMs)) {
    return 1;
  }
  if (prospect.status === 'sent' && prospect.sequenceStep === 1 && dueForFollowUp(prospect, nowMs)) {
    return 2;
  }
  return null;
}
