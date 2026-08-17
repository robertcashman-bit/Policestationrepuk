import { NextResponse } from 'next/server';
import { isOutreachBootstrapAuthorized } from '@/lib/cron-auth';
import { AGENT_COVER_KENT_CAMPAIGN_ID } from '@/lib/firm-outreach/campaign-scope';
import { selectOutreachCandidates } from '@/lib/firm-outreach/outreach/candidate-selection';
import {
  isPsaFirmOutreachEnabled,
  PSA_FIRM_OUTREACH_DISABLED_REASON,
} from '@/lib/firm-outreach/psa-outreach-enabled';
import { reviveAgentCoverKentReady } from '@/lib/firm-outreach/revive-agent-cover-ready';
import { syncKentProspectsToAgentCover } from '@/lib/firm-outreach/sync-kent-to-agent-cover';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;

/**
 * Kent→PSA inventory sync + revive stuck send_failed / soft exclusions.
 * No-ops while PSA firm outreach is permanently disabled.
 */
export async function GET(request: Request) {
  if (!isOutreachBootstrapAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isPsaFirmOutreachEnabled()) {
    return NextResponse.json({
      ok: true,
      mode: 'psa-sync',
      skipped: true,
      reason: PSA_FIRM_OUTREACH_DISABLED_REASON,
      sync: null,
      revive: null,
      psa: { readyScanned: 0, readyEligible: 0, sendableCandidates: 0 },
    });
  }

  const url = new URL(request.url);
  const limitRaw = Number(url.searchParams.get('limit') || 400);
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(800, limitRaw) : 400;

  const sync = await syncKentProspectsToAgentCover({
    limit,
    maxElapsedMs: 180_000,
  });
  const revive = await reviveAgentCoverKentReady({
    limit: Math.min(120, limit),
    maxElapsedMs: 60_000,
  });

  const selection = await selectOutreachCandidates({
    campaignId: AGENT_COVER_KENT_CAMPAIGN_ID,
    readyLimit: 500,
    sentLimit: 50,
  });

  return NextResponse.json({
    ok: true,
    mode: 'psa-sync',
    sync,
    revive,
    psa: {
      readyScanned: selection.readyScanned,
      readyEligible: selection.readyEligible,
      sendableCandidates: selection.candidates.length,
    },
  });
}
