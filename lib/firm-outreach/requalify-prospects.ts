import { ensureDsccRegisterCache } from '@/lib/dscc-register-lookup';
import { readLaaCrimeJson } from '@/lib/legal-directory/laa-fetch';
import { websiteIndicatesCrimePractice } from './crime-website-verify';
import {
  buildCrimeRegistry,
  qualifyProspectForOutreach,
  resolveStatusWithQualification,
} from './qualification';
import { reconcileReadyProspectStatus } from './reconcile-ready-status';
import {
  getProspect,
  listAllProspectIds,
  listProspectIdsByStatus,
  listProspectsForFirmKey,
  saveProspect,
} from './storage';
import { isPlausibleOutreachEmail, validateEmailForSend } from './enrichment/validator';
import {
  FIRM_SEND_COOLDOWN_DAYS,
  firmCooldownEligibleAt,
  isSendableReadyProspect,
} from './sendable-ready';
import { normalizeEmail } from './normalize';
import { isCampaignProspect } from './campaign-scope';

export interface RequalifyResult {
  scanned: number;
  downgradedFromReady: number;
  reconciledFromReady: number;
  mxDowngradedFromReady: number;
  promotedToReady: number;
  heldForReview: number;
  websiteVerified: number;
  stillReady: number;
  dedupedFromReady: number;
  junkDemotedFromReady: number;
  cooldownParked: number;
  sendableReady: number;
  stoppedEarly?: boolean;
  samples: Array<{ id: string; firmName: string; from: string; to: string; reason: string }>;
}

