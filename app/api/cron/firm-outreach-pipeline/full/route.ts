import { NextResponse } from 'next/server';
import { isOutreachBootstrapAuthorized } from '@/lib/cron-auth';
import { FIRM_OUTREACH_EMAIL_DISABLED_REASON } from '@/lib/firm-outreach/site-config';
import { runFirmOutreachPipeline } from '@/lib/firm-outreach/run-pipeline';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;

/**
 * Morning pipeline full cron — inventory only. Never sends firm email or
 * operator approval mail while firm outreach email is permanently disabled.
 */
export async function GET(request: Request) {
  if (!isOutreachBootstrapAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await runFirmOutreachPipeline({
    skipDiscovery: true,
    skipEnrich: true,
    skipCleanup: true,
    skipSend: true,
    skipDigest: true,
    skipCounts: true,
  });

  return NextResponse.json({
    ok: true,
    mode: 'inventory_only_send_disabled',
    reason: FIRM_OUTREACH_EMAIL_DISABLED_REASON,
    ...result,
  });
}
