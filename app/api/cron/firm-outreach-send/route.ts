import { NextResponse } from 'next/server';
import { validateOutreachEnv } from '@robertcashman/firm-outreach-core';
import { isOutreachBootstrapAuthorized } from '@/lib/cron-auth';
import { cronSendBatchSize, outreachRequireApproval } from '@/lib/firm-outreach/constants';
import { forceClearOutreachRunLock } from '@/lib/firm-outreach/run-lock';
import { runFirmOutreachPipeline } from '@/lib/firm-outreach/run-pipeline';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;

/** Send-only cron tick (no enrich, no owner digest). */
export async function GET(request: Request) {
  if (!isOutreachBootstrapAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Click-to-send mode: only the approval Confirm path may send firm emails.
  if (outreachRequireApproval()) {
    return NextResponse.json({
      ok: true,
      mode: 'approval-required',
      skipped: true,
      reason: 'FIRM_OUTREACH_REQUIRE_APPROVAL=true — use Ready to send approval link',
    });
  }

  const envCheck = validateOutreachEnv({ requireCronSecret: false });
  if (!envCheck.ok) {
    return NextResponse.json(
      { ok: false, error: 'outreach_env_invalid', errors: envCheck.errors, warnings: envCheck.warnings },
      { status: 500 },
    );
  }

  const url = new URL(request.url);
  const paramLimit = Number(url.searchParams.get('limit') || 0);
  const sendLimit = paramLimit > 0 ? paramLimit : cronSendBatchSize();
  // Kick / ops only: clear a *stale* send lock. Fresh locks are never stolen.
  let forceClearedLock = false;
  if (url.searchParams.get('force') === '1') {
    forceClearedLock = await forceClearOutreachRunLock('send');
  }
  const result = await runFirmOutreachPipeline({
    skipDiscovery: true,
    skipEnrich: true,
    skipDigest: true,
    skipCleanup: true,
    skipCounts: true,
    sendLimit,
  });

  return NextResponse.json({
    ok: true,
    mode: 'send-only',
    warnings: envCheck.warnings,
    forceClearedLock,
    ...result,
  });
}
