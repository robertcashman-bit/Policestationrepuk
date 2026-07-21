/**
 * Safe external fetch for station research.
 * Blocks private networks, localhost, cloud metadata, and non-allowlisted hosts.
 */

const FETCH_TIMEOUT_MS = 12_000;
const MAX_BYTES = 1_500_000;

const BLOCKED_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  'metadata.google.internal',
  '169.254.169.254',
]);

const ALLOWED_SUFFIXES = [
  '.police.uk',
  '.gov.uk',
  '.nhs.uk',
  '.mod.uk',
  'police.uk',
  'data.police.uk',
];

function isPrivateIpv4(host: string): boolean {
  const m = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/.exec(host);
  if (!m) return false;
  const a = Number(m[1]);
  const b = Number(m[2]);
  if (a === 10 || a === 127 || a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
}

export function isAllowedResearchUrl(url: string): { ok: true; url: URL } | { ok: false; reason: string } {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, reason: 'invalid_url' };
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, reason: 'unsupported_protocol' };
  }
  const host = parsed.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (BLOCKED_HOSTS.has(host) || isPrivateIpv4(host) || host.endsWith('.local')) {
    return { ok: false, reason: 'blocked_host' };
  }
  const allowed = ALLOWED_SUFFIXES.some(
    (suffix) => host === suffix || host.endsWith(suffix) || (suffix.startsWith('.') && host.endsWith(suffix)),
  );
  // Also allow police.uk without leading dot check already covered
  if (!allowed && !host.endsWith('.police.uk') && host !== 'police.uk' && host !== 'data.police.uk') {
    // Tier-1 only for automated page fetch. Discovery snippets may still reference other hosts.
    return { ok: false, reason: 'domain_not_allowlisted' };
  }
  return { ok: true, url: parsed };
}

export function htmlToPlainText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function safeFetchText(
  url: string,
): Promise<{ ok: true; text: string; finalUrl: string; contentType: string } | { ok: false; reason: string }> {
  const check = isAllowedResearchUrl(url);
  if (!check.ok) return check;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(check.url.toString(), {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'PoliceStationRepUK-StationResearch/1.0 (+https://policestationrepuk.org)',
        Accept: 'text/html,application/xhtml+xml,application/json,text/plain',
      },
    });
    if (!res.ok) return { ok: false, reason: `http_${res.status}` };
    if (res.url) {
      const redirected = isAllowedResearchUrl(res.url);
      if (!redirected.ok) return { ok: false, reason: `redirect_${redirected.reason}` };
    }
    const contentType = res.headers.get('content-type') ?? '';
    if (contentType.includes('pdf')) {
      return { ok: false, reason: 'pdf_not_fetched_in_v1' };
    }
    const buf = await res.arrayBuffer();
    if (buf.byteLength > MAX_BYTES) return { ok: false, reason: 'response_too_large' };
    const raw = new TextDecoder('utf-8').decode(buf);
    const text = contentType.includes('html') ? htmlToPlainText(raw) : raw;
    return { ok: true, text, finalUrl: res.url || check.url.toString(), contentType };
  } catch {
    return { ok: false, reason: 'fetch_failed' };
  } finally {
    clearTimeout(timer);
  }
}
