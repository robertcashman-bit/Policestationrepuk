import { NextResponse } from 'next/server';
import { validateOutreachEnv } from '@robertcashman/firm-outreach-core';
import { isOutreachBootstrapAuthorized } from '@/lib/cron-auth';
import { outreachRequireApproval } from '@/lib/firm-outreach/constants';
import { getOutreachConfigStatus } from '@/lib/firm-outreach/config-status';
import { countEmailJobsByStatus } from '@/lib/firm-outreach/email-jobs/storage';
import { selectOutreachCandidates } from '@/lib/firm-outreach/outreach/candidate-selection';
import {
  STATUS_ELIGIBILITY_MAX_READY_SCAN,
  STATUS_ELIGIBILITY_READY_LIMIT,
  STATUS_ELIGIBILITY_SENT_LIMIT,
} from '@/lib/firm-outreach/status-eligibility-bounds';
import {
  getDailySendCount,
  getLatestOutreachRunLog,
  listProspectIdsByStatus,
} from '@/lib/firm-outreach/storage';
import {
  isAgentCoverOutreachDisabled,
  isOutreachCampaignSendable,
  OUTREACH_CAMPAIGN_IDS,
} from '@/lib/firm-outreach/site-config';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
/** Status must stay under platform proxy timeouts (~60s). Keep this route light. */
export const maxDuration = 60;

function utcDateOffset(daysAgo: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

function emptyEligibility(lastRun: unknown) {
  return {
    readyScanned: 0,
    readyEligible: 0,
    followUpEligible: 0,
    skippedIndexedSend: 0,
    skippedIdempotentJob: 0,
    firmCooldownSkipped: 0,
    sendableCandidates: 0,
    lastRun,
  };
}

/** Outreach health — config, pause state, queue, and durable job summary. */
export async function GET(request: Request) {
  if (!isOutreachBootstrapAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const envCheck = validateOutreachEnv();
  const today = new Date().toISOString().slice(0, 10);

  // Bound ready ID materialization — we only need a length (or a sample).
  // Full SMEMBERS of a multi-k ready set is fine; do NOT follow with dual
  // 1200-row selectOutreachCandidates (that is what 504'd under maxDuration=60).
  const [config, jobCounts, readyIds, sentToday, sentLast7Days, ...campaignRows] =
    await Promise.all([
      getOutreachConfigStatus(),
      countEmailJobsByStatus(),
      listProspectIdsByStatus('ready_to_send'),
      getDailySendCount(today),
      (async () => {
        const parts = await Promise.all(
          Array.from({ length: 7 }, (_, i) => getDailySendCount(utcDateOffset(i))),
        );
        return parts.reduce((a, b) => a + b, 0);
      })(),
      ...OUTREACH_CAMPAIGN_IDS.map(async (campaignId) => {
        const lastRun = await getLatestOutreachRunLog(campaignId);
        // Permanently-disabled PSA: do not scan the shared ready pile for it.
        if (
          !isOutreachCampaignSendable(campaignId) ||
          (campaignId === 'agent_cover_kent_v1' && isAgentCoverOutreachDisabled())
        ) {
          return { campaignId, eligibility: emptyEligibility(lastRun) };
        }
        const selection = await selectOutreachCandidates({
          campaignId,
          readyLimit: STATUS_ELIGIBILITY_READY_LIMIT,
          sentLimit: STATUS_ELIGIBILITY_SENT_LIMIT,
          maxReadyScan: STATUS_ELIGIBILITY_MAX_READY_SCAN,
          // Status only needs eligibility counts — skip per-solicitor cooldown
          // and the campaign send-index fan-out that blew the 60s budget.
          excludeFirmCooldown: false,
          skipIndexedSendCheck: true,
        });
        return {
          campaignId,
          eligibility: {
            readyScanned: selection.readyScanned,
            readyEligible: selection.readyEligible,
            followUpEligible: selection.followUpEligible,
            skippedIndexedSend: selection.skippedIndexedSend,
            skippedIdempotentJob: selection.skippedIdempotentJob,
            firmCooldownSkipped: selection.firmCooldownSkipped,
            sendableCandidates: selection.candidates.length,
            lastRun,
          },
        };
      }),
    ]);

  const eligibility: Record<string, (typeof campaignRows)[number]['eligibility']> = {};
  for (const row of campaignRows) {
    eligibility[row.campaignId] = row.eligibility;
  }

  const pendingJobs = jobCounts.pending ?? 0;
  const processingJobs = (jobCounts.claimed ?? 0) + (jobCounts.processing ?? 0);
  const retryJobs = jobCounts.retry_scheduled ?? 0;
  const permanentlyFailed = jobCounts.permanently_failed ?? 0;

  const sendableReady = Object.values(eligibility).reduce(
    (n, e) => n + (e.readyEligible ?? 0),
    0,
  );

  return NextResponse.json({
    ok:
      config.kvConfigured &&
      config.resendConfigured &&
      config.outreachEnabled &&
      config.sendHealthy !== false &&
      envCheck.ok,
    date: today,
    config: {
      ...config,
      requireApproval: outreachRequireApproval(),
      dryRun: envCheck.dryRun,
      envErrors: envCheck.errors,
      envWarnings: envCheck.warnings,
    },
    queue: {
      readyToSend: readyIds.length,
      sendableReady,
      sentToday,
      sentLast7Days,
      /** Truly due for a send step (excludes not-due sent / stale ready). */
      eligibility,
    },
    jobs: {
      pending: pendingJobs,
      processing: processingJobs,
      retryScheduled: retryJobs,
      accepted: jobCounts.accepted ?? 0,
      delivered: jobCounts.delivered ?? 0,
      bounced: jobCounts.bounced ?? 0,
      complained: jobCounts.complained ?? 0,
      permanentlyFailed,
      byStatus: jobCounts,
    },
  });
}
