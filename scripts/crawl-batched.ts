/**
 * Crawl the live site in batches of 25 pages per cycle using the crawl map.
 * Ensures all pages are imported without stopping early.
 *
 * Run: npm run crawl:batched
 * Or:   npx tsx scripts/crawl-batched.ts
 *
 * Env:
 *   CRAWL_BATCH_SIZE=25   — pages per batch (default 25)
 *   CRAWL_START_AT=0      — start at this index in the crawl map
 *   CRAWL_SKIP_EXISTING=1 — skip paths already in data/pages.json (default)
 *   CRAWL_SKIP_EXISTING=0 — re-crawl all paths from START_AT
 *
 * Reads: docs/crawl-map.json or docs/live-site-map.json (urls[].path)
 * Writes: data/pages.json (merged after each batch), content/crawl/*.json
 *
 * Requires: playwright (npx playwright install chromium)
 */

import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'https://www.policestationrepuk.com';
const CRAWL_MAP_PATH = path.join(process.cwd(), 'docs', 'crawl-map.json');
const LIVE_SITE_MAP_PATH = path.join(process.cwd(), 'docs', 'live-site-map.json');
const PAGES_JSON_PATH = path.join(process.cwd(), 'data', 'pages.json');
const OUTPUT_DIR = path.join(process.cwd(), 'content', 'crawl');
const DATA_DIR = path.join(process.cwd(), 'data');
const BATCH_SIZE = parseInt(process.env.CRAWL_BATCH_SIZE || '25', 10);
const START_AT = parseInt(process.env.CRAWL_START_AT || '0', 10);
const DELAY_MS = 1500;

export interface CrawlPage {
  url: string;
  path: string;
  title: string;
  headings: { level: number; text: string }[];
  content: string;
  links: { href: string; text: string }[];
  crawledAt: string;
  error?: string;
}

function pathToFilename(urlPath: string): string {
  if (!urlPath || urlPath === '/') return 'index';
  return urlPath.replace(/^\//, '').replace(/\//g, '-') || 'index';
}

const EXTRACT_SCRIPT = `
(function() {
  function getText(el) {
    return el.textContent ? el.textContent.trim() : '';
  }
  var headings = [];
  document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(function(el) {
    var tag = el.tagName.toLowerCase();
    var level = parseInt(tag.charAt(1), 10);
    var text = getText(el);
    if (text) headings.push({ level: level, text: text });
  });
  var main = document.querySelector('main, [role="main"], article, .content, #content, .main') || document.body;
  var raw = main.textContent ? main.textContent.trim() : '';
  var content = raw.replace(/\\s+/g, ' ').slice(0, 100000);
  var links = [];
  var base = window.location.origin;
  document.querySelectorAll('a[href]').forEach(function(a) {
    var href = a.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
    var absolute;
    try {
      absolute = href.startsWith('http') ? href : new URL(href, base).href;
    } catch (e) {
      return;
    }
    if (!absolute.startsWith(base)) return;
    var pathname = new URL(absolute).pathname || '/';
    links.push({ href: pathname, text: getText(a) });
  });
  var seen = {};
  var uniqueLinks = links.filter(function(l) {
    if (seen[l.href]) return false;
    seen[l.href] = true;
    return true;
  });
  return { title: document.title, headings: headings, content: content, links: uniqueLinks };
})()
`;

async function extractPageContent(page: import('playwright').Page): Promise<Omit<CrawlPage, 'url' | 'path' | 'crawledAt' | 'error'>> {
  return page.evaluate(EXTRACT_SCRIPT);
}

async function crawlUrl(browser: import('playwright').Browser, urlPath: string): Promise<CrawlPage> {
  const pathNorm = urlPath === '' || urlPath === '/' ? '/' : urlPath.startsWith('/') ? urlPath : `/${urlPath}`;
  const url = pathNorm === '/' ? BASE_URL : `${BASE_URL}${pathNorm}`;
  const page = await browser.newPage();

  const result: CrawlPage = {
    url,
    path: pathNorm,
    title: '',
    headings: [],
    content: '',
    links: [],
    crawledAt: new Date().toISOString(),
  };

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(2000);
    const extracted = await extractPageContent(page);
    result.title = extracted.title;
    result.headings = extracted.headings;
    result.content = extracted.content;
    result.links = extracted.links;
  } catch (err) {
    result.error = err instanceof Error ? err.message : String(err);
  } finally {
    await page.close();
  }

  return result;
}

