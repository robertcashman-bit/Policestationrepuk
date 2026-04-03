/**
 * Full production audit: sitemap HEAD/GET, sampled HTML internal links,
 * API smoke tests (register, contact, station-update, lead-magnet).
 *
 * Usage:
 *   node scripts/audit/full-site-audit.mjs
 *   CRAWL_BASE_URL=https://policestationrepuk.org node scripts/audit/full-site-audit.mjs
 *
 * Optional caps (faster dev runs):
 *   CRAWL_MAX_URLS=500 CRAWL_DEEP_SAMPLE=15 CRAWL_MAX_INTERNAL_CHECKS=400
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { load } from 'cheerio';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..');

const DEFAULT_BASE = 'https://policestationrepuk.org';
const BASE = (process.env.CRAWL_BASE_URL || DEFAULT_BASE).replace(/\/$/, '');
const HOST = new URL(BASE).host;
const MAX_URLS = parseInt(process.env.CRAWL_MAX_URLS || '0', 10) || Infinity;
const CONCURRENCY = Math.min(16, parseInt(process.env.CRAWL_CONCURRENCY || '10', 10) || 10);
const TIMEOUT_MS = parseInt(process.env.CRAWL_TIMEOUT_MS || '20000', 10) || 20000;
const DEEP_SAMPLE = parseInt(process.env.CRAWL_DEEP_SAMPLE || '35', 10) || 35;
const MAX_INTERNAL_CHECKS = parseInt(process.env.CRAWL_MAX_INTERNAL_CHECKS || '600', 10) || 600;
const UA = 'PoliceStationRepUK-full-audit/1.1';

async function fetchHeadOrGet(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    let res = await fetch(url, {
      method: 'HEAD',
      signal: ctrl.signal,
      redirect: 'follow',
      headers: { 'user-agent': UA },
    });
    if (res.status === 405 || res.status === 501) {
      res = await fetch(url, {
        method: 'GET',
        signal: ctrl.signal,
        redirect: 'follow',
        headers: { 'user-agent': UA, Range: 'bytes=0-0' },
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
  while ((m = locRe.exec(xml)) !== null) locs.push(m[1].trim());
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
      const res = await fetch(u, { signal: ctrl.signal, headers: { 'user-agent': UA } });
      if (!res.ok) throw new Error(`sitemap ${res.status}`);
      xml = await res.text();
    } finally {
      clearTimeout(t);
    }
    const locs = parseSitemapXml(xml);
    if (/<sitemapindex/i.test(xml)) {
      for (const loc of locs) if (!seen.has(loc)) queue.push(loc);
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

function normalizeInternalHref(href) {
  if (!href || href.startsWith('#') || href.startsWith('javascript:')) return null;
  try {
    if (href.startsWith('/')) {
      const u = new URL(href, BASE);
      if (u.host !== HOST && u.host !== new URL(BASE).host) return null;
      return u.pathname + (u.search || '');
    }
    if (href.startsWith('http://') || href.startsWith('https://')) {
      const u = new URL(href);
      if (u.host !== HOST) return null;
      return u.pathname + (u.search || '');
    }
  } catch {
    return null;
  }
  return null;
}

async function fetchHtmlSnippet(url, maxBytes = 120000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: 'follow',
      headers: { 'user-agent': UA, Range: `bytes=0-${maxBytes - 1}` },
    });
    if (!res.ok) return { ok: false, status: res.status, html: '' };
    const html = await res.text();
    return { ok: true, status: res.status, html };
  } catch (e) {
    return { ok: false, status: 0, html: '', error: String(e.message || e) };
  } finally {
    clearTimeout(t);
  }
}

function pickDeepSampleUrls(allSitemapUrls) {
  const set = new Set();
  const want = (path) => {
    const u = path === '/' ? BASE : `${BASE}${path.startsWith('/') ? path : '/' + path}`;
    if (allSitemapUrls.includes(u)) set.add(u);
    else if (path === '/') {
      const home = allSitemapUrls.find((x) => x === BASE || x === `${BASE}/`);
      if (home) set.add(home);
      else set.add(BASE);
    } else set.add(u);
  };
  want('/');
  want('/directory');
  want('/register');
  want('/Contact');
  want('/StationsDirectory');
  want('/UpdateStation');
  want('/Blog');
  want('/Wiki');
  want('/FormsLibrary');
  want('/FAQ');
  want('/Map');
  want('/search');
  want('/police-station-representative');
  const blog = allSitemapUrls.filter((u) => u.includes('/Blog/') && !u.endsWith('/Blog'));
  if (blog[0]) set.add(blog[0]);
  if (blog[Math.floor(blog.length / 2)]) set.add(blog[Math.floor(blog.length / 2)]);
  if (blog[Math.floor(blog.length / 3)]) set.add(blog[Math.floor(blog.length / 3)]);
  const wiki = allSitemapUrls.filter((u) => u.includes('/Wiki/'));
  if (wiki[0]) set.add(wiki[0]);
  if (wiki[wiki.length - 1]) set.add(wiki[wiki.length - 1]);
  if (wiki[Math.floor(wiki.length / 2)]) set.add(wiki[Math.floor(wiki.length / 2)]);
  const stations = allSitemapUrls.filter((u) => u.includes('/police-station/'));
  if (stations[0]) set.add(stations[0]);
  if (stations[Math.min(50, stations.length - 1)]) set.add(stations[Math.min(50, stations.length - 1)]);
  const counties = allSitemapUrls.filter((u) => /\/directory\/[a-z]/.test(u));
  if (counties[0]) set.add(counties[0]);
  const legal = allSitemapUrls.filter((u) => u.includes('/LegalUpdates/'));
  if (legal[0]) set.add(legal[0]);
  if (legal.length > 1) set.add(legal[Math.floor(legal.length / 2)]);
  const arr = [...set];
  while (arr.length < DEEP_SAMPLE && allSitemapUrls.length > arr.length) {
    const u = allSitemapUrls[(arr.length * 9973) % allSitemapUrls.length];
    if (!arr.includes(u)) arr.push(u);
  }
  return arr.slice(0, DEEP_SAMPLE);
}

async function extractAndCheckInternalLinks(pageUrls) {
  const discovered = new Set();
  const pageErrors = [];

  for (const pageUrl of pageUrls) {
    const { ok, html, status, error } = await fetchHtmlSnippet(pageUrl);
    if (!ok || !html) {
      pageErrors.push({ pageUrl, status, error });
      continue;
    }
    try {
      const $ = load(html);
      $('a[href]').each((_, el) => {
        const href = $(el).attr('href');
        const n = normalizeInternalHref(href?.trim() || '');
        if (n) discovered.add(n.split('#')[0]);
      });
    } catch (e) {
      pageErrors.push({ pageUrl, parseError: String(e) });
    }
  }

  const toCheck = [...discovered].filter((p) => p && p.length < 500).slice(0, MAX_INTERNAL_CHECKS);
  const linkFailures = [];

  await poolMap(toCheck, CONCURRENCY, async (pathname) => {
    const url = `${BASE}${pathname.startsWith('/') ? pathname : '/' + pathname}`;
    const r = await fetchHeadOrGet(url);
    if (!r.ok) linkFailures.push({ url, status: r.status, error: r.error });
  });

  return { discoveredCount: discovered.size, checkedCount: toCheck.length, linkFailures, pageErrors };
}

async function postJson(path, body) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 25000);
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      signal: ctrl.signal,
      headers: { 'content-type': 'application/json', 'user-agent': UA },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    let json = {};
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text.slice(0, 200) };
    }
    return { status: res.status, json };
  } catch (e) {
    return { status: 0, error: String(e.message || e) };
  } finally {
    clearTimeout(t);
  }
}

async function runFormAudits() {
  const started = Date.now() - 15_000;
  const results = {};

  results.register = await postJson('/api/register', {
    name: 'QA Audit Bot',
    email: 'qa-audit-register@example.com',
    phone: '07123456789',
    accreditation: 'QA test — discard',
    counties: ['Kent'],
    stations: ['Maidstone'],
    availability: 'full-time',
    message: 'Automated audit submission — safe to discard.',
    _hp: '',
  });

  results.contact = await postJson('/api/contact', {
    name: 'QA Audit Bot',
    email: 'qa-audit-contact@example.com',
    subject: 'QA audit',
    message:
      'This is an automated directory QA message. It contains enough unique text to pass spam heuristics. Please discard.',
    _hp: '',
    _startedAt: started,
  });

  results.leadMagnet = await postJson('/api/lead-magnet', {
    email: 'qa-audit-lead@example.com',
    source: 'full-site-audit',
    leadMagnet: 'QA audit',
    _hp: '',
    _startedAt: started,
  });

  let stationPayload = { skip: true, reason: 'could not load /api/stations' };
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    const sr = await fetch(`${BASE}/api/stations`, {
      signal: ctrl.signal,
      headers: { 'user-agent': UA },
    });
    clearTimeout(t);
    if (sr.ok) {
      const pins = await sr.json();
      const s = Array.isArray(pins) && pins[0];
      if (s) {
        stationPayload = await postJson('/api/station-update', {
          stationId: s.id,
          stationName: s.name,
          currentAddress: s.address || '',
          currentPostcode: '',
          currentPhone: s.phone || '',
          currentCustodyPhone: '',
          currentNonEmergencyPhone: '',
          newPhone: '02079460000',
          notes: 'QA audit — suggested test number only; discard.',
          submitterName: 'QA Audit Bot',
          submitterEmail: 'qa-audit-station@example.com',
          _hp: '',
          _startedAt: started,
        });
      }
    }
  } catch (e) {
    stationPayload = { status: 0, error: String(e.message || e) };
  }
  results.stationUpdate = stationPayload;

  return results;
}

function formVerdict(r) {
  if (r.skip) return 'SKIPPED';
  if (r.status === 200 && r.json?.ok && r.json?.id && r.json.id !== 'noop') return 'PASS';
  if (r.status === 200 && r.json?.id === 'noop') return 'NOOP (unexpected for clean bot)';
  if (r.status === 429) return 'RATE_LIMIT (retry later)';
  return `FAIL (${r.status} ${r.error || JSON.stringify(r.json)?.slice(0, 120)})`;
}

async function main() {
  console.log(`Full site audit → ${BASE}`);
  const outDir = path.join(ROOT, 'audit');
  fs.mkdirSync(outDir, { recursive: true });

  const sitemapUrl = `${BASE}/sitemap.xml`;
  let urls = await collectSitemapUrls(sitemapUrl);
  if (!urls.length) {
    console.error('No sitemap URLs');
    process.exit(1);
  }
  const total = urls.length;
  if (Number.isFinite(MAX_URLS) && urls.length > MAX_URLS) {
    console.log(`Truncating sitemap ${urls.length} → ${MAX_URLS}`);
    urls = urls.slice(0, MAX_URLS);
  }

  console.log(`Checking ${urls.length} sitemap URLs…`);
  const sitemapFailures = [];
  await poolMap(urls, CONCURRENCY, async (url) => {
    const r = await fetchHeadOrGet(url);
    if (!r.ok) sitemapFailures.push({ url, status: r.status, error: r.error });
  });

  const deepUrls = pickDeepSampleUrls(total === urls.length ? urls : await collectSitemapUrls(sitemapUrl));
  console.log(`Deep link sample: ${deepUrls.length} pages → extract internal hrefs…`);
  const deep = await extractAndCheckInternalLinks(deepUrls);

  console.log('Form API probes…');
  const forms = await runFormAudits();

  const report = {
    generatedAt: new Date().toISOString(),
    base: BASE,
    sitemap: {
      totalInSitemap: total,
      checked: urls.length,
      failures: sitemapFailures,
    },
    internalLinksFromSample: {
      pagesSampled: deepUrls.length,
      uniqueInternalPaths: deep.discoveredCount,
      pathsChecked: deep.checkedCount,
      failures: deep.linkFailures,
      pageFetchErrors: deep.pageErrors,
    },
    forms: {
      register: { ...forms.register, verdict: formVerdict(forms.register) },
      contact: { ...forms.contact, verdict: formVerdict(forms.contact) },
      leadMagnet: { ...forms.leadMagnet, verdict: formVerdict(forms.leadMagnet) },
      stationUpdate: {
        ...forms.stationUpdate,
        verdict: formVerdict(forms.stationUpdate),
      },
    },
  };

  fs.writeFileSync(path.join(outDir, 'FULL_AUDIT_REPORT.json'), JSON.stringify(report, null, 2));

  let md = `# Full site audit\n\n- **When:** ${report.generatedAt}\n- **Base:** ${BASE}\n\n`;
  md += `## Sitemap URLs\n\n- Checked: ${report.sitemap.checked} (of ${report.sitemap.totalInSitemap} in index)\n- **Failures:** ${report.sitemap.failures.length}\n\n`;
  if (report.sitemap.failures.length) {
    report.sitemap.failures.slice(0, 40).forEach((f) => {
      md += `- ${f.status} \`${f.url}\`${f.error ? ` — ${f.error}` : ''}\n`;
    });
    if (report.sitemap.failures.length > 40) md += `\n… +${report.sitemap.failures.length - 40} more\n`;
  }

  md += `\n## Internal links (from ${deepUrls.length} HTML samples)\n\n`;
  md += `- Unique internal paths found: ${deep.discoveredCount}\n- HEAD-checked (capped): ${deep.checkedCount}\n- **Broken:** ${deep.linkFailures.length}\n\n`;
  if (deep.pageErrors.length) {
    md += `### Page fetch / parse issues\n\n`;
    deep.pageErrors.forEach((e) => (md += `- ${JSON.stringify(e)}\n`));
  }
  if (deep.linkFailures.length) {
    deep.linkFailures.slice(0, 50).forEach((f) => (md += `- ${f.status} ${f.url}\n`));
  }

  md += `\n## Form API smoke tests\n\n`;
  for (const [k, v] of Object.entries(report.forms)) {
    md += `- **${k}:** ${v.verdict}\n`;
  }

  fs.writeFileSync(path.join(outDir, 'FULL_AUDIT_REPORT.md'), md);

  console.log('\n--- Summary ---');
  console.log(`Sitemap failures: ${sitemapFailures.length}`);
  console.log(`Sampled internal link failures: ${deep.linkFailures.length}`);
  console.log('Forms:', Object.entries(report.forms).map(([k, v]) => `${k}=${v.verdict}`).join(' | '));
  console.log(`Wrote audit/FULL_AUDIT_REPORT.json and .md`);

  const formFail = (v) => v.startsWith('FAIL') || v.includes('NOOP');
  const badForms =
    formFail(report.forms.register.verdict) ||
    formFail(report.forms.contact.verdict) ||
    formFail(report.forms.leadMagnet.verdict) ||
    (report.forms.stationUpdate.verdict !== 'SKIPPED' && formFail(report.forms.stationUpdate.verdict));

  const THRESH_SITEMAP = parseInt(process.env.AUDIT_FAIL_SITEMAP_THRESHOLD || '25', 10);
  const THRESH_LINKS = parseInt(process.env.AUDIT_FAIL_LINK_THRESHOLD || '50', 10);

  if (sitemapFailures.length >= THRESH_SITEMAP || deep.linkFailures.length >= THRESH_LINKS || badForms) {
    process.exitCode = 1;
    console.error('Audit exit 1 — see audit/FULL_AUDIT_REPORT.json');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
