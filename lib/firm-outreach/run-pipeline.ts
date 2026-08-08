import { fetchLaaCrimeProviders } from '@/lib/legal-directory/laa-fetch';
import { ensureDsccRegisterCache } from '@/lib/dscc-register-lookup';
import { AGENT_COVER_KENT_CAMPAIGN_ID } from './campaign-scope';
import { outreachEnabled, outreachSendEnabled } from './constants';
import { cleanupNonFirmProspectEmails } from './cleanup-non-firm-emails';
import { runFirmDiscovery } from './discovery/run-discovery';
import { runFirmEnrichment } from './enrichment/run-enrich';
import { getOutreachSendHealth } from './outreach/from-address';
import { maybeNotifyOutreachSendFailure } from './outreach/send-failure-email';
import {
  emptyOutreachRunStats,
  runFirmOutreachAllCampaigns,
} from './outreach/run-outreach';
import { isOutreachSendAllowed } from './pause-state';
import { claimOutreachRunLock } from './run-lock';
import { requalifyAllProspects } from './requalify-prospects';
import { countProspectsByStatus } from './storage';
import {
  syncKentProspectsToAgentCover,
  type SyncKentToAgentCoverStats,
} from './sync-kent-to-agent-cover';
import type {
  DiscoveryRunStats,
  EnrichmentRunStats,
  OutreachRunStats,
} from './types';

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
  /** Combined send stats across RepUK + PSA campaigns. */
  send: OutreachRunStats;
  /** Per-campaign send stats (whatsapp_invite_v1 + agent_cover_kent_v1). */
  sendByCampaign?: Record<string, OutreachRunStats>;
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
    // Routine digests removed — consolidated 07:00 London report only.
    return {
      skipped: true,
      reason: 'FIRM_OUTREACH_ENABLED=false',
      laa: { refreshed: false, source: 'none', count: 0 },
      dscc: { count: 0, syncedAt: null },
      discovery: emptyDiscovery(),
      requalify: emptyRequalify(),
      enrich: emptyEnrich(),
      send: emptyOutreachRunStats(),
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
    // Kent→PSA sync FIRST: maintain often 504s during full discovery before sync ran.
    agentCoverSync = await syncKentProspectsToAgentCover({
      limit: 200,
      maxElapsedMs: 55_000,
    }).catch((err) => {
      console.warn('[firm-outreach pipeline] Kent→PSA sync failed:', err);
      return undefined;
    });

    const forceLaa = opts?.forceLaaRefresh ?? isSundayUtc();
    laaResult = await fetchLaaCrimeProviders({ force: forceLaa }).catch((err) => {
      console.warn('[firm-outreach pipeline] LAA fetch failed, using cache:', err);
      return fetchLaaCrimeProviders({ force: false });
    });

    const dscc = await ensureDsccRegisterCache();
    dsccCount = dscc?.count ?? 0;
    dsccSyncedAt = dscc?.syncedAt ?? null;
    discovery = await runFirmDiscovery();
    // Nationwide recipients; email copy still offers Kent agency cover.
    agentCoverDiscovery = await runFirmDiscovery({
      campaignId: AGENT_COVER_KENT_CAMPAIGN_ID,
      countyAllowlist: null,
    });
    requalify = await requalifyAllProspects();
  } else if (!opts?.skipSend) {
    // Keep send ticks send-first. Nationwide RepUK→PSA refill belongs on
    // /api/cron/firm-outreach-psa-sync (and maintain), not inside the 300s send budget.
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
    // PSA previously capped at enrichLimit/4 (≤15) and stayed emailless while
    // RepUK took the full batch. Give PSA a peer budget so sync is not the only supply.
    const psaEnrichLimit = Math.max(40, Math.floor(enrichLimit / 2));
    agentCoverEnrich = await runFirmEnrichment({
      campaignId: AGENT_COVER_KENT_CAMPAIGN_ID,
      limit: psaEnrichLimit,
      maxElapsedMs: opts?.enrichMaxElapsedMs ?? 240_000,
    });
    }
  }

  let sendByCampaign: Record<string, OutreachRunStats> | undefined;
  let agentCoverSend: OutreachRunStats | undefined;
  const sendAllowed = await isOutreachSendAllowed();
  const send =
    opts?.skipSend || !outreachSendEnabled() || !sendAllowed
      ? emptyOutreachRunStats()
      : await (async () => {
          const locked = await claimOutreachRunLock('send');
          if (!locked) {
            const skipped = emptyOutreachRunStats();
            skipped.skippedReason = 'overlap';
            return skipped;
          }
          // Send both RepUK WhatsApp invites and PSA agent-cover Kent emails.
          const multi = await runFirmOutreachAllCampaigns({
            limit: opts?.sendLimit,
            // Leave headroom under Vercel maxDuration=300s for both campaigns.
            maxElapsedMs: 280_000,
          });
          sendByCampaign = multi.byCampaign;
          agentCoverSend = multi.byCampaign[AGENT_COVER_KENT_CAMPAIGN_ID];
          return multi.combined;
        })();

  const counts = opts?.skipCounts ? {} : await countProspectsByStatus();

  if (!opts?.skipSend && !opts?.skipCounts) {
    const sendHealth = await getOutreachSendHealth();
    const psaHealth = sendHealth.campaigns.find(
      (c) => c.campaignId === AGENT_COVER_KENT_CAMPAIGN_ID,
    );
    const psaNote = psaHealth?.usedFallbackDefault
      ? ' PSA agent-cover is sending from the verified RepUK domain until policestationagent.com is verified on Resend.'
      : '';
    if (!sendHealth.sendHealthy) {
      await maybeNotifyOutreachSendFailure({
        stats: send,
        readyToSend: counts.ready_to_send ?? 0,
        reason: `Outreach send config unhealthy: ${sendHealth.sendBlockers.join('; ')}.${psaNote}`,
      });
    } else {
      await maybeNotifyOutreachSendFailure({
        stats: send,
        readyToSend: counts.ready_to_send ?? 0,
      });
    }
  }

  // Routine post-pipeline digests removed (Phase 9/20).
  // Exactly one consolidated admin email: /api/cron/firm-outreach-daily-report.
  void opts?.skipDigest;

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
    sendByCampaign,
    agentCoverSend,
    counts,
    elapsedMs: Date.now() - started,
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

