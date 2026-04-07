#!/usr/bin/env node
/**
 * SEO Audit — crawls every reachable page on the site and writes a
 * Cursor-AI-ready fix prompt to audit/seo-fixes.md.
 *
 * Usage:  npm run audit:seo
 *
 * Output: audit/seo-fixes.md — paste contents into Cursor AI to auto-fix
 */

import https from 'https';
import http from 'http';
import { URL } from 'url';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const OUT_DIR = join(ROOT, 'audit');

const args = process.argv.slice(2);
function flag(name) {
  const i = args.indexOf('--' + name);
  return i === -1 ? undefined : args[i + 1];
}
const SITE = (flag('url') || 'https://policestationrepuk.org').replace(/\/$/, '');
const CONCURRENCY = parseInt(flag('concurrency') || '8', 10);
const TIMEOUT_MS = 12000;

let origin;
try { origin = new URL(SITE).origin; } catch { console.error('Invalid URL'); process.exit(1); }

/* ───── HTTP ───── */
function get(url, timeoutMs = TIMEOUT_MS, depth = 0) {
  if (depth > 5) return Promise.reject(new Error('too many redirects'));
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, {
      headers: { 'User-Agent': 'PSR-SEO-Audit/2.0', Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9' },
      timeout: timeoutMs,
    }, (res) => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode)) {
        const loc = res.headers.location;
        if (loc) return get(loc.startsWith('/') ? origin + loc : loc, timeoutMs, depth + 1).then(resolve, reject);
      }
      let body = '';
      res.setEncoding('utf-8');
      res.on('data', c => body += c);
      res.on('end', () => resolve({ status: res.statusCode, body, finalUrl: url }));
      res.on('error', reject);
    });
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.on('error', reject);
  });
}

