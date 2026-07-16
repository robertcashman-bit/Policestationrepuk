import { validateOutreachEnv } from '@robertcashman/firm-outreach-core';
import { cronSendBatchSize, outreachSendEnabled } from '../constants';
import { runFirmOutreachPipeline } from '../run-pipeline';
import { OUTREACH_CAMPAIGN_IDS } from '../site-config';
import { getLatestOutreachRunLog, listAllSends } from '../storage';
import type { OutreachRunStats } from '../types';
import { buildOutreachActivityReport } from './activity-report';
import { getOutreachSendHealth } from './from-address';
import {
  collectCapDriftCheckDates,
  countDueSendableByCampaign,
  detectCampaignSendRecovery,
  findAllDailyCapDrifts,
  fixAllDailyCapDrifts,
  OUTREACH_SEND_WINDOWS_UTC,
  minutesSinceSendWindow,
  recordWatchdogKick,
  reconcileStaleReadyProspects,
  releaseSendLockForCampaign,
  shouldAllowWatchdogKick,
  summarizeCapDrifts,
  countRealSendsTodayByCampaign,
  type CampaignSendRecovery,
} from './outreach-autofix';
import { isPhantomSend } from './phantom-send-repair';
import {
  applyPhantomSendRepair,
  findDailyCapDrift,
} from './phantom-send-repair-apply';
import { sendOutreachSendFailureEmail } from './send-failure-email';

/** Grace after a scheduled send window before recovery kicks in. */
const SEND_WINDOW_GRACE_MINUTES = 30;

export { OUTREACH_SEND_WINDOWS_UTC };

export interface OutreachWatchdogResult {
  ok: boolean;
  date: string;
  issues: string[];
  autoFixed: string[];
  phantomCount: number;
  capDrifts: Awaited<ReturnType<typeof findDailyCapDrift>>;
  realSendsToday: Record<string, number>;
  sendableReady: number;
  dueSendable: number;
  readyToSend: number;
  sendEnabled: boolean;
  sendAllowed: boolean;
  recovery?: CampaignSendRecovery[];
  repair?: Awaited<ReturnType<typeof applyPhantomSendRepair>>;
}

/** Count prospects the send loop would actually attempt (next step due), across campaigns. */
export async function countDueSendableProspects(opts?: {
  perStatusLimit?: number;
  nowMs?: number;
}): Promise<number> {
  const byCampaign = await countDueSendableByCampaign(opts);
  return Object.values(byCampaign).reduce((a, b) => a + b, 0);
}

