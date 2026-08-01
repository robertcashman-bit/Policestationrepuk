import { fetchLaaCrimeProviders } from '@/lib/legal-directory/laa-fetch';
import { ensureDsccRegisterCache } from '@/lib/dscc-register-lookup';
import { AGENT_COVER_KENT_CAMPAIGN_ID } from './campaign-scope';
import { outreachEnabled, outreachSendEnabled } from './constants';
import { cleanupNonFirmProspectEmails } from './cleanup-non-firm-emails';
import { runFirmDiscovery } from './discovery/run-discovery';
import { runFirmEnrichment } from './enrichment/run-enrich';
import { sendDailyOutreachDigest } from './outreach/digest-email';
import { getOutreachSendHealth } from './outreach/from-address';
import { maybeNotifyOutreachSendFailure } from './outreach/send-failure-email';
import { runFirmOutreach } from './outreach/run-outreach';
import { claimOutreachRunLock } from './run-lock';
import { requalifyAllProspects } from './requalify-prospects';
import { psaSendReserve } from './send-quota-split';
import { FIRM_OUTREACH_CAMPAIGN_ID } from './site-config';
import {
  syncKentProspectsToAgentCover,
  type SyncKentToAgentCoverStats,
} from './sync-kent-to-agent-cover';
import {
  countProspectsByStatus,
  getGlobalResendQuotaRemaining,
  listProspectIdsByRecordStatus,
} from './storage';
import type {
  DiscoveryRunStats,
  EnrichmentRunStats,
  OutreachRunStats,
} from './types';

/** When PSA ready queue is below this after enrich, run an extra Kent enrich pass. */
const PSA_READY_REFILL_FLOOR = 20;

export interface FirmOutreachPipelineResult {
  skipped: boolean;
  reason?: string;
  cleanup?: { reset: number; targets: number };
  laa: { refreshed: boolean; source: string; count: number };
  dscc: { count: number; syncedAt: string | null };
  discovery: DiscoveryRunStats;
  agentCoverDiscovery?: DiscoveryRunStats;
  agentCoverSync?: SyncKentToAgentCoverStats;
  requalify: Awaited<ReturnType<typeof requalifyAllProspects>>;
  enrich: EnrichmentRunStats;
  agentCoverEnrich?: EnrichmentRunStats;
  send: OutreachRunStats;
  /** PSA Kent campaign send stats (agent_cover_kent_v1). */
  agentCoverSend?: OutreachRunStats;
  counts: Record<string, number>;
  elapsedMs: number;
}

function isSundayUtc(): boolean {
  return new Date().getUTCDay() === 0;
}

