import { NextResponse } from 'next/server';
import { isOutreachBootstrapAuthorized } from '@/lib/cron-auth';
import { isAgentCoverOutreachDisabled } from '@/lib/firm-outreach/site-config';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;

/**
 * Formerly: Kent→PSA inventory sync + revive.
 * Police Station Agent firm outreach is permanently disabled — this cron is a no-op.
 * RepUK WhatsApp outreach continues via firm-outreach-send / pipeline.
 */
export async function GET(request: Request) {
  if (!isOutreachBootstrapAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (isAgentCoverOutreachDisabled()) {
    return NextResponse.json({
      ok: true,
      mode: 'psa-sync',
      disabled: true,
      reason: 'agent_cover_outreach_permanently_disabled',
      sync: null,
      revive: null,
      psa: {
        readyScanned: 0,
        readyEligible: 0,
        sendableCandidates: 0,
      },
    });
  }

  // Unreachable while AGENT_COVER_OUTREACH_PERMANENTLY_DISABLED is true.
  // Kept for clarity if the permanent flag is ever reviewed in a dedicated change.
  const { AGENT_COVER_KENT_CAMPAIGN_ID } = await import('@/lib/firm-outreach/campaign-scope');
  const { selectOutreachCandidates } = await import(
    '@/lib/firm-outreach/outreach/candidate-selection'
  );
  const { reviveAgentCoverKentReady } = await import(
    '@/lib/firm-outreach/revive-agent-cover-ready'
  );
  const { syncKentProspectsToAgentCover } = await import(
    '@/lib/firm-outreach/sync-kent-to-agent-cover'
  );

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
