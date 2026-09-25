import { isCrawlNoise } from '@/lib/parity-crawl-noise';

/** Legacy Wix template shells (redirect elsewhere) — never index or sitemap. */
const TEMPLATE_SHELL_SLUGS = new Set([
  'firmprofile',
  'repprofile',
  'wikiarticle',
  'legalupdatedetail',
  'spotlightprofile',
]);

const JUNK_SINGLE_SEGMENT = new Set(['n/a', 'n%2fa', ...TEMPLATE_SHELL_SLUGS]);

function normalizeMirrorSlug(slug: string): string {
  try {
    return decodeURIComponent(slug.replace(/\+/g, ' ')).trim();
  } catch {
    return slug.trim();
  }
}

/** Mirror / [slug] paths that must not be served or listed in sitemap.xml. */
export function isMirrorCatchAllJunkSlug(slug: string): boolean {
  const decoded = normalizeMirrorSlug(slug);
  const lower = decoded.toLowerCase();
  if (JUNK_SINGLE_SEGMENT.has(lower)) return true;
  if (isCrawlNoise(`/${decoded}`)) return true;
  return false;
}

/** `getMirrorPaths()` segment (no leading slash). */
export function shouldOmitPathFromSitemap(path: string): boolean {
  if (!path || path === '/') return true;
  const stripped = path.replace(/^\//, '');
  if (isMirrorCatchAllJunkSlug(stripped)) return true;
  return isMirrorCatchAllJunkPath(stripped);
}

/** Multi-segment mirror path without leading slash (e.g. `N/A`, `blog/foo`). */
export function isMirrorCatchAllJunkPath(pathNorm: string): boolean {
  const lower = normalizeMirrorSlug(pathNorm).toLowerCase();
  if (lower === 'n/a') return true;
  return false;
}
