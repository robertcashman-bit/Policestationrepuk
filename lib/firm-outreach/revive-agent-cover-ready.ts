import { buildOutreachIdempotencyKey } from '@robertcashman/firm-outreach-core';
import { AGENT_COVER_KENT_CAMPAIGN_ID } from './campaign-scope';
import { getEmailJobByIdempotencyKey } from './email-jobs/storage';
import { normalizeEmail } from './normalize';
import {
  getProspectsByIds,
  isSuppressed,
  listProspectIdsByRecordStatus,
  listSendsForEmail,
  saveProspect,
} from './storage';
import type { FirmProspect, FirmProspectStatus } from './types';

export interface ReviveAgentCoverStats {
  scanned: number;
  uniqueEmails: number;
  revived: number;
  skippedSent: number;
  skippedSuppressed: number;
  skippedTerminal: number;
  skippedHasSend: number;
  /** Durable terminal PSA jobs (accepted/delivered/permanently_failed) for step 0. */
  skippedTerminalJob: number;
  /** Retained for API compat; always 0 (recipients are nationwide). */
  skippedNotKent: number;
  dryRun: boolean;
  elapsedMs: number;
  samples: Array<{ id: string; email: string; from: string; firmName: string }>;
}

const SCAN_STATUSES: FirmProspectStatus[] = [
  'excluded',
  'discovered',
  'enriched',
  'no_email',
  'ready_to_send',
];

const SUCCESS_SEND = new Set(['sent', 'delivered', 'opened', 'clicked']);

const TERMINAL_JOB = new Set(['accepted', 'delivered', 'permanently_failed']);

function isSoftExclusion(reason: string | undefined): boolean {
  if (!reason) return true;
  return (
    reason === 'send_failed' ||
    reason.startsWith('duplicate_') ||
    reason === 'not_kent_for_agent_cover' ||
    reason === 'firm_cooldown'
  );
}

function scoreProspect(p: FirmProspect): number {
  let score = 0;
  if (p.email) score += 10;
  if (p.status === 'ready_to_send') score += 5;
  if (p.status === 'excluded' && p.excludedReason === 'send_failed') score += 3;
  if (p.status === 'excluded' && p.excludedReason === 'not_kent_for_agent_cover') score += 4;
  if (p.websiteUrl) score += 1;
  if (p.prospectType === 'firm') score += 2;
  return score;
}

/**
 * Revive PSA prospects nationwide that have email but are stuck excluded
 * (including former not_kent_for_agent_cover) when no successful PSA send exists.
 * Offer copy remains Kent cover; audience is England & Wales criminal defence.
 *
 * Does NOT revive when a durable PSA job already terminal-accepted/failed —
 * that loop previously kept readyEligible high while the worker skipped
 * everything as idempotent_exists.
 */