export async function runFirmOutreachPipeline(opts?: {
  /** Force re-download LAA spreadsheet from gov.uk */
  forceLaaRefresh?: boolean;
  enrichLimit?: number;
  /** Max wall time for enrichment (cron safety). */
  enrichMaxElapsedMs?: number;
  sendLimit?: number;
  skipSend?: boolean;
  skipEnrich?: boolean;
  /** Skip LAA/DSCC refresh, discovery, and requalify (enrich-only or send-only crons). */
  skipDiscovery?: boolean;
  skipDigest?: boolean;
  /** Skip the full ready/sent prospect cleanup scan (send/enrich ticks). */
  skipCleanup?: boolean;
  /** Skip per-status KV count scan (send-only ticks). */
  skipCounts?: boolean;
}): Promise<FirmOutreachPipelineResult> {
  const started = Date.now();

  if (!outreachEnabled()) {
    if (!opts?.skipDigest) {
      await sendDailyOutreachDigest();
    }
    return {
      skipped: true,
      reason: 'FIRM_OUTREACH_ENABLED=false',
      laa: { refreshed: false, source: 'none', count: 0 },
      dscc: { count: 0, syncedAt: null },
      discovery: emptyDiscovery(),
      requalify: emptyRequalify(),
      enrich: emptyEnrich(),
      send: emptySend(),
      counts: {},
      elapsedMs: Date.now() - started,
    };
  }

  const cleanupResult = opts?.skipCleanup
    ? { reset: 0, targets: [] as Awaited<ReturnType<typeof cleanupNonFirmProspectEmails>>['targets'] }
    : await cleanupNonFirmProspectEmails({ dryRun: false });
  const cleanup = { reset: cleanupResult.reset, targets: cleanupResult.targets.length };

  let laaResult = { refreshed: false, source: 'none' as string, records: [] as unknown[] };
  let dsccCount = 0;
  let dsccSyncedAt: string | null = null;
  let discovery = emptyDiscovery();
  let agentCoverDiscovery: DiscoveryRunStats | undefined;
  let agentCoverSync: SyncKentToAgentCoverStats | undefined;
  let requalify: Awaited<ReturnType<typeof requalifyAllProspects>> = emptyRequalify();
  let enrich = emptyEnrich();
  let agentCoverEnrich: EnrichmentRunStats | undefined;

  if (!opts?.skipDiscovery) {
    const forceLaa = opts?.forceLaaRefresh ?? isSundayUtc();
    laaResult = await fetchLaaCrimeProviders({ force: forceLaa }).catch((err) => {
      console.warn('[firm-outreach pipeline] LAA fetch failed, using cache:', err);
      return fetchLaaCrimeProviders({ force: false });
    });

    const dscc = await ensureDsccRegisterCache();
    dsccCount = dscc?.count ?? 0;
    dsccSyncedAt = dscc?.syncedAt ?? null;
    discovery = await runFirmDiscovery();
    agentCoverDiscovery = await runFirmDiscovery({
      campaignId: AGENT_COVER_KENT_CAMPAIGN_ID,
      countyAllowlist: ['kent'],
    });
    agentCoverSync = await syncKentProspectsToAgentCover();
    requalify = await requalifyAllProspects();
  }

  if (!opts?.skipEnrich) {
    const enrichLocked = await claimOutreachRunLock('enrich');
    if (!enrichLocked) {
      enrich = { ...emptyEnrich(), skippedReason: 'overlap' };
    } else {
      const enrichLimit = opts?.enrichLimit ?? (opts?.skipSend ? 120 : 60);
      enrich = await runFirmEnrichment({
        limit: enrichLimit,
        maxElapsedMs: opts?.enrichMaxElapsedMs ?? 240_000,
      });
      // PSA enrich floor — keep Kent campaign fed even when RepUK backlog is large.
      const kentLimit = Math.max(40, Math.min(80, enrichLimit));
      agentCoverEnrich = await runFirmEnrichment({
        campaignId: AGENT_COVER_KENT_CAMPAIGN_ID,
        limit: kentLimit,
        maxElapsedMs: opts?.enrichMaxElapsedMs ?? 240_000,
      });
      const psaReadyAfter = await listProspectIdsByRecordStatus('ready_to_send', {
        campaignId: AGENT_COVER_KENT_CAMPAIGN_ID,
      });
      if (psaReadyAfter.length < PSA_READY_REFILL_FLOOR) {
        const extra = await runFirmEnrichment({
          campaignId: AGENT_COVER_KENT_CAMPAIGN_ID,
          limit: kentLimit,
          maxElapsedMs: opts?.enrichMaxElapsedMs ?? 240_000,
        });
        agentCoverEnrich = {
          processed: (agentCoverEnrich.processed ?? 0) + (extra.processed ?? 0),
          emailsFound: (agentCoverEnrich.emailsFound ?? 0) + (extra.emailsFound ?? 0),
          readyToSend: (agentCoverEnrich.readyToSend ?? 0) + (extra.readyToSend ?? 0),
          noEmail: (agentCoverEnrich.noEmail ?? 0) + (extra.noEmail ?? 0),
          errors: (agentCoverEnrich.errors ?? 0) + (extra.errors ?? 0),
          elapsedMs: (agentCoverEnrich.elapsedMs ?? 0) + (extra.elapsedMs ?? 0),
        };
      }
    }
  }

  let send = emptySend();
  let agentCoverSend: OutreachRunStats | undefined;

  if (!opts?.skipSend && outreachSendEnabled()) {
    const locked = await claimOutreachRunLock('send');
    if (!locked) {
      send = { ...emptySend(), skippedReason: 'overlap' };
      agentCoverSend = { ...emptySend(), skippedReason: 'overlap' };
    } else {
      const date = new Date().toISOString().slice(0, 10);
      const globalRemaining = await getGlobalResendQuotaRemaining(date);
      const psaReadyIds = await listProspectIdsByRecordStatus('ready_to_send', {
        campaignId: AGENT_COVER_KENT_CAMPAIGN_ID,
      });
      const { psaLimit, repukLimit } = psaSendReserve({
        globalRemaining,
        psaReadyCount: psaReadyIds.length,
        sendLimit: opts?.sendLimit,
      });

      // PSA first so shared Resend budget cannot be fully consumed by RepUK.
      agentCoverSend =
        psaLimit > 0
          ? await runFirmOutreach({
              campaignId: AGENT_COVER_KENT_CAMPAIGN_ID,
              limit: psaLimit,
              maxElapsedMs: 240_000,
            })
          : emptySend();

      send =
        repukLimit > 0
          ? await runFirmOutreach({
              campaignId: FIRM_OUTREACH_CAMPAIGN_ID,
              limit: repukLimit,
              maxElapsedMs: 240_000,
            })
          : emptySend();
    }
  }

  const counts = opts?.skipCounts ? {} : await countProspectsByStatus();
  const combinedSend = mergeSendStats(send, agentCoverSend);

  if (!opts?.skipSend && !opts?.skipCounts) {
    const sendHealth = await getOutreachSendHealth();
    if (!sendHealth.sendHealthy) {
      await maybeNotifyOutreachSendFailure({
        stats: combinedSend,
        readyToSend: counts.ready_to_send ?? 0,
        reason: `Outreach send config unhealthy: ${sendHealth.sendBlockers.join('; ')}. PSA may use RepUK from-address until policestationagent.com is verified on Resend.`,
      });
    } else {
      await maybeNotifyOutreachSendFailure({
        stats: combinedSend,
        readyToSend: counts.ready_to_send ?? 0,
      });
    }
  }

  if (!opts?.skipDigest) {
    await sendDailyOutreachDigest({
      pipeline: {
        discovery,
        enrich,
        send,
        agentCoverSend,
        counts,
        laaRefreshed: laaResult.refreshed,
      },
    });
  }

  return {
    skipped: false,
    cleanup,
    laa: {
      refreshed: laaResult.refreshed,
      source: laaResult.source,
      count: laaResult.records.length,
    },
    dscc: {
      count: dsccCount,
      syncedAt: dsccSyncedAt,
    },
    discovery,
    agentCoverDiscovery,
    agentCoverSync,
    requalify,
    enrich,
    agentCoverEnrich,
    send,
    agentCoverSend,
    counts,
    elapsedMs: Date.now() - started,
  };
}

