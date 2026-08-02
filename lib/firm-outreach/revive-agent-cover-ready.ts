import { AGENT_COVER_KENT_CAMPAIGN_ID } from './campaign-scope';
import { isKentProspectInput } from './kent-filter';
import { normalizeEmail } from './normalize';
import { FIRM_OUTREACH_CAMPAIGN_ID } from './site-config';
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
  if (isKentProspectInput(p)) score += 20;
  if (p.status === 'ready_to_send') score += 5;
  if (p.status === 'excluded' && p.excludedReason === 'send_failed') score += 3;
  if (p.websiteUrl) score += 1;
  return score;
}

/**
 * Revive Kent PSA prospects that have email but are stuck excluded
 * (send_failed / duplicate losers / missing geo) when no successful PSA send exists.
 */
export async function reviveAgentCoverKentReady(opts?: {
  dryRun?: boolean;
  limit?: number;
  maxElapsedMs?: number;
}): Promise<ReviveAgentCoverStats> {
  const dryRun = opts?.dryRun ?? false;
  const limit = opts?.limit ?? 80;
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
    skippedNotKent: 0,
    dryRun,
    elapsedMs: 0,
    samples: [],
  };

  // RepUK Kent emails → geo repair for PSA rows missing county/postcode.
  const repukKentGeo = new Map<string, { county?: string; postcode?: string; town?: string }>();
  const repukReadyIds = await listProspectIdsByRecordStatus('ready_to_send', {
    campaignId: FIRM_OUTREACH_CAMPAIGN_ID,
  });
  const repukSentIds = await listProspectIdsByRecordStatus('sent', {
    campaignId: FIRM_OUTREACH_CAMPAIGN_ID,
  });
  const repukExcludedIds = await listProspectIdsByRecordStatus('excluded', {
    campaignId: FIRM_OUTREACH_CAMPAIGN_ID,
  });
  const repukMap = await getProspectsByIds([
    ...repukReadyIds,
    ...repukSentIds,
    ...repukExcludedIds.slice(0, 3000),
  ]);
  for (const p of repukMap.values()) {
    if (!p.email || !isKentProspectInput(p)) continue;
    repukKentGeo.set(normalizeEmail(p.email), {
      county: p.county,
      postcode: p.postcode,
      town: p.town,
    });
  }

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
        if (p.status === 'excluded' && !isSoftExclusion(p.excludedReason)) continue;
        if (p.status === 'bounced' || p.status === 'unsubscribed') continue;

        // Repair geo from RepUK Kent twin when PSA row lost county/postcode.
        const email = normalizeEmail(p.email);
        const geo = repukKentGeo.get(email);
        if (geo && !isKentProspectInput(p)) {
          p.county = p.county || geo.county;
          p.postcode = p.postcode || geo.postcode;
          p.town = p.town || geo.town;
        }

        // Only consider Kent (after repair) — avoids burning the budget on non-Kent sends lookups.
        if (!isKentProspectInput(p) && !repukKentGeo.has(email)) {
          stats.skippedNotKent++;
          continue;
        }

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

    const kentRows = rows.filter(
      (r) => isKentProspectInput(r) || repukKentGeo.has(normalizeEmail(r.email!)),
    );
    if (kentRows.length === 0) {
      stats.skippedNotKent++;
      continue;
    }

    // Apply RepUK geo onto winner candidates missing Kent fields.
    for (const r of kentRows) {
      const geo = repukKentGeo.get(normalizeEmail(r.email!));
      if (geo && !isKentProspectInput(r)) {
        r.county = r.county || geo.county;
        r.postcode = r.postcode || geo.postcode;
        r.town = r.town || geo.town;
      }
    }

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

    const winner = [...kentRows].sort((a, b) => scoreProspect(b) - scoreProspect(a))[0]!;
    if (winner.status === 'ready_to_send' && !winner.excludedReason) continue;

    const prev = winner.status;
    winner.status = 'ready_to_send';
    winner.excludedReason = undefined;
    winner.updatedAt = new Date().toISOString();

    if (!dryRun) {
      await saveProspect(winner, prev);
      // Keep inbox uniqueness: demote other PSA rows for same email.
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