function loadCrawlMapPaths(): string[] {
  for (const p of [CRAWL_MAP_PATH, LIVE_SITE_MAP_PATH]) {
    if (fs.existsSync(p)) {
      const data = JSON.parse(fs.readFileSync(p, 'utf-8'));
      const urls = data.urls || [];
      return urls.map((u: { path: string }) => (u.path === '/' ? '/' : u.path.startsWith('/') ? u.path : `/${u.path}`));
    }
  }
  throw new Error('No crawl map found at docs/crawl-map.json or docs/live-site-map.json');
}

function loadExistingPages(): CrawlPage[] {
  if (!fs.existsSync(PAGES_JSON_PATH)) return [];
  try {
    const data = JSON.parse(fs.readFileSync(PAGES_JSON_PATH, 'utf-8'));
    return Array.isArray(data.pages) ? data.pages : [];
  } catch {
    return [];
  }
}

function mergePages(existing: CrawlPage[], batch: CrawlPage[]): CrawlPage[] {
  const byPath = new Map<string, CrawlPage>();
  for (const p of existing) byPath.set(p.path, p);
  for (const p of batch) byPath.set(p.path, p);
  return Array.from(byPath.values());
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.mkdirSync(DATA_DIR, { recursive: true });

  const allPaths = loadCrawlMapPaths();
  let existingPages = loadExistingPages();
  const existingPaths = new Set(existingPages.map((p) => p.path));

  // Paths not yet in pages.json (or all from START_AT if CRAWL_SKIP_EXISTING=0)
  const skipExisting = process.env.CRAWL_SKIP_EXISTING !== '0';
  const pathsToCrawl = allPaths.filter((p, i) => {
    if (i < START_AT) return false;
    if (skipExisting && existingPaths.has(p)) return false;
    return true;
  });
  const totalBatches = Math.ceil(pathsToCrawl.length / BATCH_SIZE);

  console.log(`Crawl map: ${allPaths.length} URLs. Existing in data/pages.json: ${existingPages.length}.`);
  console.log(`Paths to crawl: ${pathsToCrawl.length} (skip existing: ${skipExisting}, start index: ${START_AT}).`);
  console.log(`Batches of ${BATCH_SIZE}: ${totalBatches} batches.\n`);

  if (pathsToCrawl.length === 0) {
    console.log('Nothing to crawl. Exiting.');
    process.exit(0);
  }

  const browser = await chromium.launch({ headless: true });

  for (let b = 0; b < totalBatches; b++) {
    const start = b * BATCH_SIZE;
    const batchPaths = pathsToCrawl.slice(start, start + BATCH_SIZE);
    const batchNum = b + 1;

    console.log(`\n--- Batch ${batchNum}/${totalBatches} (paths ${start + 1}-${start + batchPaths.length}) ---`);

    const batchPages: CrawlPage[] = [];
    for (let i = 0; i < batchPaths.length; i++) {
      const urlPath = batchPaths[i];
      const displayPath = urlPath || '/';
      const globalIndex = START_AT + start + i + 1;
      process.stdout.write(`  [${globalIndex}/${START_AT + pathsToCrawl.length}] ${displayPath} ... `);

      const data = await crawlUrl(browser, urlPath);
      batchPages.push(data);

      const slug = pathToFilename(urlPath);
      const outPath = path.join(OUTPUT_DIR, `${slug}.json`);
      fs.writeFileSync(outPath, JSON.stringify(data, null, 2), 'utf-8');

      if (data.error) {
        console.log('ERROR:', data.error);
      } else {
        console.log('OK', `(${data.links.length} links)`);
      }

      if (i < batchPaths.length - 1) {
        await new Promise((r) => setTimeout(r, DELAY_MS));
      }
    }

    existingPages = mergePages(existingPages, batchPages);
    fs.writeFileSync(
      PAGES_JSON_PATH,
      JSON.stringify({
        baseUrl: BASE_URL,
        crawledAt: new Date().toISOString(),
        count: existingPages.length,
        pages: existingPages,
      }),
      'utf-8',
    );
    console.log(`  → Merged. Total pages in data/pages.json: ${existingPages.length}`);
  }

  await browser.close();

  console.log(`\nDone. Total pages: ${existingPages.length} → ${PAGES_JSON_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
