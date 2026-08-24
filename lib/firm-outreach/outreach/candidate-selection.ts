import {
  firmSendCooldownDays,
  daysSince,
  nextOutreachStep,
  sequenceStepOf,
} from '@robertcashman/firm-outreach-core';
import { computeProspectPriority } from '../enrichment/scorer';
import {
  emailsWithIdempotentJobsForCampaign,
  type IdempotentJobHit,
} from '../email-jobs/storage';
import { isCampaignProspect } from '../campaign-scope';
import { normalizeEmail } from '../normalize';
import {
  emailsWithIndexedSendsForCampaign,
  getProspectsByIds,
  listProspectIdsByStatus,
  listProspectsByRecordStatus,
  listProspectsForFirmKey,
} from '../storage';
import type { FirmProspect } from '../types';

export { nextOutreachStep, sequenceStepOf };

const DEFAULT_READY_SCAN = 800;
const DEFAULT_SENT_SCAN = 400;
/** Chunk size when walking the shared ready status index. */
const READY_WALK_CHUNK = 100;
/**
 * Cap how many already-mailed ready rows we reconcile per tick.
 * Live (4da0858) only cleared ~40/tick while Phase B still burned on
 * idempotent_exists — raise so the clogged prefix drains in fewer ticks.
 */
const STALE_READY_RECONCILE_CAP = 300;

/**
 * Hint for status probes / logging. NOT a ceiling on how far the SEND path
 * may walk — send walks until it fills `readyLimit` sendable firms or the
 * ready index is exhausted (the old min(1200, readyLimit*6) ceiling was the
 * bug that left ~1.8k unsent firms unreachable).
 */
export function readyProspectScanLimit(readyLimit: number): number {
  return Math.max(readyLimit * 6, readyLimit);
}

export type StaleReadyReconcile = {
  prospect: FirmProspect;
  /** indexed send for this campaign, or terminal durable job status */
  reason: 'indexed_send' | IdempotentJobHit['status'];
  lastEmailAt?: string;
};

export async function firmRecentlyContacted(
  prospect: FirmProspect,
  campaignId: string,
): Promise<boolean> {
  const siblings = await listProspectsForFirmKey(prospect.firmKey);
  for (const s of siblings) {
    if (s.id === prospect.id || !isCampaignProspect(s, campaignId)) continue;
    if (s.lastEmailAt && daysSince(s.lastEmailAt) < firmSendCooldownDays()) {
      return true;
    }
  }
  return false;
}

function compareCandidates(
  a: { prospect: FirmProspect; step: number },
  b: { prospect: FirmProspect; step: number },
): number {
  // Initial sends before follow-ups.
  if (a.step !== b.step) return a.step - b.step;
  // Firms before solicitors (solicitors often hit firm_cooldown).
  if (a.prospect.prospectType !== b.prospect.prospectType) {
    return a.prospect.prospectType === 'firm' ? -1 : 1;
  }
  return computeProspectPriority(b.prospect) - computeProspectPriority(a.prospect);
}

/**
 * Build the send candidate pool:
 * - ready_to_send rows that have a valid next step (initial)
 * - sent rows that are actually due for follow-up
 *
 * Critical: do NOT pollute the pool with not-due `sent` rows — that was causing
 * production runs to spend the whole budget on `no_step` skips and send nothing.
 *
 * SEND path walks the ready status index until it has `readyLimit` actually
 * sendable firms (not already-mailed via send-index or terminal job) or the
 * index is exhausted. A fixed first-N campaign match scan left the unsent tail
 * unreachable when the prefix was clogged with idempotent_exists rows.
 */
