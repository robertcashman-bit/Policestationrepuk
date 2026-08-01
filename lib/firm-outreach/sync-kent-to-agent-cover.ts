import { AGENT_COVER_KENT_CAMPAIGN_ID } from './campaign-scope';
import { isKentProspectInput } from './kent-filter';
import { buildProspectForCampaign, mergeProspect, type RawProspectInput } from './merge-prospects';
import { FIRM_OUTREACH_CAMPAIGN_ID } from './site-config';
import {
  getProspect,
  isDuplicateInitialSend,
  isSuppressed,
  listAllProspectIds,
  saveProspect,
} from './storage';
import type { FirmProspect, FirmProspectSource } from './types';

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
 * Mirror Kent-eligible RepUK prospects (with email) into agent_cover_kent_v1.
 * Idempotent: merge when PSA row already exists; skip suppressed / already-sent PSA.
 */
export async function syncKentProspectsToAgentCover(opts?: {
  dryRun?: boolean;
  limit?: number;
}): Promise<SyncKentToAgentCoverStats> {
  const dryRun = opts?.dryRun ?? false;
  const limit = opts?.limit ?? Number.POSITIVE_INFINITY;
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
  };

  const ids = await listAllProspectIds();
  for (const id of ids) {
    if (stats.created + stats.updated >= limit) break;
    const p = await getProspect(id);
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

    // Prefer ready when source already has a deliverable email and is not excluded.
    if (
      built.status !== 'excluded' &&
      p.status !== 'excluded' &&
      p.status !== 'bounced' &&
      p.status !== 'unsubscribed'
    ) {
      if (!built.lastEmailAt && built.email) {
        built.status = 'ready_to_send';
      }
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
    if (
      merged.status !== 'excluded' &&
      !merged.lastEmailAt &&
      merged.email &&
      ['discovered', 'enriched', 'no_email', 'ready_to_send'].includes(merged.status)
    ) {
      merged.status = 'ready_to_send';
    }
    await saveProspect(merged, existing.status);
    stats.updated++;
  }

  return stats;
}
