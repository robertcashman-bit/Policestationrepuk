/**
 * Consolidated dual-workspace daily outreach report builder.
 * Authoritative metrics come from send records (provider message IDs) + job/autoheal runs.
 */
import { getOutreachCapacity, type OutreachCapacity } from '../capacity';
import { getLatestJobRun, listRecentJobRuns } from '../job-runs';
import { getOutreachSendHealth } from '../outreach/from-address';
import { listAllSends, listAllSuppressions } from '../storage';
import { OUTREACH_WORKSPACES, type OutreachWorkspaceId } from '../workspaces';
import { classifyWorkspaceHealth, type WorkspaceHealthStatus } from './health-status';
import { londonDayBounds, previousLondonDate, REPORT_TIMEZONE } from './period';
import { explainZeroAccepted, type ZeroSendExplanation } from './zero-reason';

export interface AcceptedRecipientRow {
  firmName: string;
  contactName?: string;
  email: string;
  providerMessageId: string;
  campaignId: string;
  sentAt: string;
  workspace: OutreachWorkspaceId;
}

export interface WorkspaceDailySection {
  workspace: OutreachWorkspaceId;
  label: string;
  productionUrl: string;
  status: WorkspaceHealthStatus;
  provider: string;
  sender: string;
  eligibleRecipientsFound: number;
  emailsQueued: number;
  emailsAttempted: number;
  emailsAcceptedByProvider: number;
  emailsDelivered: number;
  temporaryFailures: number;
  permanentFailures: number;
  retriesScheduled: number;
  bounces: number;
  complaints: number;
  unsubscribes: number;
  suppressed: number;
  duplicateSkips: number;
  providerAllowance: string;
  providerUsed: number;
  providerRemaining: string;
  nextReset: string;
  lastSchedulerRun: string | null;
  autohealRuns: number;
  autohealRepairs: string[];
  outstandingFaults: string[];
  recipients: AcceptedRecipientRow[];
  zeroReason: ZeroSendExplanation | null;
  capacity: OutreachCapacity;
}

export interface ConsolidatedDailyReport {
  date: string;
  reportingPeriodStart: string;
  reportingPeriodEnd: string;
  timezone: string;
  psa: WorkspaceDailySection;
  repuk: WorkspaceDailySection;
  totals: {
    eligible: number;
    attempted: number;
    accepted: number;
    delivered: number;
    failed: number;
    retrying: number;
    suppressed: number;
    overallStatus: WorkspaceHealthStatus;
  };
  actionRequired: string[];
}

function inPeriod(iso: string | undefined, start: Date, end: Date): boolean {
  if (!iso) return false;
  const t = Date.parse(iso);
  return Number.isFinite(t) && t >= start.getTime() && t < end.getTime();
}

