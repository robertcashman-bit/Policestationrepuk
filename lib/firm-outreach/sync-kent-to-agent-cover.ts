import { AGENT_COVER_KENT_CAMPAIGN_ID } from './campaign-scope';
import { isKentProspectInput } from './kent-filter';
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
  kentEligible: number;
  created: number;
  updated: number;
  skippedNoEmail: number;
  skippedSuppressed: number;
  skippedDuplicate: number;
  skippedExistingSent: number;
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
 * Include `excluded`: Kent firms are often demoted on RepUK as duplicate_email /
 * duplicate_firm while still valid for a separate PSA campaign send.
 */
const SOURCE_STATUSES: FirmProspectStatus[] = [
  'ready_to_send',
  'enriched',
  'sent',
  'excluded',
];

/** RepUK-only exclusion reasons that must not block PSA outreach. */
function isRepukOnlyExclusion(reason: string | undefined): boolean {
  if (!reason) return false;
  return (
    reason.startsWith('duplicate_') ||
    reason === 'already_contacted_firm' ||
    reason === 'firm_cooldown'
  );
}

/**
 * Mirror Kent-eligible RepUK prospects (with email) into agent_cover_kent_v1.
 * Idempotent: merge when PSA row already exists; skip suppressed / already-sent PSA.
 *
 * Scans campaign-scoped status indexes (batched mget) — not the full prospect index —
 * so it can finish inside Vercel cron limits.
 */
export async function syncKentProspectsToAgentCover(opts?: {
  dryRun?: boolean;
  limit?: number;
  /** Wall-clock budget; stop cleanly when exceeded. */
  maxElapsedMs?: number;
}): Promise<SyncKentToAgentCoverStats> {
  const dryRun = opts?.dryRun ?? false;
  const limit = opts?.limit ?? 200;
  const maxElapsedMs = opts?.maxElapsedMs ?? 55_000;
  const started = Date.now();
  const stats: SyncKentToAgentCoverStats = {
    scanned: 0,
    kentEligible: 0,
    created: 0,
    updated: 0,
    skippedNoEmail: 0,
    skippedSuppressed: 0,
    skippedDuplicate: 0,
    skippedExistingSent: 0,
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
      if (!isKentProspectInput(p)) continue;
      stats.kentEligible++;

      if (await isSuppressed(p.email)) {
        stats.skippedSuppressed++;
        continue;
      }

      const built = buildProspectForCampaign(AGENT_COVER_KENT_CAMPAIGN_ID, toInput(p));
      if (!built) continue;

      // Allow RepUK duplicate exclusions through — they are still valid PSA targets.
      if (p.status === 'excluded' && !isRepukOnlyExclusion(p.excludedReason)) {
        continue;
      }

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

      // PSA is a separate campaign: promote to ready when we have a firm email.
      if (built.email && !built.lastEmailAt) {
        built.status = 'ready_to_send';
        built.excludedReason = undefined;
      }

      if (dryRun) {
        if (existing) stats.updated++;
        else stats.created++;
        continue;
      }

      if (!existing) {
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
      // Revive PSA rows stuck in discovered/excluded/no_email when Kent+email exists.
      if (
        !merged.lastEmailAt &&
        merged.email &&
        ['discovered', 'enriched', 'no_email', 'ready_to_send', 'excluded'].includes(
          merged.status,
        )
      ) {
        merged.status = 'ready_to_send';
        merged.excludedReason = undefined;
      }
      await saveProspect(merged, existing.status);
      stats.updated++;
    }
  }

  stats.elapsedMs = Date.now() - started;
  return stats;
}
