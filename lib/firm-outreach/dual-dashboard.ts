/**
 * Dual-workspace outreach dashboard payload (authoritative capacity + runs).
 */
import { getAllWorkspacesCapacity } from './capacity';
import { getLatestJobRun } from './job-runs';
import { getOutreachSendHealth } from './outreach/from-address';
import { getLatestDailyReportRun } from './reporting/daily-report-audit';
import { classifyWorkspaceHealth } from './reporting/health-status';
import { getDailySendCount, listRecentSends } from './storage';
import { OUTREACH_WORKSPACES } from './workspaces';

export async function buildDualOutreachDashboard(now = new Date()) {
  const utcDate = now.toISOString().slice(0, 10);
  const [capacities, sendHealth, latestReport, recentSends] = await Promise.all([
    getAllWorkspacesCapacity(now),
    getOutreachSendHealth(),
    getLatestDailyReportRun(),
    listRecentSends(30),
  ]);

  const workspaces = [];
  for (const meta of OUTREACH_WORKSPACES) {
    const cap = capacities[meta.id];
    const campaignHealth = sendHealth.campaigns.find((c) => c.campaignId === meta.campaignId);
    const latestWorker = (await getLatestJobRun('outreach_worker', meta.id)) ??
      (await getLatestJobRun('outreach_worker', 'both'));
    const latestAutoheal = await getLatestJobRun('autoheal', 'both');
    const acceptedToday = await getDailySendCount(utcDate, meta.campaignId);
    const lastAccepted = recentSends.find(
      (s) => s.campaignId === meta.campaignId && s.resendMessageId,
    );

    const health = classifyWorkspaceHealth({
      capacity: cap,
      lastSchedulerOk:
        latestWorker?.status === 'success' || latestWorker?.status === 'partial',
      lastSchedulerAgeMs: latestWorker?.finished
        ? Date.now() - Date.parse(latestWorker.finished)
        : null,
      outstandingFaults: [
        ...(cap.dryRun ? ['dry_run'] : []),
        ...(!cap.sendingEnabled ? ['sending_disabled'] : []),
        ...((campaignHealth?.blockers ?? []).filter((b) => !b.includes('psa_using_repuk'))),
      ],
      providerAuthOk: Boolean(campaignHealth?.canSend),
      acceptedToday,
      temporaryFailures: cap.retryScheduledJobs,
      pendingBacklog: cap.pendingJobs + cap.claimedJobs + cap.processingJobs,
    });

    workspaces.push({
      id: meta.id,
      label: meta.label,
      productionUrl: meta.productionUrl,
      campaignId: meta.campaignId,
      health,
      provider: 'Resend',
      sendingEnabled: cap.sendingEnabled,
      providerVerified: Boolean(campaignHealth?.domainVerified),
      sender: campaignHealth?.from ?? meta.defaultFrom,
      lastSchedulerRun: latestWorker?.finished ?? latestWorker?.started ?? null,
      lastSuccessfulProviderAcceptance: lastAccepted?.sentAt ?? null,
      lastRecipient: lastAccepted
        ? {
            firmName: lastAccepted.firmName,
            email: lastAccepted.email,
            providerMessageId: lastAccepted.resendMessageId,
          }
        : null,
      acceptedToday,
      deliveredToday: recentSends.filter(
        (s) =>
          s.campaignId === meta.campaignId &&
          s.deliveredAt &&
          s.deliveredAt.slice(0, 10) === utcDate,
      ).length,
      failedToday: recentSends.filter(
        (s) =>
          s.campaignId === meta.campaignId &&
          (s.status === 'bounced' || s.status === 'complained') &&
          (s.bouncedAt ?? s.complainedAt ?? '').slice(0, 10) === utcDate,
      ).length,
      retries: cap.retryScheduledJobs,
      pending: cap.pendingJobs,
      eligibleUnsent: cap.eligibleUnsent,
      suppressed: null as number | null,
      providerLimit: cap.providerDailyLimit,
      providerRemaining: cap.providerBudgetUnlimited ? null : cap.providerRemainingToday,
      configuredLimit: cap.configuredDailyLimit,
      effectiveCapacity: cap.effectiveAvailableCapacity,
      limitingFactor: cap.limitingFactor,
      limitingDetail: cap.limitingDetail,
      lastAutoheal: latestAutoheal?.finished ?? latestAutoheal?.started ?? null,
      autohealRepairs: latestAutoheal?.repairsPerformed ?? [],
      recentErrors: latestWorker?.errorSummary ? [latestWorker.errorSummary] : [],
    });
  }

  return {
    generatedAt: now.toISOString(),
    workspaces,
    lastDailyReport: latestReport
      ? {
          reportDate: latestReport.reportDate,
          sentAt: latestReport.sentAt ?? null,
          recipient: latestReport.recipient,
          totalAccepted: latestReport.totalAcceptedCount,
          status: latestReport.emailStatus,
          providerMessageId: latestReport.providerMessageId ?? null,
          agentStatus: latestReport.workspaceAgentStatus,
          repukStatus: latestReport.workspaceRepukStatus,
        }
      : null,
    sendHealthy: sendHealth.sendHealthy,
    verifiedDomains: sendHealth.verifiedDomains,
  };
}
