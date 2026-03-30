/**
 * Fetch production sitemap(s) and verify URLs return 2xx (after redirects).
 * Also verifies all expected blog article URLs are present and reachable.
 *
 * Usage:
 *   node scripts/audit/sitemap-crawl.mjs
 *   CRAWL_BASE_URL=https://staging.example.com CRAWL_MAX_URLS=200 node scripts/audit/sitemap-crawl.mjs
 *
 * CI: set CRAWL_MAX_URLS to cap runtime (0 = no cap).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..');

const DEFAULT_BASE = 'https://policestationrepuk.org';
const BASE = (process.env.CRAWL_BASE_URL || DEFAULT_BASE).replace(/\/$/, '');
const MAX_URLS = parseInt(process.env.CRAWL_MAX_URLS || '0', 10) || 0;
const CONCURRENCY = Math.min(12, parseInt(process.env.CRAWL_CONCURRENCY || '8', 10) || 8);
const TIMEOUT_MS = parseInt(process.env.CRAWL_TIMEOUT_MS || '15000', 10) || 15000;

const EXPECTED_BLOG_SLUGS = [
  'what-does-a-freelance-police-station-representative-do',
  'how-firms-can-instruct-freelance-police-station-reps',
  'police-station-attendance-checklist',
  'what-to-include-in-a-police-station-brief',
  'freelance-police-station-representative-vs-duty-solicitor',
  'common-mistakes-when-instructing-freelance-police-station-reps',
  'best-practice-handover-notes-after-police-station-attendance',
  'out-of-hours-police-station-cover-for-law-firms',
  'accreditation-and-standards-in-freelance-police-station-work',
  'how-freelance-police-station-reps-win-repeat-instructions',
  'what-makes-a-good-police-station-representative',
  'why-fast-clear-communication-matters-in-police-station-representation',
];

/** Paths that may legitimately 404 on staging or are skipped */
const ALLOWLIST_404 = new Set(
  (process.env.CRAWL_ALLOW_404 || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
);

async function fetchHeadOrGet(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    let res = await fetch(url, {
      method: 'HEAD',
      signal: ctrl.signal,
      redirect: 'follow',
      headers: { 'user-agent': 'PoliceStationRepUK-sitemap-audit/1.0' },
    });
    if (res.status === 405 || res.status === 501) {
      res = await fetch(url, {
        method: 'GET',
        signal: ctrl.signal,
        redirect: 'follow',
        headers: { 'user-agent': 'PoliceStationRepUK-sitemap-audit/1.0', Range: 'bytes=0-0' },
      });
    }
    return { ok: res.ok, status: res.status, final: res.url };
  } catch (e) {
    return { ok: false, status: 0, error: String(e.message || e) };
  } finally {
    clearTimeout(t);
  }
}

function parseSitemapXml(xml) {
  const locs = [];
  const locRe = /<loc>\s*([^<\s]+)\s*<\/loc>/gi;
  let m;
  while ((m = locRe.exec(xml)) !== null) {
    locs.push(m[1].trim());
  }
  return locs;
}

async function collectSitemapUrls(seedUrl) {
  const seen = new Set();
  const queue = [seedUrl];
  const all = [];

  while (queue.length) {
    const u = queue.shift();
    if (seen.has(u)) continue;
    seen.add(u);
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    let xml;
    try {
      const res = await fetch(u, {
        signal: ctrl.signal,
        headers: { 'user-agent': 'PoliceStationRepUK-sitemap-audit/1.0' },
      });
      if (!res.ok) {
        console.error(`Sitemap fetch failed ${res.status}: ${u}`);
        process.exitCode = 1;
        return all;
      }
      xml = await res.text();
    } catch (e) {
      console.error(`Sitemap fetch error: ${u}`, e);
      process.exitCode = 1;
      return all;
    } finally {
      clearTimeout(t);
    }
    const locs = parseSitemapXml(xml);
    const isIndex = /<sitemapindex/i.test(xml);
    if (isIndex) {
      for (const loc of locs) {
        if (!seen.has(loc)) queue.push(loc);
      }
    } else {
      all.push(...locs);
    }
  }
  return [...new Set(all)];
}

async function poolMap(items, limit, fn) {
  const results = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return results;
}

