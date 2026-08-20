/**
 * Mirror email-ready agent_cover_kent_v1 prospects into whatsapp_invite_v1.
 * PSA sends stay permanently disabled; this only rebuilds RepUK directory/WhatsApp inventory
 * from the shared firm list that was previously cloned into the Kent campaign.
 */
import { AGENT_COVER_KENT_CAMPAIGN_ID } from './campaign-scope';
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

export interface SyncAgentCoverToRepukStats {
  scanned: number;
  eligible: number;
  created: number;
  updated: number;
  skippedNoEmail: number;
  skippedSuppressed: number;
  skippedDuplicate: number;
  skippedExistingSent: number;
  skippedAlreadyReady: number;
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

const SOURCE_STATUSES: FirmProspectStatus[] = [
  'ready_to_send',
  'enriched',
  'sent',
  'excluded',
];

/** PSA-only exclusion reasons that should not block a RepUK WhatsApp / directory invite. */
function isPsaOnlyExclusion(reason: string | undefined): boolean {
  if (!reason) return false;
  return (
    reason.startsWith('duplicate_') ||
    reason === 'already_contacted_firm' ||
    reason === 'firm_cooldown' ||
    reason === 'not_kent_for_agent_cover' ||
    reason === 'agent_cover_outreach_permanently_disabled'
  );
}

/**
 * Clone agent_cover_kent_v1 rows (with email) into whatsapp_invite_v1.
 * Uses RepUK campaign IDs / templates / from-address — never PSA copy.
 */
export async function syncAgentCoverInventoryToRepuk(opts?: {
  dryRun?: boolean;
  limit?: number;
  maxElapsedMs?: number;
}): Promise<SyncAgentCoverToRepukStats> {
  const dryRun = opts?.dryRun ?? false;
  const limit = opts?.limit ?? 400;
  const maxElapsedMs = opts?.maxElapsedMs ?? 120_000;
  const started = Date.now();
  const stats: SyncAgentCoverToRepukStats = {
    scanned: 0,
    eligible: 0,
    created: 0,
    updated: 0,
    skippedNoEmail: 0,
    skippedSuppressed: 0,
    skippedDuplicate: 0,
    skippedExistingSent: 0,
    skippedAlreadyReady: 0,
    dryRun,
    truncated: false,
    elapsedMs: 0,
  };

  const seen = new Set<string>();
  const sourceIds: string[] = [];
  for (const status of SOURCE_STATUSES) {
    const ids = await listProspectIdsByRecordStatus(status, {
      campaignId: AGENT_COVER_KENT_CAMPAIGN_ID,
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
      if (!p || p.campaignId !== AGENT_COVER_KENT_CAMPAIGN_ID) continue;
      stats.scanned++;

      if (!p.email?.trim()) {
        stats.skippedNoEmail++;
        continue;
      }

      if (p.status === 'excluded' && !isPsaOnlyExclusion(p.excludedReason)) {
        continue;
      }

      stats.eligible++;

      if (await isSuppressed(p.email)) {
        stats.skippedSuppressed++;
        continue;
      }

      const built = buildProspectForCampaign(FIRM_OUTREACH_CAMPAIGN_ID, toInput(p));
      if (!built) continue;

      const existing = await getProspect(built.id);
      if (existing?.lastEmailAt || existing?.status === 'sent') {
        stats.skippedExistingSent++;
        continue;
      }

      if (
        existing &&
        existing.status === 'ready_to_send' &&
        !existing.excludedReason &&
        existing.email &&
        built.email &&
        existing.email.trim().toLowerCase() === built.email.trim().toLowerCase()
      ) {
        stats.skippedAlreadyReady++;
        continue;
      }

      if (
        built.email &&
        (await isDuplicateInitialSend(built.email, built.id, FIRM_OUTREACH_CAMPAIGN_ID))
      ) {
        stats.skippedDuplicate++;
        continue;
      }

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
      if (!merged.websiteUrl && built.websiteUrl) {
        merged.websiteUrl = built.websiteUrl;
      }
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

      const meaningfulChange =
        merged.status !== existing.status ||
        merged.email !== existing.email ||
        merged.excludedReason !== existing.excludedReason ||
        merged.websiteUrl !== existing.websiteUrl;
      if (!meaningfulChange) {
        stats.skippedAlreadyReady++;
        continue;
      }

      await saveProspect(merged, existing.status);
      stats.updated++;
    }
  }

  stats.elapsedMs = Date.now() - started;
  return stats;
}
