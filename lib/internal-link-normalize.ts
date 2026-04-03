import { getCountySlugSet } from '@/lib/county-slugs';

const DIRECTORY_STATIC_SEGMENTS = new Set(['counties']);

/**
 * County directory lives at /directory/{countySlug}. Mirrored/crawled nav often links
 * /directory/{police-force-style-slug}, which 404s. Send those to /Forces instead.
 */
export function normalizeDirectoryNavPath(pathWithSearch: string): string {
  if (!pathWithSearch.startsWith('/')) return pathWithSearch;
  const qIdx = pathWithSearch.indexOf('?');
  const pathname = qIdx === -1 ? pathWithSearch : pathWithSearch.slice(0, qIdx);
  const search = qIdx === -1 ? '' : pathWithSearch.slice(qIdx);

  const m = pathname.match(/^\/directory\/([^/]+)\/?$/i);
  if (!m) return pathWithSearch;

  let seg: string;
  try {
    seg = decodeURIComponent(m[1]).toLowerCase();
  } catch {
    return `/Forces${search}`;
  }

  if (DIRECTORY_STATIC_SEGMENTS.has(seg)) return pathWithSearch;

  const counties = getCountySlugSet();
  if (counties.has(seg)) return pathWithSearch;

  return `/Forces${search}`;
}

/** Normalize hrefs from mirror data (relative or absolute on this site). */
export function normalizeMirrorNavHref(href: string): string {
  if (!href || href.startsWith('mailto:') || href.startsWith('tel:')) return href;
  try {
    if (/^https?:\/\//i.test(href)) {
      const u = new URL(href);
      if (!/policestationrepuk\.(org|com)/i.test(u.hostname)) return href;
      return normalizeDirectoryNavPath(u.pathname + (u.search || ''));
    }
  } catch {
    return href;
  }
  const path = href.startsWith('/') ? href : `/${href}`;
  const noHash = path.split('#')[0];
  return normalizeDirectoryNavPath(noHash);
}
