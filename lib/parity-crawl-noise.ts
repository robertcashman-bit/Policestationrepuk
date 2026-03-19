/**
 * Shared crawl artefact detection for route + visual parity tools.
 * Keep in sync with docs/live-site-map.json expectations.
 */

export function normalizeUrlPath(p: string): string {
  const t = p.trim();
  if (!t || t === '/') return '/';
  return t.replace(/\/+$/, '') || '/';
}

/** Paths that are not real internal routes (href junk from historical crawls). */
export function isCrawlNoise(p: string): boolean {
  const n = normalizeUrlPath(p);
  const lower = n.toLowerCase();
  if (lower === '/n/a' || lower === '/n%2fa') return true;
  if (lower.includes('not%20available')) return true;
  if (/^\/www\./i.test(lower)) return true;
  if (lower.includes('.co.uk')) return true;
  if (/^\/[^/]+\.com$/i.test(n)) return true;
  return false;
}

/** In-scope paths from live-site-map urls[].path */
export function filterInScopePaths(paths: string[]): string[] {
  return paths
    .map((p) => normalizeUrlPath(p))
    .filter((p) => p !== '/N/A' && p.toLowerCase() !== '/n/a' && !isCrawlNoise(p));
}