/* ───── HTML parsing (zero deps) ───── */
function meta(html, name) {
  const rx = new RegExp(`<meta\\s[^>]*name=["']${name}["'][^>]*content=["']([^"']*)["']`, 'i');
  const rx2 = new RegExp(`<meta\\s[^>]*content=["']([^"']*)["'][^>]*name=["']${name}["']`, 'i');
  return (html.match(rx)?.[1] || html.match(rx2)?.[1] || '').trim();
}
function ogTag(html, prop) {
  const rx = new RegExp(`<meta\\s[^>]*property=["']${prop}["'][^>]*content=["']([^"']*)["']`, 'i');
  const rx2 = new RegExp(`<meta\\s[^>]*content=["']([^"']*)["'][^>]*property=["']${prop}["']`, 'i');
  return (html.match(rx)?.[1] || html.match(rx2)?.[1] || '').trim();
}
function extractTitle(html) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? m[1].replace(/\s+/g, ' ').trim() : '';
}
function extractCanonical(html) {
  const m = html.match(/<link\s[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i);
  return m ? m[1].trim() : '';
}
function extractH1s(html) {
  return [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)]
    .map(m => m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()).filter(Boolean);
}
function extractH2s(html) {
  return [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)]
    .map(m => m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()).filter(Boolean);
}
function extractLinks(html, pageUrl) {
  const links = new Set();
  let m;
  const rx = /href=["']([^"'#]+)/gi;
  while ((m = rx.exec(html)) !== null) {
    let href = m[1].split('#')[0].split('?')[0].trim();
    if (!href || /^(mailto:|tel:|javascript:|data:)/i.test(href)) continue;
    if (/\.(pdf|jpg|jpeg|png|gif|svg|webp|css|js|xml|zip|mp4|ico|woff|woff2|ttf|eot|json|txt)$/i.test(href)) continue;
    try {
      const u = new URL(href, pageUrl);
      if (u.origin === origin) links.add(origin + (u.pathname.replace(/\/$/, '') || '/'));
    } catch {}
  }
  return links;
}
function wordCount(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(/\s+/).filter(w => w.length > 1).length;
}
function extractExcerpt(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim().slice(0, 300);
}
function hasStructuredData(html) {
  return /<script\s[^>]*type=["']application\/ld\+json["']/i.test(html);
}
function extractImages(html) {
  const imgs = [];
  let m;
  const rx = /<img\s[^>]*>/gi;
  while ((m = rx.exec(html)) !== null) {
    const tag = m[0];
    imgs.push({
      src: tag.match(/src=["']([^"']*)/i)?.[1] || '',
      alt: tag.match(/alt=["']([^"']*)/i)?.[1] || '',
      hasAlt: tag.includes('alt='),
    });
  }
  return imgs;
}

/* ───── Sitemap ───── */
async function fetchSitemapUrls() {
  const urls = new Set();
  try {
    const res = await get(SITE + '/sitemap.xml', 15000);
    let m;
    const rx = /<loc>\s*(.*?)\s*<\/loc>/gi;
    while ((m = rx.exec(res.body)) !== null) {
      urls.add(m[1].trim().replace(/\/$/, '') || origin);
    }
  } catch {}
  return urls;
}

/* ───── Analyser ───── */
function analysePage(url, html, status, sitemapUrls) {
  const title = extractTitle(html);
  const metaDesc = meta(html, 'description');
  const metaRobots = meta(html, 'robots').toLowerCase();
  const canonical = extractCanonical(html);
  const h1s = extractH1s(html);
  const h2s = extractH2s(html);
  const wc = wordCount(html);
  const images = extractImages(html);
  const normUrl = url.replace(/\/$/, '') || origin;
  const normCanonical = canonical ? (canonical.startsWith('/') ? origin + canonical : canonical).replace(/\/$/, '') : '';
  const hasNoindex = metaRobots.includes('noindex');
  const canonMismatch = !!(normCanonical && normCanonical !== normUrl);

  return {
    url: normUrl, status, title, titleLength: title.length,
    metaDesc, metaDescLength: metaDesc.length, metaRobots, canonical,
    h1s, h2s, wordCount: wc, images,
    imagesWithoutAlt: images.filter(i => !i.hasAlt || !i.alt.trim()),
    ogTitle: ogTag(html, 'og:title'), ogDesc: ogTag(html, 'og:description'),
    ogImage: ogTag(html, 'og:image'), hasJsonLd: hasStructuredData(html),
    hasNoindex, canonMismatch,
    indexable: !hasNoindex && !canonMismatch,
    inSitemap: sitemapUrls.has(normUrl) || sitemapUrls.has(normUrl + '/'),
    excerpt: extractExcerpt(html), error: null,
  };
}

/* ───── Issue detection ───── */
function detectIssues(p) {
  const issues = [];
  if (p.error) { issues.push({ id: 'fetch-error', label: `Fetch error: ${p.error}`, prio: 'high' }); return issues; }
  if (p.status >= 400) issues.push({ id: 'http-error', label: `HTTP ${p.status}`, prio: 'high' });
  if (!p.title) issues.push({ id: 'miss-title', label: 'Missing <title>', prio: 'high' });
  else if (p.titleLength < 20) issues.push({ id: 'short-title', label: `Title too short (${p.titleLength}ch)`, prio: 'medium' });
  else if (p.titleLength > 60) issues.push({ id: 'long-title', label: `Title too long (${p.titleLength}ch)`, prio: 'medium' });
  if (!p.metaDesc) issues.push({ id: 'miss-meta', label: 'Missing meta description', prio: 'high' });
  else if (p.metaDescLength < 50) issues.push({ id: 'short-meta', label: `Meta desc too short (${p.metaDescLength}ch)`, prio: 'medium' });
  else if (p.metaDescLength > 160) issues.push({ id: 'long-meta', label: `Meta desc too long (${p.metaDescLength}ch)`, prio: 'medium' });
  if (p.hasNoindex) issues.push({ id: 'noindex', label: 'noindex present', prio: 'high' });
  if (p.canonMismatch) issues.push({ id: 'canon-mis', label: 'Canonical mismatch', prio: 'high' });
  if (p.h1s.length === 0) issues.push({ id: 'miss-h1', label: 'Missing H1', prio: 'medium' });
  else if (p.h1s.length > 1) issues.push({ id: 'multi-h1', label: `${p.h1s.length} H1 tags`, prio: 'low' });
  if (p.h2s.length === 0) issues.push({ id: 'miss-h2', label: 'No H2s', prio: 'low' });
  if (p.wordCount > 0 && p.wordCount < 300) issues.push({ id: 'thin', label: `Thin (${p.wordCount}w)`, prio: 'low' });
  if (!p.inSitemap) issues.push({ id: 'no-sitemap', label: 'Not in sitemap', prio: 'low' });
  if (!p.ogImage) issues.push({ id: 'miss-og-image', label: 'Missing og:image', prio: 'low' });
  if (!p.hasJsonLd) issues.push({ id: 'miss-jsonld', label: 'No JSON-LD', prio: 'low' });
  if (p.imagesWithoutAlt.length > 0) issues.push({ id: 'img-alt', label: `${p.imagesWithoutAlt.length} imgs no alt`, prio: 'medium' });
  return issues;
}

/* ───── Fix generator ───── */
function slugToText(url) {
  try {
    const parts = new URL(url).pathname.split('/').filter(Boolean);
    return (parts[parts.length - 1] || 'home')
      .replace(/\.[^.]+$/, '').replace(/[-_+]/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\b\w/g, c => c.toUpperCase()).trim();
  } catch { return 'Page'; }
}

function generateFixes(page, issues) {
  const kw = page.h1s[0] || slugToText(page.url);
  const brand = 'PoliceStationRepUK';
  return issues.map(issue => {
    let fix = '', type = '';
    switch (issue.id) {
      case 'miss-title': type = 'Add title'; fix = `${kw} | ${brand}`; break;
      case 'short-title': type = 'Expand title'; fix = `${kw} — Free Directory | ${brand}`; break;
      case 'long-title': type = 'Shorten title'; fix = page.title.slice(0, 57) + '…'; break;
      case 'miss-meta': type = 'Add meta description'; fix = page.excerpt ? page.excerpt.replace(/\s+/g,' ').slice(0,130).trim()+'. Find out more at PoliceStationRepUK.' : `${kw}. Free directory of police station reps across England & Wales.`; if(fix.length>155) fix=fix.slice(0,152)+'…'; break;
      case 'short-meta': type = 'Expand meta desc'; fix = page.metaDesc+'. Free directory of police station reps across England & Wales.'; if(fix.length>155) fix=fix.slice(0,152)+'…'; break;
      case 'long-meta': type = 'Shorten meta desc'; fix = page.metaDesc.slice(0,152) + '…'; break;
      case 'noindex': type = 'Remove noindex'; fix = 'Change meta robots to: index, follow'; break;
      case 'canon-mis': type = 'Fix canonical'; fix = `Set canonical to: ${page.url}`; break;
      case 'miss-h1': type = 'Add H1'; fix = page.title ? page.title.replace(/\s*[|–—]\s*[^|–—]+$/,'').trim() : kw; break;
      case 'multi-h1': type = 'Keep 1 H1'; fix = `Keep "${page.h1s[0]}", convert ${page.h1s.slice(1).map(h=>`"${h}"`).join(', ')} to H2`; break;
      case 'miss-h2': type = 'Add H2s'; fix = 'Break content into sections with H2 headings'; break;
      case 'thin': type = 'Expand content'; fix = `Only ${page.wordCount} words. Add service explanation, FAQ, CTA (aim 300+)`; break;
      case 'no-sitemap': type = 'Add to sitemap'; fix = `Add ${page.url} to sitemap.ts`; break;
      case 'miss-og-image': type = 'Add og:image'; fix = `${origin}/social-preview.jpg`; break;
      case 'miss-jsonld': type = 'Add JSON-LD'; fix = 'Add WebPage or FAQPage structured data'; break;
      case 'img-alt': type = 'Add alt text'; fix = `${page.imagesWithoutAlt.length} images need alt attributes`; break;
      default: type = 'Review'; fix = issue.label;
    }
    return { issue: issue.label, priority: issue.prio, type, fix };
  });
}

/* ───── Crawler (unlimited, sitemap-seeded) ───── */
async function crawl() {
  console.log(`\n🔍 SEO Audit — ${SITE}`);
  console.log(`   No page limit — crawling everything reachable\n`);

  process.stdout.write('  Fetching sitemap.xml…');
  const sitemapUrls = await fetchSitemapUrls();
  console.log(` ${sitemapUrls.size} URLs found.`);

  // Seed queue: homepage + every sitemap URL
  const visited = new Set();
  const queue = [SITE];
  for (const u of sitemapUrls) {
    const norm = u.replace(/\/$/, '') || origin;
    if (!queue.includes(norm)) queue.push(norm);
  }

  const results = [];
  let inflight = 0;
  let done = 0;
  const total = queue.length;

  function dequeue() {
    return new Promise(resolve => {
      const interval = setInterval(() => {
        while (inflight < CONCURRENCY && queue.length > 0) {
          const url = queue.shift();
          const norm = url.replace(/\/$/, '') || origin;
          if (visited.has(norm)) continue;
          visited.add(norm);
          inflight++;

          (async () => {
            try {
              const res = await get(norm);
              const effectiveUrl = (res.finalUrl || norm).replace(/\/$/, '') || origin;
              if (effectiveUrl !== norm) visited.add(effectiveUrl);
              const page = analysePage(effectiveUrl, res.body, res.status, sitemapUrls);
              if (effectiveUrl !== norm) page.redirectedFrom = norm;
              results.push(page);

              if (res.body) {
                for (const link of extractLinks(res.body, norm)) {
                  const ln = link.replace(/\/$/, '') || origin;
                  if (!visited.has(ln) && !queue.includes(ln)) queue.push(ln);
                }
              }
            } catch (e) {
              results.push({
                url: norm, status: 0, title: '', metaDesc: '', metaDescLength: 0,
                titleLength: 0, metaRobots: '', canonical: '', h1s: [], h2s: [],
                wordCount: 0, images: [], imagesWithoutAlt: [], ogTitle: '', ogDesc: '',
                ogImage: '', hasJsonLd: false, hasNoindex: false, canonMismatch: false,
                indexable: false, inSitemap: false, excerpt: '', error: e.message,
              });
            }
            inflight--;
            done++;
            process.stdout.write(`\r  Crawling… ${done} done, ${queue.length} queued, ${inflight} active    `);
          })();
        }
        if (inflight === 0 && queue.length === 0) { clearInterval(interval); resolve(); }
      }, 50);
    });
  }

  await dequeue();
  console.log(`\r  ✓ Crawled ${results.length} pages.                                    \n`);
  return results;
}

/* ───── Build Cursor-ready fix prompt ───── */
function buildCursorPrompt(results) {
  const pagesWithIssues = results
    .filter(p => detectIssues(p).length > 0)
    .sort((a, b) => {
      const sa = detectIssues(a).some(i => i.prio === 'high') ? 0 : detectIssues(a).some(i => i.prio === 'medium') ? 1 : 2;
      const sb = detectIssues(b).some(i => i.prio === 'high') ? 0 : detectIssues(b).some(i => i.prio === 'medium') ? 1 : 2;
      return sa - sb;
    });

  const okCount = results.filter(p => detectIssues(p).length === 0).length;
  const critCount = results.filter(p => detectIssues(p).some(i => i.prio === 'high')).length;
  const warnCount = results.filter(p => detectIssues(p).some(i => i.prio === 'medium')).length;

  const lines = [];
  lines.push(`# SEO Audit — Fix Instructions for Cursor AI`);
  lines.push(`Site: ${SITE} | Date: ${new Date().toISOString().slice(0,10)} | Pages: ${results.length}`);
  lines.push(`Critical: ${critCount} | Warnings: ${warnCount} | OK: ${okCount}`);
  lines.push('');
  lines.push('Fix every issue below. For each page, apply the suggested fix in the correct source file.');
  lines.push('This is a Next.js App Router project. Metadata is set via `export const metadata` or `generateMetadata()` in each page.tsx.');
  lines.push('The canonical URL is set via `buildMetadata({ path })` from `lib/seo.ts`.');
  lines.push('Sitemap entries are in `app/sitemap.ts` and `lib/sitemap-paths.ts`.');
  lines.push('');
  lines.push('---');
  lines.push('');

  for (const page of pagesWithIssues) {
    const issues = detectIssues(page);
    const fixes = generateFixes(page, issues);
    const path = page.url.replace(origin, '') || '/';
    const prio = issues.some(i => i.prio === 'high') ? 'CRITICAL' : issues.some(i => i.prio === 'medium') ? 'WARNING' : 'INFO';

    lines.push(`## [${prio}] ${path}`);
    lines.push('');
    lines.push(`Current title: ${page.title ? `"${page.title}" (${page.titleLength}ch)` : 'MISSING'}`);
    lines.push(`Current meta: ${page.metaDesc ? `"${page.metaDesc.slice(0,80)}${page.metaDesc.length>80?'…':''}" (${page.metaDescLength}ch)` : 'MISSING'}`);
    lines.push(`H1: ${page.h1s.length > 0 ? `"${page.h1s[0]}"` : 'MISSING'} | Words: ${page.wordCount} | Indexable: ${page.indexable?'yes':'NO'} | Sitemap: ${page.inSitemap?'yes':'no'} | JSON-LD: ${page.hasJsonLd?'yes':'no'}`);
    lines.push('');

    for (const f of fixes) {
      const icon = f.priority === 'high' ? 'CRITICAL' : f.priority === 'medium' ? 'WARNING' : 'INFO';
      lines.push(`- **[${icon}] ${f.type}:** ${f.fix}`);
    }
    lines.push('');
  }

  if (okCount > 0) {
    lines.push(`---`);
    lines.push(`## ${okCount} pages passed with no issues.`);
  }

  return lines.join('\n');
}

/* ───── Main ───── */
async function main() {
  const results = await crawl();
  mkdirSync(OUT_DIR, { recursive: true });

  const prompt = buildCursorPrompt(results);
  const mdPath = join(OUT_DIR, 'seo-fixes.md');
  writeFileSync(mdPath, prompt, 'utf-8');

  // Also write JSON for programmatic use
  const jsonData = results.map(p => {
    const issues = detectIssues(p);
    return { url: p.url, path: p.url.replace(origin,'') || '/', ...(p.redirectedFrom ? { redirectedFrom: p.redirectedFrom.replace(origin,'') || '/' } : {}), status: p.status, indexable: p.indexable, inSitemap: p.inSitemap, canonical: p.canonical || null, title: p.title, titleLength: p.titleLength, metaDesc: p.metaDesc, metaDescLength: p.metaDescLength, h1: p.h1s[0]||null, wordCount: p.wordCount, hasJsonLd: p.hasJsonLd, issues: issues.map(i=>({label:i.label,priority:i.prio})), fixes: generateFixes(p,issues).map(f=>({type:f.type,fix:f.fix,priority:f.priority})), error: p.error };
  });
  writeFileSync(join(OUT_DIR, 'seo-fixes.json'), JSON.stringify(jsonData, null, 2), 'utf-8');

  // Copy to clipboard
  try {
    if (process.platform === 'win32') {
      execSync('clip', { input: prompt });
      console.log('  📋 Copied to clipboard! Paste into Cursor AI to auto-fix.\n');
    } else if (process.platform === 'darwin') {
      execSync('pbcopy', { input: prompt });
      console.log('  📋 Copied to clipboard! Paste into Cursor AI to auto-fix.\n');
    }
  } catch {
    console.log(`  📄 Open ${mdPath} and paste contents into Cursor AI.\n`);
  }

  const allIssues = results.flatMap(p => detectIssues(p));
  console.log('  ┌────────────────────────────────────┐');
  console.log(`  │  Pages:    ${String(results.length).padStart(5)}                   │`);
  console.log(`  │  Critical: ${String(allIssues.filter(i=>i.prio==='high').length).padStart(5)} 🔴               │`);
  console.log(`  │  Warnings: ${String(allIssues.filter(i=>i.prio==='medium').length).padStart(5)} 🟠               │`);
  console.log(`  │  Info:     ${String(allIssues.filter(i=>i.prio==='low').length).padStart(5)} 🔵               │`);
  console.log('  └────────────────────────────────────┘');
  console.log(`\n  📄 ${mdPath}`);
  console.log(`  📊 ${join(OUT_DIR, 'seo-fixes.json')}\n`);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