function mergeSendStats(
  repuk: OutreachRunStats,
  psa: OutreachRunStats | undefined,
): OutreachRunStats {
  if (!psa) return repuk;
  return {
    queued: (repuk.queued ?? 0) + (psa.queued ?? 0),
    sent: (repuk.sent ?? 0) + (psa.sent ?? 0),
    skipped: (repuk.skipped ?? 0) + (psa.skipped ?? 0),
    suppressed: (repuk.suppressed ?? 0) + (psa.suppressed ?? 0),
    errors: (repuk.errors ?? 0) + (psa.errors ?? 0),
    elapsedMs: (repuk.elapsedMs ?? 0) + (psa.elapsedMs ?? 0),
    attempted: (repuk.attempted ?? 0) + (psa.attempted ?? 0),
    partial: Boolean(repuk.partial || psa.partial),
    skippedReason: repuk.skippedReason ?? psa.skippedReason,
  };
}

function emptyRequalify() {
  return {
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
    samples: [],
  };
}

function emptyDiscovery(): DiscoveryRunStats {
  return {
    laaRows: 0,
    dsccFirms: 0,
    dsccSolicitors: 0,
    archiveRows: 0,
    directoryRows: 0,
    created: 0,
    updated: 0,
    excluded: 0,
    elapsedMs: 0,
  };
}

function emptyEnrich(): EnrichmentRunStats {
  return {
    processed: 0,
    emailsFound: 0,
    readyToSend: 0,
    noEmail: 0,
    errors: 0,
    elapsedMs: 0,
  };
}

function emptySend(): OutreachRunStats {
  return {
    queued: 0,
    sent: 0,
    skipped: 0,
    suppressed: 0,
    errors: 0,
    elapsedMs: 0,
  };
}
