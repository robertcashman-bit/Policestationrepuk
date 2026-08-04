import { daysSince, firmSendCooldownDays } from '@robertcashman/firm-outreach-core';
import { firmCooldownEligibleAt } from './sendable-ready';
import { listProspectsForFirmKey, listSendsForEmail } from './storage';
import type { FirmProspect } from './types';

const SUCCESS_SEND = new Set(['sent', 'delivered', 'opened', 'clicked', 'queued']);

/**
 * Latest successful contact time for this firm/inbox across *all* campaigns.
 * Used so PSA sync/revive (and send cooldown) do not immediately re-mail a firm
 * that RepUK (or any sibling campaign) already contacted.
 */
export async function latestCrossCampaignContactAt(opts: {
  firmKey: string;
  email?: string | null;
  excludeProspectId?: string;
}): Promise<string | null> {
  let latestMs = 0;
  let latestAt: string | null = null;

  const consider = (iso: string | undefined | null) => {
    if (!iso) return;
    const ms = Date.parse(iso);
    if (!Number.isFinite(ms) || ms <= latestMs) return;
    latestMs = ms;
    latestAt = iso;
  };

  const siblings = await listProspectsForFirmKey(opts.firmKey);
  for (const s of siblings) {
    if (opts.excludeProspectId && s.id === opts.excludeProspectId) continue;
    consider(s.lastEmailAt);
  }

  const email = opts.email?.trim();
  if (email) {
    const sends = await listSendsForEmail(email);
    for (const send of sends) {
      if (!SUCCESS_SEND.has(send.status)) continue;
      consider(send.sentAt ?? send.createdAt);
    }
  }

  return latestAt;
}

export async function isCrossCampaignCooldownActive(opts: {
  firmKey: string;
  email?: string | null;
  excludeProspectId?: string;
  nowMs?: number;
}): Promise<{ active: boolean; latestAt: string | null; eligibleAt: string | null }> {
  const latestAt = await latestCrossCampaignContactAt(opts);
  if (!latestAt) {
    return { active: false, latestAt: null, eligibleAt: null };
  }
  const cooldownDays = firmSendCooldownDays();
  const ageDays = daysSince(latestAt);
  if (ageDays >= cooldownDays) {
    return { active: false, latestAt, eligibleAt: null };
  }
  return {
    active: true,
    latestAt,
    eligibleAt: firmCooldownEligibleAt(latestAt, cooldownDays),
  };
}

/** Park a prospect behind cross-campaign firm cooldown (keeps ready_to_send + nextEligibleAt). */
export function applyFirmCooldownPark(
  prospect: FirmProspect,
  eligibleAt: string,
): FirmProspect {
  prospect.status = 'ready_to_send';
  prospect.excludedReason = 'firm_cooldown';
  prospect.nextEligibleAt = eligibleAt;
  prospect.updatedAt = new Date().toISOString();
  return prospect;
}