async function main() {
  console.log(`Base: ${BASE}`);
  console.log(`Concurrency: ${CONCURRENCY}, timeout: ${TIMEOUT_MS}ms`);
  if (MAX_URLS) console.log(`Max URLs to check: ${MAX_URLS}`);

  const sitemapUrl = `${BASE}/sitemap.xml`;
  let urls = await collectSitemapUrls(sitemapUrl);
  if (!urls.length) {
    console.error('No URLs from sitemap');
    process.exit(1);
  }
  if (MAX_URLS && urls.length > MAX_URLS) {
    console.log(`Truncating ${urls.length} → ${MAX_URLS} URLs (CRAWL_MAX_URLS)`);
    urls = urls.slice(0, MAX_URLS);
  }

  const failures = [];
  const checked = await poolMap(urls, CONCURRENCY, async (url) => {
    const pathOnly = new URL(url).pathname;
    if (ALLOWLIST_404.has(pathOnly)) return { url, skip: true };
    const r = await fetchHeadOrGet(url);
    if (!r.ok && r.status !== 0) {
      failures.push({ url, status: r.status, error: r.error });
    } else if (r.status === 0) {
      failures.push({ url, status: 0, error: r.error || 'network' });
    }
    return r;
  });

  const okCount = checked.filter((r) => r && !r.skip && r.ok).length;

  // Blog presence in sitemap
  const sitemapSet = new Set(urls);
  const blogMissing = [];
  for (const slug of EXPECTED_BLOG_SLUGS) {
    const u = `${BASE}/Blog/${slug}`;
    if (!sitemapSet.has(u)) {
      blogMissing.push(u);
    }
  }

  // Always hit blog URLs even if truncated out of sitemap sample
  const blogUrls = [
    `${BASE}/Blog`,
    ...EXPECTED_BLOG_SLUGS.map((s) => `${BASE}/Blog/${s}`),
  ];
  for (const u of blogUrls) {
    if (urls.includes(u)) continue;
    const r = await fetchHeadOrGet(u);
    if (!r.ok) failures.push({ url: u, status: r.status, error: r.error || 'blog check' });
  }

  const outDir = path.join(ROOT, 'audit');
  fs.mkdirSync(outDir, { recursive: true });
  const report = {
    generatedAt: new Date().toISOString(),
    base: BASE,
    sitemapUrlCount: urls.length,
    okApprox: okCount,
    failures,
    blogMissingFromSample: blogMissing.length ? blogMissing : undefined,
  };
  fs.writeFileSync(path.join(outDir, 'CRAWL_REPORT.json'), JSON.stringify(report, null, 2));

  let md = `# Sitemap crawl report\n\n- Base: ${BASE}\n- Checked: ${urls.length} sitemap URLs + mandatory blog paths\n- Failures: ${failures.length}\n`;
  if (failures.length) {
    md += '\n## Failures\n\n';
    for (const f of failures.slice(0, 50)) {
      md += `- ${f.status} ${f.url}${f.error ? ` (${f.error})` : ''}\n`;
    }
    if (failures.length > 50) md += `\n… and ${failures.length - 50} more\n`;
  }
  if (blogMissing.length) {
    md += '\n## Blog URLs missing from crawled sitemap sample\n\n';
    blogMissing.forEach((u) => (md += `- ${u}\n`));
  }
  fs.writeFileSync(path.join(outDir, 'CRAWL_REPORT.md'), md);

  const FAIL_THRESHOLD = parseInt(process.env.CRAWL_FAIL_THRESHOLD || '5', 10);
  console.log(`Checked ~${urls.length} sitemap URLs; failures: ${failures.length}`);
  if (failures.length > FAIL_THRESHOLD) {
    console.error(`Crawl failed (${failures.length} > threshold ${FAIL_THRESHOLD}) — see audit/CRAWL_REPORT.json`);
    process.exit(1);
  } else if (failures.length) {
    console.warn(`Crawl completed with ${failures.length} minor failure(s) (within threshold ${FAIL_THRESHOLD}) — see audit/CRAWL_REPORT.json`);
  }
  if (blogMissing.length && MAX_URLS) {
    console.warn('Note: some blog URLs not in truncated sitemap sample (expected when CRAWL_MAX_URLS set)');
  }
  console.log('Crawl OK');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