async function buildWorkspaceSection(
  workspaceId: OutreachWorkspaceId,
  periodStart: Date,
  periodEnd: Date,
  sendHealth: Awaited<ReturnType<typeof getOutreachSendHealth>>,
): Promise<WorkspaceDailySection> {
  const meta = OUTREACH_WORKSPACES.find((w) => w.id === workspaceId)!;
  const capacity = await getOutreachCapacity(workspaceId);
  const campaignHealth = sendHealth.campaigns.find((c) => c.campaignId === meta.campaignId);
  const sender =
    process.env[meta.preferredFromEnv]?.trim() ||
    campaignHealth?.from ||
    meta.defaultFrom;

  const sends = await listAllSends();
  const campaignSends = sends.filter((s) => s.campaignId === meta.campaignId);

  const periodSends = campaignSends.filter((s) => inPeriod(s.sentAt, periodStart, periodEnd));
  const accepted = periodSends.filter((s) => Boolean(s.resendMessageId));
  const delivered = periodSends.filter((s) => Boolean(s.deliveredAt) || s.status === 'delivered' || s.status === 'opened' || s.status === 'clicked');
  const bounced = periodSends.filter((s) => s.status === 'bounced' || Boolean(s.bouncedAt));
  const complained = periodSends.filter((s) => s.status === 'complained' || Boolean(s.complainedAt));

  const suppressions = await listAllSuppressions();
  const suppressedInPeriod = suppressions.filter((s) => inPeriod(s.createdAt, periodStart, periodEnd)).length;

  const latestWorker = await getLatestJobRun('outreach_worker', workspaceId);
  const latestBothWorker = await getLatestJobRun('outreach_worker', 'both');
  const schedulerRun = latestWorker ?? latestBothWorker;
  const lastSchedulerOk = schedulerRun?.status === 'success' || schedulerRun?.status === 'partial';
  const lastSchedulerAgeMs = schedulerRun?.finished
    ? Date.now() - Date.parse(schedulerRun.finished)
    : schedulerRun?.started
      ? Date.now() - Date.parse(schedulerRun.started)
      : null;

  const autohealRuns = (await listRecentJobRuns('autoheal', 50)).filter((r) => {
    const t = Date.parse(r.started);
    return t >= periodStart.getTime() && t < periodEnd.getTime();
  });
  const repairs = autohealRuns.flatMap((r) => r.repairsPerformed ?? []);
  const outstandingFaults: string[] = [];
  if (!sendHealth.resendConfigured) outstandingFaults.push('RESEND_API_KEY missing');
  if (campaignHealth && !campaignHealth.canSend) {
    outstandingFaults.push(...(campaignHealth.blockers ?? ['campaign send unhealthy']));
  }
  if (capacity.dryRun) outstandingFaults.push('dry_run_enabled');
  if (!capacity.sendingEnabled) outstandingFaults.push('sending_disabled');

  const providerAuthOk =
    sendHealth.resendConfigured && (campaignHealth?.canSend ?? sendHealth.sendHealthy);
  const status = classifyWorkspaceHealth({
    capacity,
    lastSchedulerOk: Boolean(lastSchedulerOk),
    lastSchedulerAgeMs,
    outstandingFaults,
    providerAuthOk,
    acceptedToday: accepted.length,
    temporaryFailures: capacity.retryScheduledJobs,
    pendingBacklog: capacity.pendingJobs + capacity.claimedJobs + capacity.processingJobs,
  });

  const recipients: AcceptedRecipientRow[] = accepted
    .filter((s) => s.resendMessageId && s.sentAt)
    .map((s) => ({
      firmName: s.firmName,
      contactName: undefined,
      email: s.email,
      providerMessageId: s.resendMessageId!,
      campaignId: s.campaignId,
      sentAt: s.sentAt!,
      workspace: workspaceId,
    }))
    .sort((a, b) => a.sentAt.localeCompare(b.sentAt));

  const attempted = periodSends.length;
  const zeroReason = explainZeroAccepted({
    capacity,
    attempted,
    accepted: accepted.length,
    suppressed: suppressedInPeriod,
    schedulerFailed: Boolean(
      schedulerRun && (schedulerRun.status === 'failed' || !lastSchedulerOk) && accepted.length === 0,
    ),
    schedulerRepaired: repairs.some((r) => r.includes('scheduler') || r.includes('trigger_outreach')),
    providerAuthFailed: !providerAuthOk,
    queueFailure: repairs.some((r) => r.includes('queue')),
    queueRepairedJobs: autohealRuns.reduce((n, r) => n + (Number(r.meta?.jobsCreated) || 0), 0),
    outstandingFaults,
  });

  const providerAllowance = capacity.providerBudgetUnlimited
    ? 'unlimited (no soft daily Resend budget)'
    : String(capacity.providerDailyLimit ?? 'n/a');
  const providerRemaining = capacity.providerBudgetUnlimited
    ? 'unlimited'
    : String(capacity.providerRemainingToday);

  return {
    workspace: workspaceId,
    label: meta.label,
    productionUrl: meta.productionUrl,
    status,
    provider: 'Resend',
    sender,
    eligibleRecipientsFound: capacity.eligibleUnsent,
    emailsQueued: capacity.pendingJobs + capacity.retryScheduledJobs,
    emailsAttempted: attempted,
    emailsAcceptedByProvider: accepted.length,
    emailsDelivered: delivered.length,
    temporaryFailures: capacity.retryScheduledJobs,
    permanentFailures: bounced.length, // period bounce events; permanent job fails surfaced via autoheal
    retriesScheduled: capacity.retryScheduledJobs,
    bounces: bounced.length,
    complaints: complained.length,
    unsubscribes: suppressions.filter(
      (s) => s.reason === 'unsubscribe' && inPeriod(s.createdAt, periodStart, periodEnd),
    ).length,
    suppressed: suppressedInPeriod,
    duplicateSkips: 0,
    providerAllowance,
    providerUsed: capacity.providerUsedToday,
    providerRemaining,
    nextReset: capacity.nextResetAt,
    lastSchedulerRun: schedulerRun?.finished ?? schedulerRun?.started ?? null,
    autohealRuns: autohealRuns.length,
    autohealRepairs: [...new Set(repairs)].slice(0, 40),
    outstandingFaults,
    recipients,
    zeroReason,
    capacity,
  };
}

