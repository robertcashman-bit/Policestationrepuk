import type { CrossSiteBufferTarget } from '@/lib/buffer/cross-site-sites';
import { logAutomationEvent } from '../observability';

export interface SiblingRemoteRepairResult {
  attempted: boolean;
  verified: boolean;
  status: number;
  summary: string;
  dryRun: boolean;
}

/**
 * Trigger a sibling site's own `/api/buffer/schedule` so it can fill remaining
 * day/night slots. Uses shared `CRON_SECRET` (same Buffer workspace ops model).
 *
 * Yesterday's already-missed sent window cannot be backfilled; this heals *today*
 * so the next cross-site report does not repeat the deficit.
 */
export async function triggerSiblingBufferSchedule(
  site: CrossSiteBufferTarget,
  options?: { dryRun?: boolean; force?: boolean; fetchFn?: typeof fetch },
): Promise<SiblingRemoteRepairResult> {
  const dryRun = Boolean(options?.dryRun);
  const force = options?.force !== false;
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return {
      attempted: false,
      verified: false,
      status: 0,
      summary: `${site.hostname}: remote repair skipped (CRON_SECRET missing)`,
      dryRun,
    };
  }

  const params = new URLSearchParams();
  if (force) params.set('force', '1');
  const url = `${site.productionUrl.replace(/\/$/, '')}/api/buffer/schedule?${params}`;

  if (dryRun) {
    return {
      attempted: false,
      verified: false,
      status: 0,
      summary: `${site.hostname}: would GET ${url}`,
      dryRun: true,
    };
  }

  const fetchFn = options?.fetchFn ?? fetch;
  try {
    const res = await fetchFn(url, {
      headers: { Authorization: `Bearer ${secret}` },
      signal: AbortSignal.timeout(120_000),
    });
    const body = await res.text();
    let okFlag: boolean | undefined;
    try {
      const json = JSON.parse(body) as { ok?: boolean };
      okFlag = json.ok;
    } catch {
      okFlag = undefined;
    }
    const verified = res.ok && okFlag !== false;
    logAutomationEvent('crosssite.sibling.remote_schedule', {
      siteId: site.id,
      status: res.status,
      verified,
    });
    return {
      attempted: true,
      verified,
      status: res.status,
      summary: verified
        ? `${site.hostname}: remote schedule OK (${res.status})`
        : `${site.hostname}: remote schedule failed (${res.status}) ${body.slice(0, 180)}`,
      dryRun: false,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logAutomationEvent('crosssite.sibling.remote_schedule', {
      siteId: site.id,
      error: message,
    });
    return {
      attempted: true,
      verified: false,
      status: 0,
      summary: `${site.hostname}: remote schedule error: ${message}`,
      dryRun: false,
    };
  }
}
