/**
 * Read crawled page content from content/crawl/ for use in static page generation.
 * Run `npm run crawl` first to populate the crawl output.
 */

import fs from 'fs';
import path from 'path';
import type { CrawlPage, CrawlManifest } from './crawl-types';

const CRAWL_DIR = path.join(process.cwd(), 'content', 'crawl');

function pathToFilename(urlPath: string): string {
  if (!urlPath || urlPath === '/') return 'index';
  return urlPath.replace(/^\//, '').replace(/\//g, '-') || 'index';
}

/**
 * Load a single crawled page by path (e.g. '/' or '/About').
 * Returns null if the file does not exist or crawl has not been run.
 */
export function getCrawlPage(pathSlug: string): CrawlPage | null {
  const file = path.join(CRAWL_DIR, `${pathToFilename(pathSlug)}.json`);
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8')) as CrawlPage;
  } catch {
    return null;
  }
}

/**
 * Load the crawl manifest (list of all crawled pages).
 */
export function getCrawlManifest(): CrawlManifest | null {
  const file = path.join(CRAWL_DIR, 'manifest.json');
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8')) as CrawlManifest;
  } catch {
    return null;
  }
}

/**
 * Check if crawl data is available (e.g. to decide whether to use crawled content in [slug] page).
 */
export function hasCrawlData(): boolean {
  return fs.existsSync(path.join(CRAWL_DIR, 'manifest.json'));
}