function mergeOverallStatus(a: WorkspaceHealthStatus, b: WorkspaceHealthStatus): WorkspaceHealthStatus {
  const rank: Record<WorkspaceHealthStatus, number> = {
    FAILED: 5,
    DEGRADED: 4,
    LIMIT_REACHED: 3,
    NO_ELIGIBLE_LEADS: 2,
    HEALTHY: 1,
  };
  return rank[a] >= rank[b] ? a : b;
}

export async function buildConsolidatedDailyReport(
  now = new Date(),
): Promise<ConsolidatedDailyReport> {
  const periodDate = previousLondonDate(now);
  const { start, end } = londonDayBounds(periodDate);
  const sendHealth = await getOutreachSendHealth();

  const [psa, repuk] = await Promise.all([
    buildWorkspaceSection('psa', start, end, sendHealth),
    buildWorkspaceSection('repuk', start, end, sendHealth),
  ]);

  const actionRequired: string[] = [];
  for (const section of [psa, repuk]) {
    if (!sendHealth.resendConfigured) {
      actionRequired.push(`${section.label}: provider API key missing/invalid`);
    }
    for (const fault of section.outstandingFaults) {
      if (fault === 'dry_run_enabled') {
        actionRequired.push(`${section.label}: dry-run accidentally enabled in production`);
      } else if (fault === 'sending_disabled') {
        actionRequired.push(`${section.label}: sending disabled`);
      } else if (fault.toLowerCase().includes('domain')) {
        actionRequired.push(`${section.label}: sender domain verification issue — ${fault}`);
      } else if (fault.toLowerCase().includes('auth') || fault.includes('RESEND')) {
        actionRequired.push(`${section.label}: ${fault}`);
      }
    }
    if (section.status === 'FAILED' && section.capacity.eligibleUnsent > 0) {
      actionRequired.push(
        `${section.label}: eligible recipients exist but system cannot send (${section.zeroReason?.code ?? section.status})`,
      );
    }
    if (section.zeroReason?.code === 'ZERO_REASON_UNKNOWN') {
      actionRequired.push(`${section.label}: zero-send reason unresolved — manual diagnostics required`);
    }
  }

  const uniqueActions = [...new Set(actionRequired)];

  return {
    date: periodDate,
    reportingPeriodStart: start.toISOString(),
    reportingPeriodEnd: end.toISOString(),
    timezone: REPORT_TIMEZONE,
    psa,
    repuk,
    totals: {
      eligible: psa.eligibleRecipientsFound + repuk.eligibleRecipientsFound,
      attempted: psa.emailsAttempted + repuk.emailsAttempted,
      accepted: psa.emailsAcceptedByProvider + repuk.emailsAcceptedByProvider,
      delivered: psa.emailsDelivered + repuk.emailsDelivered,
      failed: psa.permanentFailures + repuk.permanentFailures,
      retrying: psa.retriesScheduled + repuk.retriesScheduled,
      suppressed: psa.suppressed + repuk.suppressed,
      overallStatus: mergeOverallStatus(psa.status, repuk.status),
    },
    actionRequired: uniqueActions,
  };
}
