import { reconcileReadyProspectStatus } from '../reconcile-ready-status';
import { OUTREACH_CAMPAIGN_IDS } from '../site-config';
import {
  getProspect,
  listProspectIdsByStatus,
  listProspectsByRecordStatus,
  saveProspect,
} from '../storage';
import type { FirmOutreachSend, OutreachRunLog } from '../types';
import { releaseKey } from '@/lib/kv-atomic';
import { getKV } from '@/lib/kv';
import {
  countRealSendsOnDate,
  findDailyCapDrift,
  fixDailyCapDrift,
  type DailyCapDrift,
} from './phantom-send-repair-apply';
import { nextOutreachStep } from './sequence';

/** UTC send windows (hour, minute) — shared by send crons and watchdog recovery. */
export const OUTREACH_SEND_WINDOWS_UTC: Array<{ hour: number; minute: number }> = [
  { hour: 12, minute: 0 },
  { hour: 14, minute: 30 },
  { hour: 16, minute: 0 },
  { hour: 18, minute: 30 },
];

export const SEND_LOCK_KEY = (campaignId: string) => `firmoutreach:send-lock:${campaignId}`;
export const WATCHDOG_KICK_KEY = (date: string, campaignId: string) =>
  `firmoutreach:watchdog:kick:${date}:${campaignId}`;

/** Min gap between watchdog send kicks for the same campaign/day (unless cap was just fixed). */
export const WATCHDOG_KICK_COOLDOWN_MS = 20 * 60 * 1000;

const STALE_READY_SCAN_LIMIT = 800;
const PER_CAMPAIGN_DUE_SCAN = 500;

export function collectCapDriftCheckDates(
  sends: FirmOutreachSend[],
  opts?: { lookbackDays?: number; anchorDate?: string },
): string[] {
  const lookback = opts?.lookbackDays ?? 7;
  const dates = new Set<string>();
  const anchor = opts?.anchorDate ?? new Date().toISOString().slice(0, 10);
  dates.add(anchor);

  for (const send of sends) {
    if (send.sentAt) dates.add(send.sentAt.slice(0, 10));
  }

  const base = new Date(`${anchor}T12:00:00.000Z`);
  for (let i = 0; i < lookback; i++) {
    const d = new Date(base);
    d.setUTCDate(d.getUTCDate() - i);
    dates.add(d.toISOString().slice(0, 10));
  }

  return [...dates].sort();
}

export async function reconcileStaleReadyProspects(opts?: {
  limit?: number;
}): Promise<number> {
  const limit = opts?.limit ?? STALE_READY_SCAN_LIMIT;
  const ids = (await listProspectIdsByStatus('ready_to_send')).slice(0, limit);
  let reconciled = 0;

  for (const id of ids) {
    const prospect = await getProspect(id);
    if (!prospect) continue;
    const nextStatus = reconcileReadyProspectStatus(prospect);
    if (!nextStatus) continue;
    prospect.status = nextStatus;
    prospect.updatedAt = new Date().toISOString();
    await saveProspect(prospect, 'ready_to_send');
    reconciled++;
  }

  return reconciled;
}

export async function countDueSendableByCampaign(opts?: {
  nowMs?: number;
  perStatusLimit?: number;
}): Promise<Record<string, number>> {
  const nowMs = opts?.nowMs ?? Date.now();
  const perStatusLimit = opts?.perStatusLimit ?? PER_CAMPAIGN_DUE_SCAN;
  const counts: Record<string, number> = {};

  for (const campaignId of OUTREACH_CAMPAIGN_IDS) {
    counts[campaignId] = 0;
    const [ready, sent] = await Promise.all([
      listProspectsByRecordStatus('ready_to_send', perStatusLimit, { campaignId }),
      listProspectsByRecordStatus('sent', perStatusLimit, { campaignId }),
    ]);
    for (const prospect of [...ready, ...sent]) {
      if (nextOutreachStep(prospect, nowMs) !== null && prospect.email?.trim()) {
        counts[campaignId]++;
      }
    }
  }

  return counts;
}

export function minutesSinceSendWindow(
  window: { hour: number; minute: number },
  now: Date,
): number {
  const windowStart = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    window.hour,
    window.minute,
  );
  return (now.getTime() - windowStart) / 60_000;
}

