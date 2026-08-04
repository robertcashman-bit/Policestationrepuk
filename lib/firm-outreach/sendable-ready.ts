import { isPlausibleOutreachEmail } from './enrichment/validator';
import type { FirmProspect } from './types';

/**
 * Max gap before the same inbox may be contacted again via another prospect row.
 * Must not block different solicitors (or personal vs generic inboxes) at the same firm.
 */
export const FIRM_SEND_COOLDOWN_DAYS = 21;

/** True when a ready_to_send prospect should be counted/sent (not parked or junk). */
export function isSendableReadyProspect(prospect: FirmProspect): boolean {
  if (prospect.status !== 'ready_to_send') return false;
  if (!prospect.email?.trim()) return false;
  if (!isPlausibleOutreachEmail(prospect.email)) return false;
  if (prospect.nextEligibleAt) {
    const at = Date.parse(prospect.nextEligibleAt);
    if (Number.isFinite(at) && at > Date.now()) return false;
  }
  if (prospect.excludedReason === 'firm_cooldown' && prospect.nextEligibleAt) {
    const at = Date.parse(prospect.nextEligibleAt);
    if (Number.isFinite(at) && at > Date.now()) return false;
  }
  return true;
}

export function firmCooldownEligibleAt(latestSiblingEmailAt: string, cooldownDays: number): string {
  const base = Date.parse(latestSiblingEmailAt);
  if (!Number.isFinite(base)) {
    return new Date(Date.now() + cooldownDays * 86_400_000).toISOString();
  }
  return new Date(base + cooldownDays * 86_400_000).toISOString();
}