export async function reviveAgentCoverKentReady(opts?: {
  dryRun?: boolean;
  limit?: number;
  maxElapsedMs?: number;
}): Promise<ReviveAgentCoverStats> {
  const dryRun = opts?.dryRun ?? false;
  const limit = opts?.limit ?? 120;
  const maxElapsedMs = opts?.maxElapsedMs ?? 45_000;
  const started = Date.now();
  const stats: ReviveAgentCoverStats = {
    scanned: 0,
    uniqueEmails: 0,
    revived: 0,
    skippedSent: 0,
    skippedSuppressed: 0,
    skippedTerminal: 0,
    skippedHasSend: 0,
    skippedTerminalJob: 0,
    skippedNotKent: 0,
    dryRun,
    elapsedMs: 0,
    samples: [],
  };

  const seenIds = new Set<string>();
  const byEmail = new Map<string, FirmProspect[]>();

  for (const status of SCAN_STATUSES) {
    if (Date.now() - started >= maxElapsedMs) break;
    const ids = await listProspectIdsByRecordStatus(status, {
      campaignId: AGENT_COVER_KENT_CAMPAIGN_ID,
    });
    for (let i = 0; i < ids.length; i += 80) {
      if (Date.now() - started >= maxElapsedMs) break;
      const chunk = ids.slice(i, i + 80).filter((id) => !seenIds.has(id));
      chunk.forEach((id) => seenIds.add(id));
      const map = await getProspectsByIds(chunk);
      for (const p of map.values()) {
        if (p.campaignId !== AGENT_COVER_KENT_CAMPAIGN_ID || !p.email?.trim()) continue;
        stats.scanned++;
        // Never soft-revive terminal send failures — worker cannot re-enqueue them.
        if (p.status === 'excluded' && p.excludedReason === 'send_permanently_failed') {
          stats.skippedTerminal++;
          continue;
        }
        if (p.status === 'excluded' && !isSoftExclusion(p.excludedReason)) continue;
        if (p.status === 'bounced' || p.status === 'unsubscribed') continue;

        const email = normalizeEmail(p.email);
        const list = byEmail.get(email) ?? [];
        list.push(p);
        byEmail.set(email, list);
      }
    }
  }

  stats.uniqueEmails = byEmail.size;

  for (const [email, rows] of byEmail) {
    if (stats.revived >= limit) break;
    if (Date.now() - started >= maxElapsedMs) break;

    if (rows.some((r) => r.status === 'sent' || r.lastEmailAt)) {
      stats.skippedSent++;
      continue;
    }
    if (rows.every((r) => r.status === 'bounced' || r.status === 'unsubscribed')) {
      stats.skippedTerminal++;
      continue;
    }
    if (await isSuppressed(email)) {
      stats.skippedSuppressed++;
      continue;
    }

    const sends = (await listSendsForEmail(email, { allowFullScan: true })).filter(
      (s) => s.campaignId === AGENT_COVER_KENT_CAMPAIGN_ID,
    );
    if (sends.some((s) => SUCCESS_SEND.has(s.status))) {
      stats.skippedHasSend++;
      continue;
    }

    const step = 0;
    const idemKey = buildOutreachIdempotencyKey(AGENT_COVER_KENT_CAMPAIGN_ID, email, step);
    const existingJob = await getEmailJobByIdempotencyKey(idemKey);
    if (existingJob && TERMINAL_JOB.has(existingJob.status)) {
      stats.skippedTerminalJob++;
      // Reconcile accepted/delivered jobs into sent so they leave the ready pool.
      const winner = [...rows].sort((a, b) => scoreProspect(b) - scoreProspect(a))[0]!;
      if (
        !dryRun &&
        (existingJob.status === 'accepted' || existingJob.status === 'delivered') &&
        winner.status !== 'sent'
      ) {
        const prev = winner.status;
        winner.status = 'sent';
        winner.lastEmailAt = existingJob.acceptedAt ?? existingJob.updatedAt ?? winner.updatedAt;
        winner.excludedReason = undefined;
        winner.updatedAt = new Date().toISOString();
        await saveProspect(winner, prev);
      } else if (
        !dryRun &&
        existingJob.status === 'permanently_failed' &&
        winner.excludedReason !== 'send_permanently_failed'
      ) {
        const prev = winner.status;
        winner.status = 'excluded';
        winner.excludedReason = 'send_permanently_failed';
        winner.updatedAt = new Date().toISOString();
        await saveProspect(winner, prev);
      }
      continue;
    }

    const winner = [...rows].sort((a, b) => scoreProspect(b) - scoreProspect(a))[0]!;
    if (winner.status === 'ready_to_send' && !winner.excludedReason) continue;

    const prev = winner.status;
    winner.status = 'ready_to_send';
    winner.excludedReason = undefined;
    winner.updatedAt = new Date().toISOString();

    if (!dryRun) {
      await saveProspect(winner, prev);
      for (const other of rows) {
        if (other.id === winner.id) continue;
        if (other.status === 'sent' || other.lastEmailAt) continue;
        if (other.status === 'excluded' && other.excludedReason === 'duplicate_email') continue;
        const otherPrev = other.status;
        other.status = 'excluded';
        other.excludedReason = 'duplicate_email';
        other.updatedAt = new Date().toISOString();
        await saveProspect(other, otherPrev);
      }
    }

    stats.revived++;
    if (stats.samples.length < 12) {
      stats.samples.push({
        id: winner.id,
        email,
        from: prev,
        firmName: winner.firmName,
      });
    }
  }

  stats.elapsedMs = Date.now() - started;
  return stats;
}
