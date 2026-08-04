import { AGENT_COVER_KENT_CAMPAIGN_ID } from './campaign-scope';
import {
  applyFirmCooldownPark,
  isCrossCampaignCooldownActive,
} from './cross-campaign-cooldown';
import { buildProspectForCampaign, mergeProspect, type RawProspectInput } from './merge-prospects';
import { FIRM_OUTREACH_CAMPAIGN_ID } from './site-config';
import {
  getProspect,
  getProspectsByIds,
  isDuplicateInitialSend,
  isSuppressed,
  listProspectIdsByRecordStatus,
  saveProspect,
} from './storage';
import type { FirmProspect, FirmProspectSource, FirmProspectStatus } from './types';

export interface SyncKentToAgentCoverStats {
  scanned: number;
  /** Nationwide eligible RepUK rows with email (name kept for API compat). */
  kentEligible: number;
  eligible: number;
  created: number;
  updated: number;
  skippedNoEmail: number;
  skippedSuppressed: number;
  skippedDuplicate: number;
  skippedExistingSent: number;
  /** Parked ready with firm_cooldown / nextEligibleAt due to other-campaign contact. */
  parkedCooldown: number;
  dryRun: boolean;
  truncated: boolean;
  elapsedMs: number;
}

function sourceFromProspect(p: FirmProspect): FirmProspectSource {
  if (p.sources.includes('dscc')) return 'dscc';
  if (p.sources.includes('laa')) return 'laa';
  if (p.sources.includes('directory')) return 'directory';
  if (p.sources.includes('archive')) return 'archive';
  return p.sources[0] ?? 'manual';
}

function toInput(p: FirmProspect): RawProspectInput {
  return {
    prospectType: p.prospectType,
    firmName: p.firmName,
    contactName: p.contactName,
    title: p.title,
    forename: p.forename,
    surname: p.surname,
    town: p.town,
    county: p.county,
    postcode: p.postcode,
    phone: p.phone,
    websiteUrl: p.websiteUrl,
    regulatoryNumber: p.regulatoryNumber,
    email: p.email,
    emailConfidence: p.emailConfidence,
    emailScore: p.emailScore,
    source: sourceFromProspect(p),
    priorityBoost: Math.max(0, (p.priorityScore ?? 0) - 30),
  };
}

/**
 * RepUK statuses worth cloning into PSA.
 * Include `excluded`: firms demoted on RepUK as duplicate_email are still valid
 * for a separate PSA campaign (Kent cover offer, nationwide recipients).
 */
const SOURCE_STATUSES: FirmProspectStatus[] = [
  'ready_to_send',
  'enriched',
  'sent',
  'excluded',
];

/**
 * RepUK-only exclusion reasons that must not block cloning into PSA.
 * `firm_cooldown` is allowed through so the PSA row is created/updated, then
 * `parkIfCrossCampaignCooldown` re-applies nextEligibleAt instead of wiping it.
 */
function isRepukOnlyExclusion(reason: string | undefined): boolean {
  if (!reason) return false;
  return (
    reason.startsWith('duplicate_') ||
    reason === 'already_contacted_firm' ||
    reason === 'firm_cooldown'
  );
}

async function parkIfCrossCampaignCooldown(prospect: FirmProspect): Promise<boolean> {
  const cool = await isCrossCampaignCooldownActive({
    firmKey: prospect.firmKey,
    email: prospect.email,
    excludeProspectId: prospect.id,
  });
  if (!cool.active || !cool.eligibleAt) return false;
  applyFirmCooldownPark(prospect, cool.eligibleAt);
  return true;
}

/**
 * Mirror RepUK prospects (with email) into agent_cover_kent_v1 nationwide.
 * Campaign copy still offers Kent police-station cover; recipients are England & Wales.
 * Idempotent: merge when PSA row already exists; skip suppressed / already-sent PSA.
 */
