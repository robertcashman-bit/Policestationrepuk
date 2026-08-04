import { NextResponse } from 'next/server';
import { isCronAuthorized } from '@/lib/cron-auth';
import { AGENT_COVER_KENT_CAMPAIGN_ID } from '@/lib/firm-outreach/campaign-scope';
import { selectOutreachCandidates } from '@/lib/firm-outreach/outreach/candidate-selection';
import { reviveAgentCoverKentReady } from '@/lib/firm-outreach/revive-agent-cover-ready';
import { syncKentProspectsToAgentCover } from '@/lib/firm-outreach/sync-kent-to-agent-cover';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Lightweight Kent→PSA inventory sync + revive stuck send_failed / soft exclusions.
 * Runs before send crons so agent_cover_kent_v1 is not starved when maintain 504s.
 */
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const limitRaw = Number(url.searchParams.get('limit') || 200);
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(500, limitRaw) : 200;

  const sync = await syncKentProspectsToAgentCover({
    limit,
    maxElapsedMs: 25_000,
  });
  const revive = await reviveAgentCoverKentReady({
    limit: Math.min(80, limit),
    maxElapsedMs: 25_000,
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
