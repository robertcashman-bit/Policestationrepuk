import { validateOutreachEnv } from '@robertcashman/firm-outreach-core';
import { outreachSendEnabled } from '../constants';
import { OUTREACH_CAMPAIGN_IDS } from '../site-config';
import {
  getLatestOutreachRunLog,
  listAllSends,
} from '../storage';
import type { OutreachRunStats } from '../types';
import { buildOutreachActivityReport } from './activity-report';
import { getOutreachSendHealth } from './from-address';
import { isPhantomSend } from './phantom-send-repair';
import {
  applyPhantomSendRepair,
  countRealSendsOnDate,
  findDailyCapDrift,
  fixDailyCapDrift,
} from './phantom-send-repair-apply';
import { sendOutreachSendFailureEmail } from './send-failure-email';

/** UTC send windows (hour, minute). */
export const OUTREACH_SEND_WINDOWS_UTC: Array<{ hour: number; minute: number }> = [
  { hour: 12, minute: 0 },
  { hour: 14, minute: 30 },
  { hour: 16, minute: 0 },
  { hour: 18, minute: 30 },
];

const WINDOW_GRACE_MINUTES = 45;

export interface OutreachWatchdogResult {
  ok: boolean;
  date: string;
  issues: string[];
  autoFixed: string[];
  phantomCount: number;
  capDrifts: Awaited<ReturnType<typeof findDailyCapDrift>>;
  realSendsToday: Record<string, number>;
  sendableReady: number;
  readyToSend: number;
  sendEnabled: boolean;
  sendAllowed: boolean;
  repair?: Awaited<ReturnType<typeof applyPhantomSendRepair>>;
}

function minutesSinceWindow(window: { hour: number; minute: number }, now: Date): number {
  const windowStart = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    window.hour,
    window.minute,
  );
  return (now.getTime() - windowStart) / 60_000;
}

function recentSendWindowPassed(now: Date): boolean {
  return OUTREACH_SEND_WINDOWS_UTC.some((w) => {
    const elapsed = minutesSinceWindow(w, now);
    return elapsed >= WINDOW_GRACE_MINUTES && elapsed <= WINDOW_GRACE_MINUTES + 60;
  });
}

export async function runOutreachWatchdog(opts?: {
  autoRepair?: boolean;
}): Promise<OutreachWatchdogResult> {
  const autoRepair = opts?.autoRepair !== false;
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const issues: string[] = [];
  const autoFixed: string[] = [];

  const envCheck = validateOutreachEnv({ requireCronSecret: false });
  if (!envCheck.ok) {
    issues.push(`Outreach env invalid: ${envCheck.errors.join('; ')}`);
  }

  const config = await import('../config-status').then((m) => m.getOutreachConfigStatus());
  const sendHealth = await getOutreachSendHealth();
  if (!sendHealth.sendHealthy) {
    issues.push(`Send config unhealthy: ${sendHealth.sendBlockers.join('; ')}`);
  }

  const sendAllowed = config.sendAllowed;
  const sendEnabled = outreachSendEnabled();
  if (!sendEnabled) issues.push('FIRM_OUTREACH_SEND_ENABLED=false');
  if (!sendAllowed) issues.push('Outreach send paused (env or admin KV pause)');

  const allSends = await listAllSends();
  const phantoms = allSends.filter(isPhantomSend);
  if (phantoms.length > 0) {
    issues.push(`${phantoms.length} phantom send record(s) without provider message IDs`);
  }

  let capDrifts = await findDailyCapDrift(allSends, date);
  if (capDrifts.length > 0) {
    issues.push(
      `Daily cap drift: ${capDrifts
        .map((d) => `${d.campaignId} counter=${d.counterValue} real=${d.realCount}`)
        .join('; ')}`,
    );
  }

  const realSendsToday: Record<string, number> = {};
  for (const campaignId of OUTREACH_CAMPAIGN_IDS) {
    realSendsToday[campaignId] = countRealSendsOnDate(allSends, date, campaignId);
  }

  const { report } = await buildOutreachActivityReport();
  const sendableReady = report.readyToSendProspects.filter((r) => !r.suppressed && r.email).length;
  const readyToSend = report.summary.readyToSend;

  if (autoRepair) {
    if (phantoms.length > 0) {
      const repair = await applyPhantomSendRepair({ recountDailyCaps: true });
      autoFixed.push(
        `Removed ${repair.phantomsRemoved} phantom send(s); reconciled ${repair.prospectsReconciled} prospect(s)`,
      );
      capDrifts = await findDailyCapDrift(
        (await listAllSends()).filter((s) => !isPhantomSend(s)),
        date,
      );
    } else if (capDrifts.length > 0) {
      const fixed = await fixDailyCapDrift(allSends, date);
      if (fixed > 0) {
        autoFixed.push(`Recounted ${fixed} daily cap key(s) from provider-confirmed sends`);
        capDrifts = [];
      }
    }
  }

  if (recentSendWindowPassed(now) && sendEnabled && sendAllowed && sendableReady > 0) {
    for (const campaignId of OUTREACH_CAMPAIGN_IDS) {
      const latest = await getLatestOutreachRunLog(campaignId);
      const realToday = realSendsToday[campaignId] ?? 0;
      const windowJustPassed = OUTREACH_SEND_WINDOWS_UTC.some((w) => {
        const elapsed = minutesSinceWindow(w, now);
        return elapsed >= WINDOW_GRACE_MINUTES && elapsed <= WINDOW_GRACE_MINUTES + 60;
      });
      if (!windowJustPassed) continue;

      if (!latest || !latest.startedAt.startsWith(date)) {
        issues.push(`${campaignId}: no send run log for today after a send window`);
        continue;
      }
      if (latest.sent === 0 && latest.failed === 0 && realToday === 0) {
        issues.push(
          `${campaignId}: send window passed with ${sendableReady} sendable ready but 0 provider-confirmed sends today`,
        );
      }
    }
  }

  const remainingIssues = issues.filter((issue) => {
    if (issue.includes('phantom send record') && autoFixed.some((f) => f.includes('phantom'))) {
      return false;
    }
    if (issue.startsWith('Daily cap drift') && autoFixed.some((f) => f.includes('daily cap'))) {
      return false;
    }
    return true;
  });

  return {
    ok: remainingIssues.length === 0,
    date,
    issues: remainingIssues,
    autoFixed,
    phantomCount: phantoms.length,
    capDrifts,
    realSendsToday,
    sendableReady,
    readyToSend,
    sendEnabled,
    sendAllowed,
  };
}

export async function maybeAlertOutreachWatchdog(result: OutreachWatchdogResult): Promise<void> {
  if (result.ok) return;

  const stats: OutreachRunStats = {
    queued: 0,
    sent: Object.values(result.realSendsToday).reduce((a, b) => a + b, 0),
    skipped: 0,
    suppressed: 0,
    errors: result.issues.length,
    elapsedMs: 0,
  };

  const lines = [
    ...result.issues,
    ...(result.autoFixed.length ? [`Auto-fixed: ${result.autoFixed.join('; ')}`] : []),
    `Real sends today: ${JSON.stringify(result.realSendsToday)}`,
    `Sendable ready: ${result.sendableReady}`,
  ];

  await sendOutreachSendFailureEmail({
    stats,
    readyToSend: result.readyToSend,
    reason: `Outreach watchdog alert — ${lines.join(' · ')}`,
    date: result.date,
  });
}
