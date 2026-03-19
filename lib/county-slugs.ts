/**
 * County URL slugs from data/counties.json — used to avoid [slug] mirroring county URLs
 * and to generate short-path rewrites in next.config.
 */

import fs from 'fs';
import path from 'path';

let _set: Set<string> | null = null;

export function getCountySlugSet(): Set<string> {
  if (_set) return _set;
  try {
    const file = path.join(process.cwd(), 'data', 'counties.json');
    const rows = JSON.parse(fs.readFileSync(file, 'utf-8')) as { slug: string }[];
    _set = new Set(rows.map((r) => r.slug));
  } catch {
    _set = new Set();
  }
  return _set;
}

export function getCountySlugs(): string[] {
  return [...getCountySlugSet()];
}
