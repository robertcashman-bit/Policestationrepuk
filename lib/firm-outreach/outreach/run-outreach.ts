import { isTransientResendError } from '@robertcashman/firm-outreach-core';
import { getKV } from '@/lib/kv';
import { claimKey, releaseKey } from '@/lib/kv-atomic';
import { activeOutreachCampaignId, isCampaignProspect } from '../campaign-scope';
import { dailySendCap, outreachSendEnabled } from '../constants';
import { sortProspectsForSend } from '../enrichment/scorer';
import { isPlausibleOutreachEmail, validateEmailForSend } from '../enrichment/validator';
import {
  qualifyProspectForOutreach,
  resolveStatusWithQualification,
} from '../qualification';
import {
  addSuppression,
  createSendRecord,
  excludeProspectDuplicateEmail,
  getDailySendCount,
  getGlobalResendQuotaRemaining,
  incrementDailySendCount,
  incrementResendSendCount,
  isDuplicateInitialSend,
  isSuppressed,
  listProspectsByRecordStatus,
  listProspectsForFirmKey,
  saveOutreachRunLog,
  saveProspect,
  saveSend,
} from '../storage';
import type { FirmProspect, OutreachRunStats } from '../types';
import { normalizeEmail } from '../normalize';
import {
  buildOutreachRunLog,
  initExtendedRunStats,
  recordFailure,
  recordSkip,
} from './run-log';
import { sendOutreachEmail } from './send';

const FOLLOWUP_DAY_1 = 7;
const FOLLOWUP_DAY_2 = 21;
const FIRM_SEND_COOLDOWN_DAYS = 90;
const MAX_CANDIDATE_SCAN = 500;
/** Send lock lease — longer than cron maxDuration (300s) so a crashed run auto-releases. */
const SEND_LOCK_TTL_SECONDS = 330;
const sendLockKey = (campaignId: string) => `firmoutreach:send-lock:${campaignId}`;

/** Prospects in ready/sent were MX-checked at enrich/requalify; skip DNS on send ticks. */
function emailPrevalidatedForSend(prospect: FirmProspect): boolean {
  return prospect.status === 'ready_to_send' || prospect.status === 'sent';
}

function daysSince(iso: string | undefined): number {
  if (!iso) return Infinity;
  return (Date.now() - Date.parse(iso)) / (1000 * 60 * 60 * 24);
}

async function firmRecentlyContacted(
  prospect: FirmProspect,
  campaignId: string,
): Promise<boolean> {
  const siblings = await listProspectsForFirmKey(prospect.firmKey);
  for (const s of siblings) {
    if (s.id === prospect.id || !isCampaignProspect(s, campaignId)) continue;
    if (s.lastEmailAt && daysSince(s.lastEmailAt) < FIRM_SEND_COOLDOWN_DAYS) {
      return true;
    }
  }
  return false;
}

function dueForFollowUp(prospect: FirmProspect): boolean {
  if (prospect.waLinkClickedAt || prospect.joinedWhatsAppAt) return false;
  if (!prospect.lastEmailAt) return prospect.status === 'ready_to_send';

  const days = daysSince(prospect.lastEmailAt);
  if (prospect.sequenceStep === 0 && days >= FOLLOWUP_DAY_1) return true;
  if (prospect.sequenceStep === 1 && days >= FOLLOWUP_DAY_2 - FOLLOWUP_DAY_1) return true;
  return false;
}

function nextStep(prospect: FirmProspect): number | null {
  if (prospect.status === 'ready_to_send' && prospect.sequenceStep === 0 && !prospect.lastEmailAt) {
    return 0;
  }
  if (prospect.status === 'sent' && prospect.sequenceStep === 0 && dueForFollowUp(prospect)) return 1;
  if (prospect.status === 'sent' && prospect.sequenceStep === 1 && dueForFollowUp(prospect)) return 2;
  return null;
}

async function persistRunLog(opts: {
  campaignId: string;
  startedAt: string;
  dryRun: boolean;
  stats: OutreachRunStats;
  dailyCap: number;
  sentTodayBefore: number;
  resendQuotaRemaining: number;
}): Promise<void> {
  if (opts.dryRun || process.env.FIRM_OUTREACH_DRY_RUN === 'true') return;
  await saveOutreachRunLog(
    buildOutreachRunLog({
      campaignId: opts.campaignId,
      startedAt: opts.startedAt,
      dryRun: opts.dryRun,
      stats: opts.stats,
      dailyCap: opts.dailyCap,
      sentTodayBefore: opts.sentTodayBefore,
      resendQuotaRemaining: opts.resendQuotaRemaining,
    }),
  );
}

