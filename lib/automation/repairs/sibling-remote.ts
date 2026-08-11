import type { CrossSiteBufferTarget } from '@/lib/buffer/cross-site-sites';
import { logAutomationEvent } from '../observability';

export interface SiblingRemoteRepairResult {
  attempted: boolean;
  verified: boolean;
  status: number;
  summary: string;
  dryRun: boolean;
  /** True when /api/buffer/schedule is missing on the sibling (404). */
  endpointMissing?: boolean;
}

async function parseOkFlag(body: string): Promise<boolean | undefined> {
  try {
    const json = JSON.parse(body) as { ok?: boolean };
    return json.ok;
  } catch {
    return undefined;
  }
}

/**
 * Unauthenticated probe: sibling Buffer routes return 401/403 when present,
 * 404 when the site never deployed the scheduler.
 */
export async function probeSiblingBufferScheduleEndpoint(
  site: CrossSiteBufferTarget,
  fetchFn: typeof fetch = fetch,
): Promise<{ exists: boolean; status: number }> {
  const url = `${site.productionUrl.replace(/\/$/, '')}/api/buffer/schedule`;
  try {
    const res = await fetchFn(url, { method: 'GET', signal: AbortSignal.timeout(20_000) });
    // Auth-gated routes exist even when unauthorized.
    if (res.status === 401 || res.status === 403) return { exists: true, status: res.status };
    if (res.status === 404) return { exists: false, status: 404 };
    // 200 without auth is unexpected but means the route exists.
    return { exists: res.status < 500, status: res.status };
  } catch {
    return { exists: false, status: 0 };
  }
}

async function callSiblingBufferPath(
  site: CrossSiteBufferTarget,
  path: string,
  secret: string,
  fetchFn: typeof fetch,
): Promise<{ status: number; body: string; okFlag: boolean | undefined }> {
  const url = `${site.productionUrl.replace(/\/$/, '')}${path}`;
  const res = await fetchFn(url, {
    headers: { Authorization: `Bearer ${secret}` },
    signal: AbortSignal.timeout(120_000),
  });
  const body = await res.text();
  const okFlag = await parseOkFlag(body);
  return { status: res.status, body, okFlag };
}

/**
 * Trigger a sibling site's own `/api/buffer/schedule` (+ verify when present)
 * so it can fill remaining day/night slots. Uses shared `CRON_SECRET`.
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
  const fetchFn = options?.fetchFn ?? fetch;
  const secret = process.env.CRON_SECRET?.trim();

  const scheduleParams = new URLSearchParams();
  if (force) scheduleParams.set('force', '1');
  const schedulePath = `/api/buffer/schedule?${scheduleParams}`;
  const verifyPath = '/api/buffer/verify';

  if (dryRun) {
    const probe = await probeSiblingBufferScheduleEndpoint(site, fetchFn);
    if (!probe.exists) {
      return {
        attempted: false,
        verified: false,
        status: probe.status,
        summary: `${site.hostname}: Buffer schedule endpoint missing (${probe.status || 'unreachable'}) — needs REPUK fallback or sibling deploy`,
        dryRun: true,
        endpointMissing: true,
      };
    }
    return {
      attempted: false,
      verified: false,
      status: 0,
      summary: `${site.hostname}: would GET ${site.productionUrl.replace(/\/$/, '')}${schedulePath} then ${verifyPath}`,
      dryRun: true,
      endpointMissing: false,
    };
  }

  if (!secret) {
    return {
      attempted: false,
      verified: false,
      status: 0,
      summary: `${site.hostname}: remote repair skipped (CRON_SECRET missing)`,
      dryRun,
    };
  }

  try {
    const schedule = await callSiblingBufferPath(site, schedulePath, secret, fetchFn);
    if (schedule.status === 404) {
      logAutomationEvent('crosssite.sibling.remote_schedule', {
        siteId: site.id,
        status: 404,
        verified: false,
        endpointMissing: true,
      });
      return {
        attempted: true,
        verified: false,
        status: 404,
        summary: `${site.hostname}: /api/buffer/schedule missing (404) — sibling self-scheduler not deployed`,
        dryRun: false,
        endpointMissing: true,
      };
    }

    let verified = schedule.status >= 200 && schedule.status < 300 && schedule.okFlag === true;
    let summary = verified
      ? `${site.hostname}: remote schedule OK (${schedule.status})`
      : `${site.hostname}: remote schedule failed (${schedule.status}) ${schedule.body.slice(0, 160)}`;

    // Gap-fill path when the sibling exposes /api/buffer/verify.
    if (!verified || force) {
      try {
        const verify = await callSiblingBufferPath(site, verifyPath, secret, fetchFn);
        if (verify.status !== 404) {
          const verifyOk =
            verify.status >= 200 && verify.status < 300 && verify.okFlag === true;
          if (verifyOk) {
            verified = true;
            summary = `${site.hostname}: remote verify OK (${verify.status}) after schedule ${schedule.status}`;
          } else if (!verified) {
            summary = `${site.hostname}: schedule ${schedule.status}, verify ${verify.status} ${verify.body.slice(0, 120)}`;
          }
        }
      } catch {
        // verify is best-effort; schedule result stands
      }
    }

    logAutomationEvent('crosssite.sibling.remote_schedule', {
      siteId: site.id,
      status: schedule.status,
      verified,
    });

    return {
      attempted: true,
      verified,
      status: schedule.status,
      summary,
      dryRun: false,
      endpointMissing: false,
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
