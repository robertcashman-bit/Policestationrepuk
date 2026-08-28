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
import { isSendableReadyProspect } from '../sendable-ready';
import {
  emailsWithIndexedSendsForCampaign,
  getProspectsByIds,
  listProspectIdsByStatus,
  listProspectsForFirmKey,
} from '../storage';
import type { FirmProspect } from '../types';

export { nextOutreachStep, sequenceStepOf };

const DEFAULT_READY_SCAN = 800;
const DEFAULT_SENT_SCAN = 400;
/** Chunk size when walking the shared ready/sent status indexes. */
const READY_WALK_CHUNK = 100;
/**
 * Max stale-ready rows to *collect* for post-send reconcile.
 * Keep modest — live c64fc35 reconciled hundreds *before* send and burned
 * the whole tick (attempted=0, elapsed≈200s).
 */
export const STALE_READY_RECONCILE_CAP = 80;

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
   * walk until readyLimit sendable or the index ends (or deadlineMs).
   */
  maxReadyScan?: number;
  /**
   * Wall-clock deadline for the ready walk (send path). Stop once past this
   * even if readyLimit is not filled — leave time for enqueue/send in the
   * same tick. Live c64fc35 walked+reconciled for ~200s with attempted=0.
   */
  deadlineMs?: number;
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
  /**
   * Sent rows whose next follow-up step already has a terminal job, but
   * prospect.sequenceStep was never advanced — caller should advance after send.
   */
  staleFollowUpsToReconcile: Array<
    StaleReadyReconcile & { advanceToStep: number }
  >;
  /** Total ready-index ids walked (including other campaigns). */
  readyIndexWalked: number;
  /** True when the ready walk stopped early due to deadlineMs. */
  selectionTimedOut: boolean;
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
  const deadlineMs = opts.deadlineMs ?? Number.POSITIVE_INFINITY;

  const readyEligible: Array<{ prospect: FirmProspect; step: number }> = [];
  const staleReadyToReconcile: StaleReadyReconcile[] = [];
  let skippedIndexedSend = 0;
  let skippedIdempotentJob = 0;
  let readyScanned = 0;
  let readyIndexWalked = 0;
  let selectionTimedOut = false;

  const ids = await listProspectIdsByStatus('ready_to_send');

  for (let i = 0; i < ids.length && readyEligible.length < readyLimit; i += READY_WALK_CHUNK) {
    if (Date.now() >= deadlineMs) {
      selectionTimedOut = true;
      break;
    }
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
      // Parked / junk leftovers stay on the ready index and inflate digests —
      // never treat them as enqueueable (live Aug 26–27: ready>0 / eligible=0).
      if (!isSendableReadyProspect(p)) {
        readyScanned += 1;
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
      if (step === null) {
        // Stale ready+lastEmailAt not yet due — reconcile off ready index later.
        if (prospect.lastEmailAt && staleReadyToReconcile.length < STALE_READY_RECONCILE_CAP) {
          staleReadyToReconcile.push({
            prospect,
            reason: 'indexed_send',
            lastEmailAt: prospect.lastEmailAt,
          });
        }
        continue;
      }
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

  // Walk the sent index until we have `sentLimit` *due* follow-ups (or exhaust /
  // deadline). A fixed first-N prefix left the Aug 21–22 cohort unreachable once
  // ~1k sent rows accumulated (recent not-due rows clogged the head).
  const followUpEligible: Array<{ prospect: FirmProspect; step: number }> = [];
  const staleFollowUpsToReconcile: Array<
    StaleReadyReconcile & { advanceToStep: number }
  > = [];
  let sentScanned = 0;

  const sentIds = await listProspectIdsByStatus('sent');
  const statusSentCap = skipDeepChecks
    ? Math.max(1, opts.maxReadyScan ?? sentLimit * 4)
    : Number.POSITIVE_INFINITY;

  for (
    let i = 0;
    i < sentIds.length && followUpEligible.length < sentLimit;
    i += READY_WALK_CHUNK
  ) {
    if (Date.now() >= deadlineMs) {
      selectionTimedOut = true;
      break;
    }
    if (sentScanned >= statusSentCap) break;

    const slice = sentIds.slice(i, i + READY_WALK_CHUNK);
    const map = await getProspectsByIds(slice);
    const batch: FirmProspect[] = [];
    for (const id of slice) {
      if (sentScanned >= statusSentCap) break;
      const p = map.get(id);
      if (!p || !isCampaignProspect(p, opts.campaignId) || p.status !== 'sent') continue;
      batch.push(p);
      sentScanned += 1;
    }
    if (batch.length === 0) continue;

    if (skipDeepChecks) {
      for (const prospect of batch) {
        if (followUpEligible.length >= sentLimit) break;
        const step = nextOutreachStep(prospect, nowMs);
        if (step === null) continue;
        followUpEligible.push({ prospect, step });
      }
      continue;
    }

    // Group this chunk's due follow-ups by step for batched idempotency lookups.
    const dueByStep = new Map<number, FirmProspect[]>();
    for (const prospect of batch) {
      const step = nextOutreachStep(prospect, nowMs);
      if (step === null) continue;
      const list = dueByStep.get(step) ?? [];
      list.push(prospect);
      dueByStep.set(step, list);
    }
    for (const [step, prospects] of dueByStep) {
      if (followUpEligible.length >= sentLimit) break;
      const emails = prospects
        .map((p) => p.email)
        .filter((email): email is string => Boolean(email));
      const jobs =
        emails.length > 0
          ? await emailsWithIdempotentJobsForCampaign(emails, opts.campaignId, step)
          : new Map();
      for (const prospect of prospects) {
        if (followUpEligible.length >= sentLimit) break;
        const email = prospect.email ? normalizeEmail(prospect.email) : '';
        const jobHit = email ? jobs.get(email) : undefined;
        if (jobHit) {
          skippedIdempotentJob += 1;
          if (staleFollowUpsToReconcile.length < STALE_READY_RECONCILE_CAP) {
            staleFollowUpsToReconcile.push({
              prospect,
              reason: jobHit.status,
              lastEmailAt: jobHit.acceptedAt ?? jobHit.updatedAt,
              advanceToStep: step,
            });
          }
          continue;
        }
        followUpEligible.push({ prospect, step });
      }
    }
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
    sentScanned,
    readyEligible: readyEligible.length,
    followUpEligible: followUpEligible.length,
    skippedIndexedSend,
    skippedIdempotentJob,
    firmCooldownSkipped,
    staleReadyToReconcile,
    staleFollowUpsToReconcile,
    readyIndexWalked,
    selectionTimedOut,
  };
}