export async function selectOutreachCandidates(opts: {
  campaignId: string;
  readyLimit?: number;
  sentLimit?: number;
  nowMs?: number;
  /** When true (default), drop solicitors whose firm was emailed inside the cooldown window. */
  excludeFirmCooldown?: boolean;
  /**
   * Status/health probes only need eligibility counts. Skipping the per-inbox
   * send-index / job fan-out keeps /firm-outreach-status under the ~60s proxy budget.
   */
  skipIndexedSendCheck?: boolean;
  /**
   * Hard cap on campaign-matching ready rows examined (status probes).
   * Ignored on the send path when skipIndexedSendCheck is false — send must
   * walk until readyLimit sendable or the index ends.
   */
  maxReadyScan?: number;
}): Promise<{
  candidates: Array<{ prospect: FirmProspect; step: number }>;
  readyScanned: number;
  sentScanned: number;
  readyEligible: number;
  followUpEligible: number;
  skippedIndexedSend: number;
  /** Ready rows skipped because a durable job already terminal for this campaign. */
  skippedIdempotentJob: number;
  firmCooldownSkipped: number;
  /** Ready rows already mailed (job or send) — caller may reconcile off the ready index. */
  staleReadyToReconcile: StaleReadyReconcile[];
  /** Total ready-index ids walked (including other campaigns). */
  readyIndexWalked: number;
}> {
  const readyLimit = opts.readyLimit ?? DEFAULT_READY_SCAN;
  const sentLimit = opts.sentLimit ?? DEFAULT_SENT_SCAN;
  const nowMs = opts.nowMs ?? Date.now();
  const excludeFirmCooldown = opts.excludeFirmCooldown !== false;
  const skipDeepChecks = opts.skipIndexedSendCheck === true;
  // Status only: bound how many campaign-ready rows we examine.
  const statusCampaignCap = skipDeepChecks
    ? Math.max(1, opts.maxReadyScan ?? readyProspectScanLimit(readyLimit))
    : Number.POSITIVE_INFINITY;

  const readyEligible: Array<{ prospect: FirmProspect; step: number }> = [];
  const staleReadyToReconcile: StaleReadyReconcile[] = [];
  let skippedIndexedSend = 0;
  let skippedIdempotentJob = 0;
  let readyScanned = 0;
  let readyIndexWalked = 0;

  const readyIds = await listProspectIdsByStatus('ready_to_send');
  const ids = readyIds;

  for (let i = 0; i < ids.length && readyEligible.length < readyLimit; i += READY_WALK_CHUNK) {
    if (readyScanned >= statusCampaignCap) break;

    const slice = ids.slice(i, i + READY_WALK_CHUNK);
    readyIndexWalked += slice.length;
    const map = await getProspectsByIds(slice);
    const batch: FirmProspect[] = [];
    for (const id of slice) {
      if (readyScanned >= statusCampaignCap) break;
      const p = map.get(id);
      if (!p || !isCampaignProspect(p, opts.campaignId) || p.status !== 'ready_to_send') {
        continue;
      }
      batch.push(p);
      readyScanned += 1;
    }
    if (batch.length === 0) continue;

    if (skipDeepChecks) {
      for (const prospect of batch) {
        if (readyEligible.length >= readyLimit) break;
        const step = nextOutreachStep(prospect, nowMs);
        if (step === null) continue;
        readyEligible.push({ prospect, step });
      }
      continue;
    }

    const emails = batch
      .map((p) => p.email)
      .filter((email): email is string => Boolean(email));
    const [indexedSends, idempotentJobs] = await Promise.all([
      emailsWithIndexedSendsForCampaign(emails, opts.campaignId),
      emailsWithIdempotentJobsForCampaign(emails, opts.campaignId, 0),
    ]);

    for (const prospect of batch) {
      if (readyEligible.length >= readyLimit) break;
      const step = nextOutreachStep(prospect, nowMs);
      if (step === null) continue;
      const email = prospect.email ? normalizeEmail(prospect.email) : '';
      if (step === 0 && email && indexedSends.has(email)) {
        skippedIndexedSend += 1;
        if (staleReadyToReconcile.length < STALE_READY_RECONCILE_CAP) {
          staleReadyToReconcile.push({ prospect, reason: 'indexed_send' });
        }
        continue;
      }
      const jobHit = step === 0 && email ? idempotentJobs.get(email) : undefined;
      if (jobHit) {
        skippedIdempotentJob += 1;
        if (staleReadyToReconcile.length < STALE_READY_RECONCILE_CAP) {
          staleReadyToReconcile.push({
            prospect,
            reason: jobHit.status,
            lastEmailAt: jobHit.acceptedAt ?? jobHit.updatedAt,
          });
        }
        continue;
      }
      readyEligible.push({ prospect, step });
    }
  }

  const sent = await listProspectsByRecordStatus('sent', sentLimit, {
    campaignId: opts.campaignId,
  });
  const followUpEligible: Array<{ prospect: FirmProspect; step: number }> = [];
  for (const prospect of sent) {
    const step = nextOutreachStep(prospect, nowMs);
    if (step === null) continue;
    followUpEligible.push({ prospect, step });
  }

  const ranked = [...readyEligible, ...followUpEligible].sort(compareCandidates);

  // Cache per firmKey so sibling cooldown lookups are O(firms) not O(prospects).
  const cooledFirmKeys = new Map<string, boolean>();
  let firmCooldownSkipped = 0;
  const candidates: Array<{ prospect: FirmProspect; step: number }> = [];

  for (const row of ranked) {
    if (excludeFirmCooldown && row.prospect.prospectType === 'solicitor') {
      const key = row.prospect.firmKey;
      let cooled = cooledFirmKeys.get(key);
      if (cooled === undefined) {
        cooled = await firmRecentlyContacted(row.prospect, opts.campaignId);
        cooledFirmKeys.set(key, cooled);
      }
      if (cooled) {
        firmCooldownSkipped++;
        continue;
      }
    }
    candidates.push(row);
  }

  return {
    candidates,
    readyScanned,
    sentScanned: sent.length,
    readyEligible: readyEligible.length,
    followUpEligible: followUpEligible.length,
    skippedIndexedSend,
    skippedIdempotentJob,
    firmCooldownSkipped,
    staleReadyToReconcile,
    readyIndexWalked,
  };
}
