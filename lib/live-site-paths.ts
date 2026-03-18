/**
 * Paths from docs/live-site-map.json for static generation and route parity.
 * Ensures every discovered URL has a corresponding route.
 */

import fs from 'fs';
import path from 'path';

const LIVE_SITE_MAP_PATH = path.join(process.cwd(), 'docs', 'live-site-map.json');

export interface LiveSiteMap {
  urls?: { path: string }[];
}

let _cache: { single: string[]; multi: string[]; allPaths: string[] } | null = null;

function load(): { single: string[]; multi: string[]; allPaths: string[] } {
  if (_cache) return _cache;
  if (!fs.existsSync(LIVE_SITE_MAP_PATH)) {
    _cache = { single: [], multi: [], allPaths: [] };
    return _cache;
  }
  try {
    const data = JSON.parse(fs.readFileSync(LIVE_SITE_MAP_PATH, 'utf-8')) as LiveSiteMap;
    const paths = (data.urls ?? []).map((u) => (u.path === '/' ? '/' : u.path.startsWith('/') ? u.path : `/${u.path}`));
    const withoutLeading = paths.map((p) => (p === '/' ? '' : p.replace(/^\//, '')));
    const single = withoutLeading.filter((s) => s && !s.includes('/'));
    const multi = withoutLeading.filter((s) => s && s.includes('/'));
    _cache = { single, multi, allPaths: withoutLeading };
    return _cache;
  } catch {
    _cache = { single: [], multi: [], allPaths: [] };
    return _cache;
  }
}

/** Single-segment paths (e.g. About, Contact) for app/[slug] */
export function getLiveSiteSingleSegmentPaths(): string[] {
  return load().single;
}

/** Multi-segment paths (e.g. Blog/foo) for app/[...slug] — as full path string with slash */
export function getLiveSiteMultiSegmentPaths(): string[] {
  return load().multi;
}

/** All path strings without leading slash ('' for home) */
export function getLiveSiteAllPaths(): string[] {
  return load().allPaths;
}
