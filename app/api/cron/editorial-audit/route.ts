import { NextResponse } from 'next/server';
import { isCronAuthorized } from '@/lib/cron-auth';
import { runEditorialAudit } from '@/lib/editorial-audit/scheduler';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 120;

/**
 * Rotating editorial content audit (weekdays 07:00 Europe/London via vercel.json `0 6 * * 1-5`).
 * Multi-source: regex rules, PACE sourcing, LAA fee vs lib/laa-rates, content-sources map,
 * live URL fetch, and GPT (gpt-4o-mini) only when rules/sources flag and OPENAI_API_KEY is set.
 * Findings-only email (no all-clear). Suggested fixes are digest metadata only — no auto-edit / auto-PR.
 * Auth: Bearer ${CRON_SECRET} or x-cron-secret header.
 */
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const limitParam = url.searchParams.get('limit');
  const limit = limitParam ? Number(limitParam) : undefined;
  const skipLiveUrl = url.searchParams.get('skipLiveUrl') === '1';
  const skipLlm = url.searchParams.get('skipLlm') === '1';

  const result = await runEditorialAudit({ limit, skipLiveUrl, skipLlm });

  return NextResponse.json({
    ok: true,
    totalUnits: result.totalUnits,
    batchStartIndex: result.batchStartIndex,
    nextCursor: result.nextCursor,
    scannedCount: result.scannedUnitIds.length,
    findingCount: result.findings.length,
    llmCalls: result.llmCalls,
    liveUrlsChecked: result.liveUrlsChecked,
    suggestedFixCount: result.suggestedFixCount,
    notification: result.notification,
    scannedUnitIds: result.scannedUnitIds,
    findings: result.findings.map((f) => ({
      fingerprint: f.fingerprint,
      url: f.url,
      sectionTitle: f.sectionTitle,
      severity: f.severity,
      code: f.code,
    })),
  });
}
