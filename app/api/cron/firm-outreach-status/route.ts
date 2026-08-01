import { NextResponse } from 'next/server';
import { isCronAuthorized } from '@/lib/cron-auth';
import { AGENT_COVER_KENT_CAMPAIGN_ID } from '@/lib/firm-outreach/campaign-scope';
import { outreachRequireApproval } from '@/lib/firm-outreach/constants';
import { getOutreachConfigStatus } from '@/lib/firm-outreach/config-status';
import { buildOutreachActivityReport } from '@/lib/firm-outreach/outreach/activity-report';
import { isSendableReadyProspect } from '@/lib/firm-outreach/sendable-ready';
import { FIRM_OUTREACH_CAMPAIGN_ID, OUTREACH_CAMPAIGN_IDS } from '@/lib/firm-outreach/site-config';
import {
  getDailySendCount,
  getGlobalResendQuotaRemaining,
  getIndexRedisType,
  getProspect,
  listProspectIdsByStatus,
} from '@/lib/firm-outreach/storage';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function campaignQueueStats(campaignId: string, utcDate: string) {
  const readyIds = await listProspectIdsByStatus('ready_to_send');
  let ready = 0;
  let sendableReady = 0;
  let parkedCooldown = 0;
  for (const id of readyIds) {
    const p = await getProspect(id);
    if (!p || p.campaignId !== campaignId) continue;
    ready++;
    if (isSendableReadyProspect(p)) sendableReady++;
    else if (
      p.excludedReason === 'firm_cooldown' ||
      (p.nextEligibleAt && Date.parse(p.nextEligibleAt) > Date.now())
    ) {
      parkedCooldown++;
    }
  }
  const sentToday = await getDailySendCount(utcDate, campaignId);
  return { campaignId, ready, sendableReady, parkedCooldown, sentToday };
}

/** Outreach health — config, pause state, and queue summary for monitoring. */
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const utcDate = new Date().toISOString().slice(0, 10);
  const config = await getOutreachConfigStatus();
  const { report } = await buildOutreachActivityReport();
  const campaigns = [];
  for (const campaignId of OUTREACH_CAMPAIGN_IDS) {
    campaigns.push(await campaignQueueStats(campaignId, utcDate));
  }
  const repuk = campaigns.find((c) => c.campaignId === FIRM_OUTREACH_CAMPAIGN_ID);
  const psa = campaigns.find((c) => c.campaignId === AGENT_COVER_KENT_CAMPAIGN_ID);
  const totalSendable = campaigns.reduce((n, c) => n + c.sendableReady, 0);
  const totalReady = campaigns.reduce((n, c) => n + c.ready, 0);
  const resendRemaining = await getGlobalResendQuotaRemaining(utcDate);

  const readyIndexType = await getIndexRedisType('firmprospect:status:ready_to_send');
  const discoveredIndexType = await getIndexRedisType('firmprospect:status:discovered');
  const indexesOk = readyIndexType === 'set' && discoveredIndexType === 'set';

  const warnings: string[] = [];
  if (totalReady > 0 && totalSendable === 0) {
    warnings.push('ready_queue_unsendable');
  }
  if ((psa?.ready ?? 0) === 0 && resendRemaining > 0) {
    warnings.push('psa_ready_empty');
  }
  if (!indexesOk) {
    warnings.push(`index_type_unexpected:ready=${readyIndexType},discovered=${discoveredIndexType}`);
  }

  return NextResponse.json({
    ok:
      config.kvConfigured &&
      config.resendConfigured &&
      config.outreachEnabled &&
      config.sendHealthy !== false &&
      indexesOk,
    date: utcDate,
    warnings,
    config: {
      ...config,
      requireApproval: outreachRequireApproval(),
    },
    queue: {
      readyToSend: report.summary.readyToSend,
      sendableReady: totalSendable,
      sentToday: report.summary.sentToday,
      sentLast7Days: report.summary.sentLast7Days,
      resendRemaining,
      campaigns,
      indexes: {
        ready_to_send: readyIndexType,
        discovered: discoveredIndexType,
      },
    },
  });
}