export async function runFirmOutreach(opts?: {
  campaignId?: string;
  dryRun?: boolean;
  limit?: number;
}): Promise<OutreachRunStats> {
  const startedAt = new Date().toISOString();
  const started = Date.now();
  const campaignId = opts?.campaignId ?? activeOutreachCampaignId();
  const campaignOpts = { campaignId };
  const stats = initExtendedRunStats({
    queued: 0,
    sent: 0,
    skipped: 0,
    suppressed: 0,
    errors: 0,
    elapsedMs: 0,
  });

  const finish = async (resendQuotaRemaining: number, sentTodayBefore: number, cap: number) => {
    stats.elapsedMs = Date.now() - started;
    stats.resendQuotaRemaining = resendQuotaRemaining;
    await persistRunLog({
      campaignId,
      startedAt,
      dryRun: Boolean(opts?.dryRun),
      stats,
      dailyCap: cap,
      sentTodayBefore,
      resendQuotaRemaining,
    });
    if (stats.sent > 0 || stats.errors > 0) {
      const { refreshProspectStatusSnapshotCache } = await import('../storage');
      await refreshProspectStatusSnapshotCache();
    }
    return stats;
  };

  if (!outreachSendEnabled()) {
    recordSkip(stats, 'send_disabled');
    return finish(0, 0, dailySendCap());
  }

  // Restart-safe send lock: only one live send run per campaign at a time. Prevents
  // overlapping cron ticks (a slow run still in flight, or the 12:00 enrich+send overlap)
  // from double-sending the same prospect or overshooting caps. The lease TTL auto-releases
  // if a run crashes. Skipped for dry runs and when KV is unavailable (tests / no protection needed).
  const lockKey = sendLockKey(campaignId);
  const useLock = !opts?.dryRun && Boolean(getKV());
  if (useLock && !(await claimKey(lockKey, SEND_LOCK_TTL_SECONDS))) {
    recordSkip(stats, 'concurrent_run');
    return finish(0, 0, dailySendCap());
  }

  const date = new Date().toISOString().slice(0, 10);
  // opts.limit is a PER-RUN batch size (how many to send this tick), NOT the daily ceiling.
  // The daily cap is always enforced separately so successive ticks accumulate toward it.
  const dayCap = dailySendCap();
  const perRunLimit = opts?.limit && opts.limit > 0 ? opts.limit : dayCap;
  const alreadySent = await getDailySendCount(date, campaignId);
  const remaining = Math.min(perRunLimit, Math.max(0, dayCap - alreadySent));
  const globalQuota = await getGlobalResendQuotaRemaining(date);

  if (remaining === 0) {
    recordSkip(stats, 'daily_cap');
    if (useLock) await releaseKey(lockKey);
    return finish(globalQuota, alreadySent, dayCap);
  }
  if (!opts?.dryRun && globalQuota <= 0) {
    recordSkip(stats, 'resend_quota');
    if (useLock) await releaseKey(lockKey);
    return finish(0, alreadySent, dayCap);
  }

  const ready = await listProspectsByRecordStatus(
    'ready_to_send',
    Math.min(MAX_CANDIDATE_SCAN, Math.max(remaining * 5, 50)),
    campaignOpts,
  );
  const sent = await listProspectsByRecordStatus(
    'sent',
    Math.min(MAX_CANDIDATE_SCAN, Math.max(remaining * 5, 50)),
    campaignOpts,
  );
  const candidates = sortProspectsForSend([...ready, ...sent]);
  const emailsSentThisRun = new Set<string>();
  let resendQuota = globalQuota;

  for (const prospect of candidates) {
    if (stats.sent >= remaining) break;
    if (!opts?.dryRun && resendQuota <= 0) {
      recordSkip(stats, 'resend_quota');
      break;
    }

    try {
      const step = nextStep(prospect);
      if (step === null) {
        // Self-heal "stale-ready" rows: a send already happened (lastEmailAt set) but the
        // status was never moved off ready_to_send. Follow-ups run off status==='sent', so at
        // ANY sequenceStep these rows can never send — they clog the ready queue and starve
        // genuinely-sendable step-0 prospects. Reconcile to sent so the queue stays truthful
        // without waiting for the nightly scan.
        if (
          !opts?.dryRun &&
          prospect.status === 'ready_to_send' &&
          Boolean(prospect.lastEmailAt)
        ) {
          prospect.status = 'sent';
          prospect.updatedAt = new Date().toISOString();
          await saveProspect(prospect, 'ready_to_send');
        }
        recordSkip(stats, 'no_step');
        continue;
      }

      const email = prospect.email?.trim();
      if (!email) {
        recordSkip(stats, 'no_email');
        continue;
      }

      const normalizedEmail = normalizeEmail(email);

      const qualification = qualifyProspectForOutreach(prospect);
      if (!qualification.qualified) {
        recordSkip(stats, 'not_qualified');
        if (prospect.status === 'ready_to_send') {
          prospect.status = resolveStatusWithQualification(prospect, 'ready_to_send');
          prospect.updatedAt = new Date().toISOString();
          await saveProspect(prospect);
        }
        continue;
      }

      if (await isSuppressed(email)) {
        stats.suppressed++;
        stats.attempted = (stats.attempted ?? 0) + 1;
        prospect.status = 'unsubscribed';
        await saveProspect(prospect);
        continue;
      }

      if (
        step === 0 &&
        (emailsSentThisRun.has(normalizedEmail) ||
          (await isDuplicateInitialSend(email, prospect.id, campaignId)))
      ) {
        recordSkip(stats, 'duplicate');
        if (prospect.status === 'ready_to_send') {
          await excludeProspectDuplicateEmail(prospect);
        }
        continue;
      }

      if (prospect.prospectType === 'solicitor' && (await firmRecentlyContacted(prospect, campaignId))) {
        recordSkip(stats, 'firm_cooldown');
        continue;
      }

      if (emailPrevalidatedForSend(prospect)) {
        if (!isPlausibleOutreachEmail(email)) {
          recordSkip(stats, 'mx_invalid');
          continue;
        }
      } else {
        const validation = await validateEmailForSend(email);
        if (!validation.ok) {
          recordSkip(stats, 'mx_invalid');
          if (prospect.status === 'ready_to_send') {
            prospect.status = validation.reason === 'no_mx' ? 'no_email' : 'discovered';
            prospect.updatedAt = new Date().toISOString();
            await saveProspect(prospect);
          }
          continue;
        }
      }

      stats.queued++;
      stats.attempted = (stats.attempted ?? 0) + 1;

      const result = await sendOutreachEmail({
        prospect,
        step,
        dryRun: opts?.dryRun,
      });

      if (!result.ok) {
        const transient = isTransientResendError(result.error);
        recordFailure(stats, {
          email,
          firmName: prospect.firmName,
          prospectId: prospect.id,
          reason: result.error ?? 'resend_error',
          transient,
        });
        if (result.error?.includes('bounce')) {
          await addSuppression(email, 'bounce');
          prospect.status = 'bounced';
          await saveProspect(prospect);
        } else if (!transient && prospect.status === 'ready_to_send') {
          const prev = prospect.status;
          prospect.status = 'excluded';
          prospect.excludedReason = 'send_failed';
          prospect.updatedAt = new Date().toISOString();
          await saveProspect(prospect, prev);
        }
        continue;
      }

      if (!opts?.dryRun && process.env.FIRM_OUTREACH_DRY_RUN !== 'true') {
        const now = new Date().toISOString();
        prospect.sequenceStep = step;
        prospect.lastEmailAt = now;
        prospect.status = 'sent';
        prospect.updatedAt = now;
        await saveProspect(prospect);

        const send = createSendRecord({
          prospectId: prospect.id,
          firmName: prospect.firmName,
          prospectType: prospect.prospectType,
          email,
          campaignId: prospect.campaignId,
          sequenceStep: step,
          subject: result.subject,
        });
        send.status = 'sent';
        send.sentAt = now;
        send.resendMessageId = result.messageId;
        await saveSend(send);

        await incrementDailySendCount(date, campaignId);
        await incrementResendSendCount(date);
        resendQuota = Math.max(0, resendQuota - 1);
      }
      emailsSentThisRun.add(normalizedEmail);
      stats.sent++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      recordFailure(stats, {
        email: prospect.email ?? '',
        firmName: prospect.firmName,
        prospectId: prospect.id,
        reason: msg,
        transient: isTransientResendError(msg),
      });
    }
  }

  const finalQuota = await getGlobalResendQuotaRemaining(date);
  if (useLock) await releaseKey(lockKey);
  return finish(finalQuota, alreadySent, dayCap);
}
