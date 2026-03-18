/**
 * Crawl policestationrepuk.com and extract titles, headings, text content, and links.
 * Saves structured JSON files to content/crawl/ for use in static page generation.
 *
 * Run: npx tsx scripts/crawl-site.ts
 *
 * Requires: npm install -D playwright && npx playwright install chromium
 */

import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'https://policestationrepuk.com';
const OUTPUT_DIR = path.join(process.cwd(), 'content', 'crawl');
const DATA_DIR = path.join(process.cwd(), 'data');
const DELAY_MS = 1500; // Be polite between requests

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

async function crawlUrl(
  browser: import('playwright').Browser,
  urlPath: string,
): Promise<CrawlPage> {
  const url = urlPath === '' || urlPath === '/' ? BASE_URL : `${BASE_URL}${urlPath.startsWith('/') ? urlPath : `/${urlPath}`}`;
  const page = await browser.newPage();

  const result: CrawlPage = {
    url,
    path: urlPath === '' ? '/' : urlPath.startsWith('/') ? urlPath : `/${urlPath}`,
    title: '',
    headings: [],
    content: '',
    links: [],
    crawledAt: new Date().toISOString(),
  };

  try {
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 20000,
    });
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

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const { SITEMAP_PATHS } = await import('../lib/sitemap-paths');
  const limit = process.env.CRAWL_LIMIT ? parseInt(process.env.CRAWL_LIMIT, 10) : undefined;
  const pathsToCrawl: string[] = ['/', ...SITEMAP_PATHS].slice(0, limit);

  console.log(`Crawling ${pathsToCrawl.length} pages from ${BASE_URL}...`);
  const browser = await chromium.launch({ headless: true });
  const allPages: CrawlPage[] = [];

  for (let i = 0; i < pathsToCrawl.length; i++) {
    const urlPath = pathsToCrawl[i];
    const slug = pathToFilename(urlPath);
    const displayPath = urlPath || '/';
    process.stdout.write(`[${i + 1}/${pathsToCrawl.length}] ${displayPath} ... `);

    const data = await crawlUrl(browser, urlPath);
    allPages.push(data);
    const outPath = path.join(OUTPUT_DIR, `${slug}.json`);
    fs.writeFileSync(outPath, JSON.stringify(data, null, 2), 'utf-8');

    if (data.error) {
      console.log('ERROR:', data.error);
    } else {
      console.log('OK', `(title: ${data.title.slice(0, 50)}..., ${data.links.length} links)`);
    }

    if (i < pathsToCrawl.length - 1) {
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }
  }

  await browser.close();

  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(DATA_DIR, 'pages.json'),
    JSON.stringify({ baseUrl: BASE_URL, crawledAt: new Date().toISOString(), count: allPages.length, pages: allPages }, null, 2),
    'utf-8',
  );
  console.log(`\nAggregated ${allPages.length} pages → ${path.join(DATA_DIR, 'pages.json')}`);

  const manifest = {
    baseUrl: BASE_URL,
    crawledAt: new Date().toISOString(),
    count: pathsToCrawl.length,
    pages: pathsToCrawl.map((p) => ({
      path: !p || p === '/' ? '/' : p.startsWith('/') ? p : `/${p}`,
      file: `${pathToFilename(p)}.json`,
    })),
  };
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'manifest.json'),
    JSON.stringify(manifest, null, 2),
    'utf-8',
  );
  console.log(`\nDone. Output written to ${OUTPUT_DIR}`);
  console.log(`Manifest: ${path.join(OUTPUT_DIR, 'manifest.json')}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