export async function syncKentProspectsToAgentCover(opts?: {
  dryRun?: boolean;
  limit?: number;
  maxElapsedMs?: number;
}): Promise<SyncKentToAgentCoverStats> {
  const dryRun = opts?.dryRun ?? false;
  const limit = opts?.limit ?? 200;
  const maxElapsedMs = opts?.maxElapsedMs ?? 55_000;
  const started = Date.now();
  const stats: SyncKentToAgentCoverStats = {
    scanned: 0,
    kentEligible: 0,
    eligible: 0,
    created: 0,
    updated: 0,
    skippedNoEmail: 0,
    skippedSuppressed: 0,
    skippedDuplicate: 0,
    skippedExistingSent: 0,
    parkedCooldown: 0,
    dryRun,
    truncated: false,
    elapsedMs: 0,
  };

  const seen = new Set<string>();
  const sourceIds: string[] = [];
  for (const status of SOURCE_STATUSES) {
    const ids = await listProspectIdsByRecordStatus(status, {
      campaignId: FIRM_OUTREACH_CAMPAIGN_ID,
    });
    for (const id of ids) {
      if (seen.has(id)) continue;
      seen.add(id);
      sourceIds.push(id);
    }
  }

  const CHUNK = 80;
  for (let i = 0; i < sourceIds.length; i += CHUNK) {
    if (Date.now() - started >= maxElapsedMs) {
      stats.truncated = true;
      break;
    }
    if (stats.created + stats.updated >= limit) {
      stats.truncated = true;
      break;
    }

    const chunkIds = sourceIds.slice(i, i + CHUNK);
    const map = await getProspectsByIds(chunkIds);

    for (const id of chunkIds) {
      if (Date.now() - started >= maxElapsedMs) {
        stats.truncated = true;
        break;
      }
      if (stats.created + stats.updated >= limit) {
        stats.truncated = true;
        break;
      }

      const p = map.get(id);
      if (!p || p.campaignId !== FIRM_OUTREACH_CAMPAIGN_ID) continue;
      stats.scanned++;

      if (!p.email?.trim()) {
        stats.skippedNoEmail++;
        continue;
      }

      // Allow RepUK duplicate exclusions through — still valid PSA targets.
      if (p.status === 'excluded' && !isRepukOnlyExclusion(p.excludedReason)) {
        continue;
      }

      stats.eligible++;
      stats.kentEligible = stats.eligible;

      if (await isSuppressed(p.email)) {
        stats.skippedSuppressed++;
        continue;
      }

      const built = buildProspectForCampaign(AGENT_COVER_KENT_CAMPAIGN_ID, toInput(p));
      if (!built) continue;

      const existing = await getProspect(built.id);
      if (existing?.lastEmailAt || existing?.status === 'sent') {
        stats.skippedExistingSent++;
        continue;
      }

      if (
        built.email &&
        (await isDuplicateInitialSend(built.email, built.id, AGENT_COVER_KENT_CAMPAIGN_ID))
      ) {
        stats.skippedDuplicate++;
        continue;
      }

      // PSA is a separate campaign: promote to ready when we have a firm email,
      // then park behind cross-campaign cooldown when RepUK (or any sibling) already mailed.
      if (built.email && !built.lastEmailAt) {
        built.status = 'ready_to_send';
        built.excludedReason = undefined;
        built.nextEligibleAt = undefined;
      }

      if (dryRun) {
        const probe = existing ? mergeProspect(existing, built) : built;
        if (
          probe.email &&
          !probe.lastEmailAt &&
          (await parkIfCrossCampaignCooldown(probe))
        ) {
          stats.parkedCooldown++;
        }
        if (existing) stats.updated++;
        else stats.created++;
        continue;
      }

      if (!existing) {
        if (built.email && !built.lastEmailAt) {
          if (await parkIfCrossCampaignCooldown(built)) stats.parkedCooldown++;
        }
        await saveProspect(built);
        stats.created++;
        continue;
      }

      const merged = mergeProspect(existing, built);
      if (!existing.email && built.email) {
        merged.email = built.email;
        merged.emailConfidence = built.emailConfidence;
        merged.emailScore = built.emailScore;
      }
      if (!merged.websiteUrl && built.websiteUrl) {
        merged.websiteUrl = built.websiteUrl;
      }
      // Revive PSA rows stuck in discovered/excluded/no_email when email exists.
      // Includes former not_kent_for_agent_cover rows — recipients are now nationwide.
      if (
        !merged.lastEmailAt &&
        merged.email &&
        ['discovered', 'enriched', 'no_email', 'ready_to_send', 'excluded'].includes(
          merged.status,
        )
      ) {
        merged.status = 'ready_to_send';
        merged.excludedReason = undefined;
        if (await parkIfCrossCampaignCooldown(merged)) {
          stats.parkedCooldown++;
        } else {
          merged.nextEligibleAt = undefined;
        }
      }
      await saveProspect(merged, existing.status);
      stats.updated++;
    }
  }

  stats.elapsedMs = Date.now() - started;
  stats.kentEligible = stats.eligible;
  return stats;
}