async function runAutonomousSendKick(opts: {
  date: string;
  campaigns: string[];
  capFixedThisRun: boolean;
}): Promise<{ sent: number; autoFixed: string[]; issues: string[] }> {
  const autoFixed: string[] = [];
  const issues: string[] = [];
  let totalSent = 0;

  for (const campaignId of opts.campaigns) {
    const allowed = await shouldAllowWatchdogKick(
      opts.date,
      campaignId,
      opts.capFixedThisRun,
    );
    if (!allowed) continue;

    await releaseSendLockForCampaign(campaignId);
  }

  try {
    const kick = await runFirmOutreachPipeline({
      skipDiscovery: true,
      skipEnrich: true,
      skipDigest: true,
      skipCleanup: true,
      skipCounts: true,
      sendLimit: cronSendBatchSize(),
    });
    totalSent = kick.send?.sent ?? 0;
    autoFixed.push(
      `Auto-kicked send-only for [${opts.campaigns.join(', ')}]; sent=${totalSent}`,
    );

    for (const campaignId of opts.campaigns) {
      await recordWatchdogKick(opts.date, campaignId);
    }
  } catch (err) {
    issues.push(
      `Auto-kick send failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  return { sent: totalSent, autoFixed, issues };
}

export async function runOutreachWatchdog(opts?: {
  autoRepair?: boolean;
}): Promise<OutreachWatchdogResult> {
  const autoRepair = opts?.autoRepair !== false;
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const autoFixed: string[] = [];
  let issues: string[] = [];

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

  let allSends = await listAllSends();
  const phantoms = allSends.filter(isPhantomSend);
  if (phantoms.length > 0) {
    issues.push(`${phantoms.length} phantom send record(s) without provider message IDs`);
  }

  const capDates = collectCapDriftCheckDates(allSends, { anchorDate: date });
  let capDrifts = await findAllDailyCapDrifts(allSends, capDates);
  const todayCapDrifts = capDrifts.filter((d) => d.date === date);
  if (todayCapDrifts.length > 0) {
    issues.push(`Daily cap drift today: ${summarizeCapDrifts(todayCapDrifts)}`);
  }
  if (capDrifts.length > todayCapDrifts.length) {
    issues.push(
      `Historical cap drift (${capDrifts.length - todayCapDrifts.length} older day(s))`,
    );
  }

  let realSendsToday = countRealSendsTodayByCampaign(allSends, date);

  const { report } = await buildOutreachActivityReport();
  const sendableReady = report.readyToSendProspects.filter((r) => !r.suppressed && r.email).length;
  const readyToSend = report.summary.readyToSend;
  const dueByCampaign = await countDueSendableByCampaign({ nowMs: now.getTime() });
  const dueSendable = Object.values(dueByCampaign).reduce((a, b) => a + b, 0);

  let capFixedThisRun = false;

  if (autoRepair) {
    const reconciled = await reconcileStaleReadyProspects();
    if (reconciled > 0) {
      autoFixed.push(`Reconciled ${reconciled} stale-ready prospect(s) to sent`);
    }

    if (phantoms.length > 0) {
      const repair = await applyPhantomSendRepair({ recountDailyCaps: true });
      autoFixed.push(
        `Removed ${repair.phantomsRemoved} phantom send(s); reconciled ${repair.prospectsReconciled} prospect(s)`,
      );
      allSends = (await listAllSends()).filter((s) => !isPhantomSend(s));
      capDrifts = await findAllDailyCapDrifts(allSends, capDates);
      capFixedThisRun = repair.dailyCapsFixed > 0;
    }

    if (capDrifts.length > 0) {
      const fixed = await fixAllDailyCapDrifts(allSends, [...new Set(capDrifts.map((d) => d.date))]);
      if (fixed > 0) {
        autoFixed.push(`Recounted ${fixed} daily cap key(s) from provider-confirmed sends`);
        capDrifts = await findAllDailyCapDrifts(allSends, capDates);
        capFixedThisRun = true;
      }
    }
  }

  const recovery: CampaignSendRecovery[] = [];
  const kickCampaigns: string[] = [];

  const canRecover =
    sendEnabled && sendAllowed && sendHealth.sendHealthy && envCheck.ok;

  if (canRecover && dueSendable > 0) {
    for (const campaignId of OUTREACH_CAMPAIGN_IDS) {
      const latest = await getLatestOutreachRunLog(campaignId);
      const todayDrift = capDrifts.find((d) => d.campaignId === campaignId && d.date === date);
      const detected = detectCampaignSendRecovery({
        campaignId,
        now,
        date,
        dueCount: dueByCampaign[campaignId] ?? 0,
        realSendsToday: realSendsToday[campaignId] ?? 0,
        latest,
        todayCapDrift: todayDrift,
        graceMinutes: SEND_WINDOW_GRACE_MINUTES,
      });
      if (detected) {
        recovery.push(detected);
        kickCampaigns.push(campaignId);
        issues.push(
          `${campaignId}: recovery needed (${detected.reasons.join(', ')}) — due=${detected.dueCount}, realToday=${detected.realSendsToday}`,
        );
      }
    }
  }

  // Pre-send heal: 15 min before first window, reconcile + caps only (no kick).
  const minutesToFirstWindow = OUTREACH_SEND_WINDOWS_UTC.length
    ? minutesSinceSendWindow(OUTREACH_SEND_WINDOWS_UTC[0], now)
    : Infinity;
  const preSendHeal =
    autoRepair && minutesToFirstWindow < 0 && minutesToFirstWindow >= -15;

  if (preSendHeal && autoFixed.length === 0 && capDrifts.length === 0 && phantoms.length === 0) {
    autoFixed.push('Pre-send heal: queue and caps OK');
  }

  if (autoRepair && kickCampaigns.length > 0) {
    const kick = await runAutonomousSendKick({
      date,
      campaigns: kickCampaigns,
      capFixedThisRun,
    });
    autoFixed.push(...kick.autoFixed);
    issues.push(...kick.issues);

    allSends = await listAllSends();
    realSendsToday = countRealSendsTodayByCampaign(allSends, date);

    const stillZero = kickCampaigns.filter((id) => (realSendsToday[id] ?? 0) === 0);
    if (kick.sent === 0 && stillZero.length > 0 && capFixedThisRun) {
      const retry = await runAutonomousSendKick({
        date,
        campaigns: stillZero,
        capFixedThisRun: true,
      });
      autoFixed.push(...retry.autoFixed);
      issues.push(...retry.issues);
      allSends = await listAllSends();
      realSendsToday = countRealSendsTodayByCampaign(allSends, date);
    }

    const resolved = kickCampaigns.filter((id) => (realSendsToday[id] ?? 0) > 0);
    if (resolved.length > 0) {
      issues = issues.filter(
        (issue) => !resolved.some((id) => issue.startsWith(`${id}: recovery needed`)),
      );
    }
  }

  const remainingIssues = issues.filter((issue) => {
    if (issue.includes('phantom send record') && autoFixed.some((f) => f.includes('phantom'))) {
      return false;
    }
    if (issue.startsWith('Daily cap drift') && autoFixed.some((f) => f.includes('daily cap'))) {
      return false;
    }
    if (issue.startsWith('Historical cap drift') && autoFixed.some((f) => f.includes('daily cap'))) {
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
    capDrifts: todayCapDrifts,
    realSendsToday,
    sendableReady,
    dueSendable,
    readyToSend,
    sendEnabled,
    sendAllowed,
    recovery: recovery.length ? recovery : undefined,
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
    `Due sendable: ${result.dueSendable}`,
    `Ready (status) sendable: ${result.sendableReady}`,
  ];

  await sendOutreachSendFailureEmail({
    stats,
    readyToSend: result.readyToSend,
    reason: `Outreach watchdog alert (autofix exhausted) — ${lines.join(' · ')}`,
    date: result.date,
  });
}
