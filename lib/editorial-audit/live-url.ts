import { proposedFixForCode } from './fixes';
import { getAuditConfig } from './config';
import type { AuditFinding } from './types';

function toFinding(
  unitId: string,
  url: string,
  severity: AuditFinding['severity'],
  code: string,
  reason: string,
): AuditFinding {
  return {
    fingerprint: `${unitId}:${code}`,
    unitId,
    url,
    sectionTitle: '(live URL)',
    sourceFile: '(live-url)',
    severity,
    code,
    reason,
    proposedFix: proposedFixForCode(code),
  };
}

/** Fetch the public URL and flag 4xx/5xx or missing title. */
export async function fetchLiveUrlFindings(
  urlPath: string,
  opts?: { unitId?: string; siteUrl?: string; userAgent?: string },
): Promise<AuditFinding[]> {
  const cfg = getAuditConfig();
  const siteUrl = (opts?.siteUrl ?? cfg.siteUrl).replace(/\/$/, '');
  const path = urlPath.startsWith('/') ? urlPath : `/${urlPath}`;
  const full = `${siteUrl}${path}`;
  const unitId = opts?.unitId ?? `live:${path}`;

  try {
    const res = await fetch(full, {
      redirect: 'follow',
      headers: {
        'User-Agent': opts?.userAgent ?? 'policestationrepuk-editorial-audit',
      },
    });
    if (res.status >= 400) {
      return [
        toFinding(
          unitId,
          path,
          'PROBLEM',
          'live-url-http-error',
          `HTTP ${res.status} for ${full}`,
        ),
      ];
    }
    const html = await res.text();
    if (!/<title[^>]*>[^<]+<\/title>/i.test(html)) {
      return [
        toFinding(unitId, path, 'REVIEW', 'live-url-missing-title', 'Page missing title tag'),
      ];
    }
  } catch (e) {
    return [
      toFinding(
        unitId,
        path,
        'PROBLEM',
        'live-url-fetch-failed',
        `Fetch failed: ${e instanceof Error ? e.message : String(e)}`,
      ),
    ];
  }
  return [];
}