/** Send windows that have started and passed the grace period (still actionable today). */
export function passedSendWindowsToday(
  now: Date,
  graceMinutes: number,
): Array<{ hour: number; minute: number }> {
  return OUTREACH_SEND_WINDOWS_UTC.filter((w) => minutesSinceSendWindow(w, now) >= graceMinutes);
}

export function capDriftBlocksSending(drift: DailyCapDrift): boolean {
  return drift.counterValue > drift.realCount;
}

export async function findAllDailyCapDrifts(
  sends: FirmOutreachSend[],
  dates: string[],
): Promise<DailyCapDrift[]> {
  const all: DailyCapDrift[] = [];
  for (const date of dates) {
    all.push(...(await findDailyCapDrift(sends, date)));
  }
  return all;
}

export async function fixAllDailyCapDrifts(
  sends: FirmOutreachSend[],
  dates: string[],
): Promise<number> {
  let fixed = 0;
  for (const date of dates) {
    fixed += await fixDailyCapDrift(sends, date);
  }
  return fixed;
}

export type SendRecoveryReason =
  | 'cap_drift_blocking'
  | 'missed_send_window'
  | 'send_run_failed'
  | 'daily_cap_skip_with_drift'
  | 'no_run_log_today';

export interface CampaignSendRecovery {
  campaignId: string;
  reasons: SendRecoveryReason[];
  dueCount: number;
  realSendsToday: number;
}

export function detectCampaignSendRecovery(input: {
  campaignId: string;
  now: Date;
  date: string;
  dueCount: number;
  realSendsToday: number;
  latest: OutreachRunLog | null;
  todayCapDrift: DailyCapDrift | undefined;
  graceMinutes: number;
}): CampaignSendRecovery | null {
  const {
    campaignId,
    now,
    date,
    dueCount,
    realSendsToday,
    latest,
    todayCapDrift,
    graceMinutes,
  } = input;

  if (dueCount <= 0) return null;

  const reasons: SendRecoveryReason[] = [];
  const passed = passedSendWindowsToday(now, graceMinutes);

  if (todayCapDrift && capDriftBlocksSending(todayCapDrift)) {
    reasons.push('cap_drift_blocking');
  }

  if (passed.length > 0) {
    if (!latest || !latest.startedAt.startsWith(date)) {
      reasons.push('no_run_log_today');
      if (realSendsToday === 0) reasons.push('missed_send_window');
    } else if (realSendsToday === 0 && latest.sent === 0) {
      if (latest.failed > 0) {
        reasons.push('send_run_failed');
      } else if (
        (latest.skipReasons?.daily_cap ?? 0) > 0 &&
        todayCapDrift &&
        capDriftBlocksSending(todayCapDrift)
      ) {
        reasons.push('daily_cap_skip_with_drift');
      } else {
        reasons.push('missed_send_window');
      }
    } else if (latest.failed > 0 && dueCount > 0) {
      reasons.push('send_run_failed');
    }
  }

  if (reasons.length === 0) return null;
  return { campaignId, reasons: [...new Set(reasons)], dueCount, realSendsToday };
}

export async function shouldAllowWatchdogKick(
  date: string,
  campaignId: string,
  forceAfterCapFix: boolean,
): Promise<boolean> {
  if (forceAfterCapFix) return true;
  const kv = getKV();
  if (!kv) return true;
  const last = await kv.get<number>(WATCHDOG_KICK_KEY(date, campaignId));
  if (typeof last !== 'number') return true;
  return Date.now() - last >= WATCHDOG_KICK_COOLDOWN_MS;
}

export async function recordWatchdogKick(date: string, campaignId: string): Promise<void> {
  const kv = getKV();
  if (!kv) return;
  await kv.set(WATCHDOG_KICK_KEY(date, campaignId), Date.now(), { ex: 60 * 60 * 36 });
}

export async function releaseSendLockForCampaign(campaignId: string): Promise<void> {
  await releaseKey(SEND_LOCK_KEY(campaignId));
}

export function summarizeCapDrifts(drifts: DailyCapDrift[]): string {
  return drifts
    .map((d) => `${d.campaignId} ${d.date} counter=${d.counterValue} real=${d.realCount}`)
    .join('; ');
}

export function countRealSendsTodayByCampaign(
  sends: FirmOutreachSend[],
  date: string,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const campaignId of OUTREACH_CAMPAIGN_IDS) {
    out[campaignId] = countRealSendsOnDate(sends, date, campaignId);
  }
  return out;
}
