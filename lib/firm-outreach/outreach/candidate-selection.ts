import {
  firmSendCooldownDays,
  daysSince,
  nextOutreachStep,
  sequenceStepOf,
} from '@robertcashman/firm-outreach-core';
import { computeProspectPriority } from '../enrichment/scorer';
import { emailsWithIndexedSends, listProspectsByRecordStatus, listProspectsForFirmKey } from '../storage';
import { isCampaignProspect } from '../campaign-scope';
import { normalizeEmail } from '../normalize';
import type { FirmProspect } from '../types';

export { nextOutreachStep, sequenceStepOf };

const DEFAULT_READY_SCAN = 800;
const DEFAULT_SENT_SCAN = 400;
/** Hard cap: a 4k ready scan consumed the whole RepUK time slice (0 sends). */
const MAX_READY_SCAN = 1200;

export function readyProspectScanLimit(readyLimit: number): number {
  return Math.min(MAX_READY_SCAN, Math.max(readyLimit * 6, readyLimit));
}

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
 */
export async function selectOutreachCandidates(opts: {
  campaignId: string;
  readyLimit?: number;
  sentLimit?: number;
  nowMs?: number;
  /** When true (default), drop solicitors whose firm was emailed inside the cooldown window. */
  excludeFirmCooldown?: boolean;
}): Promise<{
  candidates: Array<{ prospect: FirmProspect; step: number }>;
  readyScanned: number;
  sentScanned: number;
  readyEligible: number;
  followUpEligible: number;
  skippedIndexedSend: number;
  firmCooldownSkipped: number;
}> {
  const readyLimit = opts.readyLimit ?? DEFAULT_READY_SCAN;
  const sentLimit = opts.sentLimit ?? DEFAULT_SENT_SCAN;
  const nowMs = opts.nowMs ?? Date.now();
  const excludeFirmCooldown = opts.excludeFirmCooldown !== false;
  const campaignOpts = { campaignId: opts.campaignId };

  // Scan well past `readyLimit` so already-mailed inboxes at the front of the
  // ready index cannot hide never-contacted firms and due follow-ups.
  const readyScan = readyProspectScanLimit(readyLimit);
  const ready = await listProspectsByRecordStatus('ready_to_send', readyScan, campaignOpts);
  const sent = await listProspectsByRecordStatus('sent', sentLimit, campaignOpts);
  const indexedSends = await emailsWithIndexedSends(
    ready.map((p) => p.email).filter((email): email is string => Boolean(email)),
  );

  const readyEligible: Array<{ prospect: FirmProspect; step: number }> = [];
  let skippedIndexedSend = 0;
  for (const prospect of ready) {
    const step = nextOutreachStep(prospect, nowMs);
    if (step === null) continue;
    // Ready rows whose inbox already has a send record must not occupy the
    // candidate pool ahead of new inboxes and due follow-ups.
    const email = prospect.email ? normalizeEmail(prospect.email) : '';
    if (step === 0 && email && indexedSends.has(email)) {
      skippedIndexedSend += 1;
      continue;
    }
    readyEligible.push({ prospect, step });
    if (readyEligible.length >= readyLimit) break;
  }

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
    if (
      excludeFirmCooldown &&
      row.prospect.prospectType === 'solicitor'
    ) {
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
    readyScanned: ready.length,
    sentScanned: sent.length,
    readyEligible: readyEligible.length,
    followUpEligible: followUpEligible.length,
    skippedIndexedSend,
    firmCooldownSkipped,
  };
}