export async function requalifyAllProspects(opts?: {
  sampleLimit?: number;
  verifyWebsites?: boolean;
  /** Only scan ready_to_send rows (fast path for bootstrap kick). */
  readyOnly?: boolean;
  maxElapsedMs?: number;
  startedAt?: number;
  /** Max MX lookups per run (maintain cron stays within timeout). */
  mxCheckLimit?: number;
}): Promise<RequalifyResult> {
  const sampleLimit = opts?.sampleLimit ?? 20;
  const verifyWebsites = opts?.verifyWebsites ?? true;
  const readyOnly = opts?.readyOnly ?? false;
  const mxCheckLimit = opts?.mxCheckLimit ?? 50;
  const started = opts?.startedAt ?? Date.now();
  const deadline =
    opts?.maxElapsedMs != null ? started + opts.maxElapsedMs : undefined;
  const result: RequalifyResult = {
    scanned: 0,
    downgradedFromReady: 0,
    reconciledFromReady: 0,
    mxDowngradedFromReady: 0,
    promotedToReady: 0,
    heldForReview: 0,
    websiteVerified: 0,
    stillReady: 0,
    dedupedFromReady: 0,
    junkDemotedFromReady: 0,
    cooldownParked: 0,
    sendableReady: 0,
    stoppedEarly: false,
    samples: [],
  };

  const laa = readLaaCrimeJson();
  const dscc = await ensureDsccRegisterCache();
  const registry = buildCrimeRegistry(laa, dscc?.entries ?? []);

  const ids = readyOnly
    ? await listProspectIdsByStatus('ready_to_send')
    : await listAllProspectIds();
  let mxChecks = 0;
  for (const id of ids) {
    if (deadline != null && Date.now() >= deadline) {
      result.stoppedEarly = true;
      break;
    }
    const p = await getProspect(id);
    if (!p) continue;
    result.scanned++;

    // Demote press/junk emails that slipped into ready_to_send.
    if (
      p.status === 'ready_to_send' &&
      p.email &&
      !isPlausibleOutreachEmail(p.email)
    ) {
      const prev = p.status;
      p.email = undefined;
      p.emailConfidence = undefined;
      p.emailScore = undefined;
      p.status = 'discovered';
      p.excludedReason = 'junk_email';
      p.nextEligibleAt = undefined;
      p.updatedAt = new Date().toISOString();
      await saveProspect(p, prev);
      result.downgradedFromReady++;
      result.junkDemotedFromReady++;
      if (result.samples.length < sampleLimit) {
        result.samples.push({
          id: p.id,
          firmName: p.firmName,
          from: prev,
          to: p.status,
          reason: 'junk_email',
        });
      }
      continue;
    }

    // PSA (agent_cover_kent_v1) emails nationwide — offer is Kent cover, audience is not
    // geo-gated. Former not_kent_for_agent_cover demotion removed.

    let websiteVerifiedNow = false;
    if (
      verifyWebsites &&
      !p.crimeWebsiteVerified &&
      p.websiteUrl &&
      (p.sources.includes('archive') || p.excludedReason === 'archive_only_not_on_laa_or_dscc')
    ) {
      if (await websiteIndicatesCrimePractice(p.websiteUrl)) {
        p.crimeWebsiteVerified = true;
        websiteVerifiedNow = true;
      }
    }

    const q = qualifyProspectForOutreach(p, registry);
    const prevStatus = p.status;

    const reconciled = reconcileReadyProspectStatus(p);
    if (reconciled) {
      p.status = reconciled;
      p.updatedAt = new Date().toISOString();
      await saveProspect(p, prevStatus);
      result.reconciledFromReady++;
      if (result.samples.length < sampleLimit) {
        result.samples.push({
          id: p.id,
          firmName: p.firmName,
          from: prevStatus,
          to: p.status,
          reason: reconciled === 'sent' ? 'initial_send_already_recorded' : 'invalid_email_format',
        });
      }
      continue;
    }

    if (
      p.status === 'ready_to_send' &&
      p.email &&
      isPlausibleOutreachEmail(p.email) &&
      mxChecks < mxCheckLimit
    ) {
      mxChecks++;
      const mx = await validateEmailForSend(p.email);
      if (!mx.ok) {
        const prevStatus = p.status;
        p.email = undefined;
        p.emailConfidence = undefined;
        p.emailScore = undefined;
        p.status = 'discovered';
        p.updatedAt = new Date().toISOString();
        await saveProspect(p, prevStatus);
        result.downgradedFromReady++;
        result.mxDowngradedFromReady++;
        if (result.samples.length < sampleLimit) {
          result.samples.push({
            id: p.id,
            firmName: p.firmName,
            from: prevStatus,
            to: p.status,
            reason: mx.reason ?? 'no_mx',
          });
        }
        continue;
      }
    }

    if (
      p.status === 'excluded' &&
      (p.excludedReason === 'archive_only_not_on_laa_or_dscc' ||
        p.excludedReason === 'duplicate_firm_ready')
    ) {
      const restoreReason =
        p.excludedReason === 'duplicate_firm_ready' ? 'restore_same_firm_ready' : q.reason;
      if (q.qualified) {
        if (websiteVerifiedNow || p.crimeWebsiteVerified) result.websiteVerified++;
        p.excludedReason = undefined;
        p.nextEligibleAt = undefined;
        const preferred = p.lastEmailAt ? 'sent' : 'ready_to_send';
        p.status = resolveStatusWithQualification(p, preferred, registry);
        p.updatedAt = new Date().toISOString();
        await saveProspect(p, prevStatus);
        if (p.status === 'ready_to_send') result.promotedToReady++;
        if (result.samples.length < sampleLimit) {
          result.samples.push({
            id: p.id,
            firmName: p.firmName,
            from: prevStatus,
            to: p.status,
            reason: restoreReason,
          });
        }
      } else if (websiteVerifiedNow) {
        p.updatedAt = new Date().toISOString();
        await saveProspect(p, prevStatus);
      }
      continue;
    }

    if (
      (p.status === 'discovered' || p.status === 'enriched') &&
      p.email &&
      isPlausibleOutreachEmail(p.email) &&
      q.qualified
    ) {
      const preferred = p.lastEmailAt ? 'sent' : 'ready_to_send';
      const next = resolveStatusWithQualification(p, preferred, registry);
      if (next === 'ready_to_send' || next === 'sent') {
        p.status = next;
        p.updatedAt = new Date().toISOString();
        await saveProspect(p, prevStatus);
        if (next === 'ready_to_send') result.promotedToReady++;
        if (result.samples.length < sampleLimit) {
          result.samples.push({
            id: p.id,
            firmName: p.firmName,
            from: prevStatus,
            to: p.status,
            reason: next === 'sent' ? 'initial_send_already_recorded' : q.reason,
          });
        }
        continue;
      }
    }

    if (p.status === 'ready_to_send' && !q.qualified) {
      p.status = resolveStatusWithQualification(p, 'ready_to_send', registry);
      p.excludedReason = undefined;
      result.downgradedFromReady++;
      result.heldForReview++;
      p.updatedAt = new Date().toISOString();
      await saveProspect(p, prevStatus);
      if (result.samples.length < sampleLimit) {
        result.samples.push({
          id: p.id,
          firmName: p.firmName,
          from: prevStatus,
          to: p.status,
          reason: q.reason,
        });
      }
      continue;
    }

    // Park only when the same inbox was emailed within FIRM_SEND_COOLDOWN_DAYS.
    // Different solicitors / personal vs generic inboxes at the same firm stay sendable.
    if (
      p.status === 'ready_to_send' &&
      q.qualified &&
      p.prospectType === 'solicitor' &&
      p.firmKey
    ) {
      const email = normalizeEmail(p.email ?? '');
      const siblings = email ? await listProspectsForFirmKey(p.firmKey) : [];
      let latestSameInbox: string | undefined;
      if (email && FIRM_SEND_COOLDOWN_DAYS > 0) {
        for (const s of siblings) {
          if (s.id === p.id || !isCampaignProspect(s, p.campaignId)) continue;
          if (!s.lastEmailAt) continue;
          if (normalizeEmail(s.email ?? '') !== email) continue;
          const days = (Date.now() - Date.parse(s.lastEmailAt)) / 86_400_000;
          if (days < FIRM_SEND_COOLDOWN_DAYS) {
            if (!latestSameInbox || Date.parse(s.lastEmailAt) > Date.parse(latestSameInbox)) {
              latestSameInbox = s.lastEmailAt;
            }
          }
        }
      }
      if (latestSameInbox) {
        const nextEligibleAt = firmCooldownEligibleAt(latestSameInbox, FIRM_SEND_COOLDOWN_DAYS);
        if (p.nextEligibleAt !== nextEligibleAt || p.excludedReason !== 'firm_cooldown') {
          p.nextEligibleAt = nextEligibleAt;
          p.excludedReason = 'firm_cooldown';
          p.updatedAt = new Date().toISOString();
          await saveProspect(p, prevStatus);
          result.cooldownParked++;
          if (result.samples.length < sampleLimit) {
            result.samples.push({
              id: p.id,
              firmName: p.firmName,
              from: prevStatus,
              to: p.status,
              reason: 'firm_cooldown',
            });
          }
        }
      } else if (p.excludedReason === 'firm_cooldown' || p.nextEligibleAt) {
        // Clear legacy firm-wide parks and expired same-inbox holds.
        p.nextEligibleAt = undefined;
        if (p.excludedReason === 'firm_cooldown') p.excludedReason = undefined;
        p.updatedAt = new Date().toISOString();
        await saveProspect(p, prevStatus);
      }
    }

    if (p.status === 'ready_to_send' && q.qualified) {
      result.stillReady++;
    }
  }

  // Collapse duplicate ready rows by email only (per campaign).
  // Multiple solicitors at the same firm stay ready when they have distinct inboxes.
  const readyIds = await listProspectIdsByStatus('ready_to_send');
  type ReadyPick = { id: string; score: number; updatedAt: string };
  const better = (a: ReadyPick, b: ReadyPick) =>
    b.score - a.score || b.updatedAt.localeCompare(a.updatedAt);

  async function demoteDuplicateReady(id: string, reason: string): Promise<void> {
    const p = await getProspect(id);
    if (!p || p.status !== 'ready_to_send') return;
    const prev = p.status;
    p.status = 'excluded';
    p.excludedReason = reason;
    p.updatedAt = new Date().toISOString();
    await saveProspect(p, prev);
    result.dedupedFromReady++;
    result.downgradedFromReady++;
    if (result.samples.length < sampleLimit) {
      result.samples.push({
        id: p.id,
        firmName: p.firmName,
        from: prev,
        to: p.status,
        reason,
      });
    }
  }

  const byEmail = new Map<string, ReadyPick>();
  const emailLosers: string[] = [];
  for (const id of readyIds) {
    if (deadline != null && Date.now() >= deadline) {
      result.stoppedEarly = true;
      break;
    }
    const p = await getProspect(id);
    if (!p || p.status !== 'ready_to_send' || !p.email) continue;
    const key = `${p.campaignId}:email:${normalizeEmail(p.email)}`;
    const pick: ReadyPick = {
      id: p.id,
      score: p.priorityScore ?? 0,
      updatedAt: p.updatedAt ?? '',
    };
    const cur = byEmail.get(key);
    if (!cur || better(cur, pick) > 0) {
      if (cur) emailLosers.push(cur.id);
      byEmail.set(key, pick);
    } else {
      emailLosers.push(p.id);
    }
  }
  for (const id of emailLosers) {
    await demoteDuplicateReady(id, 'duplicate_email_ready');
  }

  // Recount sendable ready after demotions.
  const finalReadyIds = await listProspectIdsByStatus('ready_to_send');
  let sendable = 0;
  for (const id of finalReadyIds) {
    const p = await getProspect(id);
    if (p && isSendableReadyProspect(p)) sendable++;
  }
  result.sendableReady = sendable;
  result.stillReady = finalReadyIds.length;

  return result;
}
