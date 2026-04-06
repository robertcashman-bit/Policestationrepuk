#!/usr/bin/env node
/**
 * SEO Audit — crawls the live site, analyses every page, and writes a
 * structured Markdown report with ready-to-apply fixes.
 *
 * Usage:
 *   npm run audit:seo                        # default: 50-page sample
 *   npm run audit:seo -- --max 200           # crawl up to 200 pages
 *   npm run audit:seo -- --url https://x.com # audit a different site
 *
 * Output:
 *   audit/seo-report.md   — human-readable report with fixes
 *   audit/seo-report.json — machine-readable data for Cursor AI
 */

import https from 'https';
import http from 'http';
import { URL } from 'url';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const OUT_DIR = join(ROOT, 'audit');

/* ────────────────────── CLI args ────────────────────── */
const args = process.argv.slice(2);
function flag(name) {
  const i = args.indexOf('--' + name);
  if (i === -1) return undefined;
  return args[i + 1];
}
const SITE = (flag('url') || 'https://policestationrepuk.org').replace(/\/$/, '');
const MAX_PAGES = parseInt(flag('max') || '50', 10);
const CONCURRENCY = parseInt(flag('concurrency') || '5', 10);
const TIMEOUT_MS = 12000;

let origin;
try { origin = new URL(SITE).origin; } catch { console.error('Invalid URL'); process.exit(1); }

/* ────────────────────── HTTP fetch ────────────────────── */
function get(url, timeoutMs = TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, {
      headers: { 'User-Agent': 'PSR-SEO-Audit/1.0', Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9' },
      timeout: timeoutMs,
    }, (res) => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode)) {
        const loc = res.headers.location;
        if (loc) { get(loc.startsWith('/') ? origin + loc : loc, timeoutMs).then(resolve, reject); return; }
      }
      let body = '';
      res.setEncoding('utf-8');
      res.on('data', (c) => { body += c; });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
      res.on('error', reject);
    });
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.on('error', reject);
  });
}

/* ────────────────────── HTML parser (regex, no deps) ── */
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
  const matches = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)];
  return matches.map(m => m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()).filter(Boolean);
}

function extractH2s(html) {
  const matches = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)];
  return matches.map(m => m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()).filter(Boolean);
}

function extractLinks(html, pageUrl) {
  const links = new Set();
  const rx = /href=["']([^"'#]+)/gi;
  let m;
  while ((m = rx.exec(html)) !== null) {
    let href = m[1].split('#')[0].split('?')[0].trim();
    if (!href || /^(mailto:|tel:|javascript:|data:)/i.test(href)) continue;
    if (/\.(pdf|jpg|jpeg|png|gif|svg|webp|css|js|xml|zip|mp4|ico|woff|woff2|ttf|eot|json)$/i.test(href)) continue;
    try {
      const u = new URL(href, pageUrl);
      if (u.origin === origin) {
        let p = u.pathname.replace(/\/$/, '') || '/';
        links.add(origin + p);
      }
    } catch {}
  }
  return links;
}

function wordCount(html) {
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.split(/\s+/).filter(w => w.length > 1).length;
}

function extractExcerpt(html) {
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.slice(0, 300);
}

function hasStructuredData(html) {
  return /<script\s[^>]*type=["']application\/ld\+json["']/i.test(html);
}

function extractImages(html) {
  const imgs = [];
  const rx = /<img\s[^>]*>/gi;
  let m;
  while ((m = rx.exec(html)) !== null) {
    const tag = m[0];
    const alt = tag.match(/alt=["']([^"']*)/i)?.[1] || '';
    const src = tag.match(/src=["']([^"']*)/i)?.[1] || '';
    imgs.push({ src, alt, hasAlt: tag.includes('alt=') });
  }
  return imgs;
}

/* ────────────────────── Sitemap fetch ────────────────── */
async function fetchSitemapUrls() {
  const urls = new Set();
  try {
    const res = await get(SITE + '/sitemap.xml', 15000);
    const locRx = /<loc>\s*(.*?)\s*<\/loc>/gi;
    let m;
    while ((m = locRx.exec(res.body)) !== null) {
      let u = m[1].trim().replace(/\/$/, '') || origin;
      urls.add(u);
    }
  } catch {}
  return urls;
}

/* ────────────────────── Page analyser ────────────────── */
function analysePage(url, html, status, sitemapUrls) {
  const title = extractTitle(html);
  const metaDesc = meta(html, 'description');
  const metaRobots = meta(html, 'robots').toLowerCase();
  const canonical = extractCanonical(html);
  const h1s = extractH1s(html);
  const h2s = extractH2s(html);
  const wc = wordCount(html);
  const images = extractImages(html);
  const ogTitle = ogTag(html, 'og:title');
  const ogDesc = ogTag(html, 'og:description');
  const ogImage = ogTag(html, 'og:image');
  const hasJsonLd = hasStructuredData(html);
  const excerpt = extractExcerpt(html);

  const normUrl = url.replace(/\/$/, '') || origin;
  const normCanonical = canonical ? (canonical.startsWith('/') ? origin + canonical : canonical).replace(/\/$/, '') : '';

  const hasNoindex = metaRobots.includes('noindex');
  const canonMismatch = !!(normCanonical && normCanonical !== normUrl);
  const indexable = !hasNoindex && !canonMismatch;
  const inSitemap = sitemapUrls.has(normUrl) || sitemapUrls.has(normUrl + '/');

  return {
    url: normUrl,
    status,
    title,
    titleLength: title.length,
    metaDesc,
    metaDescLength: metaDesc.length,
    metaRobots,
    canonical,
    h1s,
    h2s,
    wordCount: wc,
    images,
    imagesWithoutAlt: images.filter(i => !i.hasAlt || !i.alt.trim()),
    ogTitle,
    ogDesc,
    ogImage,
    hasJsonLd,
    hasNoindex,
    canonMismatch,
    indexable,
    inSitemap,
    excerpt,
    error: null,
  };
}

/* ────────────────────── Issue detector ────────────────── */
function detectIssues(page) {
  const issues = [];
  if (page.error) {
    issues.push({ id: 'fetch-error', label: `Fetch error: ${page.error}`, prio: 'high', cat: 'critical' });
    return issues;
  }
  if (page.status >= 400)
    issues.push({ id: 'http-error', label: `HTTP ${page.status}`, prio: 'high', cat: 'critical' });
  if (!page.title)
    issues.push({ id: 'miss-title', label: 'Missing <title>', prio: 'high', cat: 'critical' });
  else if (page.titleLength < 20)
    issues.push({ id: 'short-title', label: `Title too short (${page.titleLength} chars)`, prio: 'medium', cat: 'warning' });
  else if (page.titleLength > 60)
    issues.push({ id: 'long-title', label: `Title too long (${page.titleLength} chars)`, prio: 'medium', cat: 'warning' });

  if (!page.metaDesc)
    issues.push({ id: 'miss-meta', label: 'Missing meta description', prio: 'high', cat: 'critical' });
  else if (page.metaDescLength < 50)
    issues.push({ id: 'short-meta', label: `Meta description too short (${page.metaDescLength} chars)`, prio: 'medium', cat: 'warning' });
  else if (page.metaDescLength > 160)
    issues.push({ id: 'long-meta', label: `Meta description too long (${page.metaDescLength} chars)`, prio: 'medium', cat: 'warning' });

  if (page.hasNoindex)
    issues.push({ id: 'noindex', label: 'noindex directive present', prio: 'high', cat: 'critical' });
  if (page.canonMismatch)
    issues.push({ id: 'canon-mis', label: 'Canonical URL mismatch', prio: 'high', cat: 'critical' });

  if (page.h1s.length === 0)
    issues.push({ id: 'miss-h1', label: 'Missing H1', prio: 'medium', cat: 'warning' });
  else if (page.h1s.length > 1)
    issues.push({ id: 'multi-h1', label: `Multiple H1 tags (${page.h1s.length})`, prio: 'low', cat: 'info' });

  if (page.h2s.length === 0)
    issues.push({ id: 'miss-h2', label: 'No H2 headings', prio: 'low', cat: 'info' });

  if (page.wordCount > 0 && page.wordCount < 300)
    issues.push({ id: 'thin', label: `Thin content (${page.wordCount} words)`, prio: 'low', cat: 'info' });

  if (!page.inSitemap)
    issues.push({ id: 'no-sitemap', label: 'Not in sitemap.xml', prio: 'low', cat: 'info' });

  if (!page.ogTitle)
    issues.push({ id: 'miss-og-title', label: 'Missing og:title', prio: 'low', cat: 'info' });
  if (!page.ogDesc)
    issues.push({ id: 'miss-og-desc', label: 'Missing og:description', prio: 'low', cat: 'info' });
  if (!page.ogImage)
    issues.push({ id: 'miss-og-image', label: 'Missing og:image', prio: 'low', cat: 'info' });

  if (!page.hasJsonLd)
    issues.push({ id: 'miss-jsonld', label: 'No structured data (JSON-LD)', prio: 'low', cat: 'info' });

  if (page.imagesWithoutAlt.length > 0)
    issues.push({ id: 'img-alt', label: `${page.imagesWithoutAlt.length} image(s) missing alt text`, prio: 'medium', cat: 'warning' });

  return issues;
}

/* ────────────────────── Auto-fix generator ────────────── */
function slugToText(url) {
  try {
    const parts = new URL(url).pathname.split('/').filter(Boolean);
    const last = parts[parts.length - 1] || 'home';
    return last
      .replace(/\.[^.]+$/, '')
      .replace(/[-_+]/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\b\w/g, c => c.toUpperCase())
      .trim();
  } catch { return 'Page'; }
}

function generateFixes(page, issues) {
  const slug = slugToText(page.url);
  const h1 = page.h1s[0] || '';
  const baseKeyword = h1 || slug;
  const brand = 'PoliceStationRepUK';

  return issues.map(issue => {
    const fix = { issue: issue.label, priority: issue.prio, fixType: '', suggestion: '' };

    switch (issue.id) {
      case 'miss-title':
        fix.fixType = 'Add <title> tag';
        fix.suggestion = `${baseKeyword} | ${brand}`;
        break;
      case 'short-title':
        fix.fixType = 'Rewrite title (aim for 30–60 chars)';
        fix.suggestion = `${baseKeyword} — Free Directory | ${brand}`;
        break;
      case 'long-title':
        fix.fixType = 'Shorten title (aim for 30–60 chars)';
        fix.suggestion = page.title.slice(0, 57) + '…';
        break;
      case 'miss-meta':
        fix.fixType = 'Add meta description';
        if (page.excerpt && page.excerpt.length > 60) {
          fix.suggestion = page.excerpt.replace(/\s+/g, ' ').slice(0, 130).trim() + '. Find out more at PoliceStationRepUK.';
        } else {
          fix.suggestion = `${baseKeyword}. Free directory of accredited police station representatives across England & Wales. Find reps by county, station, or name.`;
        }
        if (fix.suggestion.length > 155) fix.suggestion = fix.suggestion.slice(0, 152) + '…';
        break;
      case 'short-meta':
        fix.fixType = 'Expand meta description (aim for 120–155 chars)';
        fix.suggestion = page.metaDesc + '. Free directory of police station reps across England & Wales. Find and instruct accredited representatives.';
        if (fix.suggestion.length > 155) fix.suggestion = fix.suggestion.slice(0, 152) + '…';
        break;
      case 'long-meta':
        fix.fixType = 'Shorten meta description (aim for 120–155 chars)';
        fix.suggestion = page.metaDesc.slice(0, 152) + '…';
        break;
      case 'noindex':
        fix.fixType = 'Remove noindex (unless intentional)';
        fix.suggestion = 'Change <meta name="robots" content="noindex"> to <meta name="robots" content="index, follow">';
        break;
      case 'canon-mis':
        fix.fixType = 'Fix canonical URL';
        fix.suggestion = `Set canonical to: ${page.url}\n<link rel="canonical" href="${page.url}" />`;
        break;
      case 'miss-h1':
        fix.fixType = 'Add H1 heading';
        fix.suggestion = page.title
          ? page.title.replace(/\s*[|–—-]\s*[^|–—-]+$/, '').trim()
          : baseKeyword;
        break;
      case 'multi-h1':
        fix.fixType = 'Reduce to one H1';
        fix.suggestion = `Keep "${page.h1s[0]}" as the only H1. Convert others to H2:\n${page.h1s.slice(1).map(h => `  - "${h}" → <h2>`).join('\n')}`;
        break;
      case 'miss-h2':
        fix.fixType = 'Add H2 subheadings';
        fix.suggestion = 'Break content into logical sections with H2 headings for better SEO and readability.';
        break;
      case 'thin':
        fix.fixType = 'Expand content (aim for 300+ words)';
        fix.suggestion = `Page has only ${page.wordCount} words. Add:\n  1. Expanded service/topic explanation (2–3 paragraphs)\n  2. FAQ section (3–5 questions)\n  3. Clear call-to-action`;
        break;
      case 'no-sitemap':
        fix.fixType = 'Add to sitemap.xml';
        fix.suggestion = `Add to app/sitemap.ts or lib/sitemap-paths.ts:\n  { url: '${page.url}', changeFrequency: 'weekly', priority: 0.7 }`;
        break;
      case 'miss-og-title':
        fix.fixType = 'Add og:title meta tag';
        fix.suggestion = page.title || baseKeyword;
        break;
      case 'miss-og-desc':
        fix.fixType = 'Add og:description meta tag';
        fix.suggestion = page.metaDesc || `${baseKeyword}. Free directory of police station reps.`;
        break;
      case 'miss-og-image':
        fix.fixType = 'Add og:image meta tag';
        fix.suggestion = `${origin}/social-preview.jpg`;
        break;
      case 'miss-jsonld':
        fix.fixType = 'Add structured data';
        fix.suggestion = 'Add JSON-LD schema (WebPage, BreadcrumbList, or FAQPage as appropriate).';
        break;
      case 'img-alt':
        fix.fixType = 'Add alt text to images';
        fix.suggestion = page.imagesWithoutAlt
          .slice(0, 5)
          .map(i => `  <img src="${i.src}" alt="[describe image]" />`)
          .join('\n') + (page.imagesWithoutAlt.length > 5 ? `\n  ... and ${page.imagesWithoutAlt.length - 5} more` : '');
        break;
      default:
        fix.fixType = 'Review manually';
        fix.suggestion = issue.label;
    }
    return fix;
  });
}

/* ────────────────────── Crawler ────────────────────── */
async function crawl() {
  console.log(`\n🔍 SEO Audit — ${SITE}`);
  console.log(`   Max pages: ${MAX_PAGES} | Concurrency: ${CONCURRENCY}\n`);

  // Step 1: fetch sitemap
  process.stdout.write('  Fetching sitemap.xml…');
  const sitemapUrls = await fetchSitemapUrls();
  console.log(` ${sitemapUrls.size} URLs found.\n`);

  // Step 2: crawl
  const queue = [SITE];
  const visited = new Set();
  const results = [];
  let inflight = 0;

  function dequeue() {
    return new Promise(resolve => {
      const interval = setInterval(() => {
        // Process queue
        while (inflight < CONCURRENCY && queue.length > 0 && visited.size < MAX_PAGES) {
          const url = queue.shift();
          const norm = url.replace(/\/$/, '') || origin;
          if (visited.has(norm)) continue;
          visited.add(norm);
          inflight++;

          (async () => {
            try {
              process.stdout.write(`\r  Crawling… ${visited.size} pages visited     `);
              const res = await get(norm);
              const page = analysePage(norm, res.body, res.status, sitemapUrls);
              results.push(page);

              // Extract and enqueue new links
              if (res.body && visited.size < MAX_PAGES) {
                const links = extractLinks(res.body, norm);
                for (const link of links) {
                  const ln = link.replace(/\/$/, '') || origin;
                  if (!visited.has(ln) && !queue.includes(ln)) {
                    queue.push(ln);
                  }
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
          })();
        }

        if (inflight === 0 && (queue.length === 0 || visited.size >= MAX_PAGES)) {
          clearInterval(interval);
          resolve();
        }
      }, 100);
    });
  }

  await dequeue();
  console.log(`\r  ✓ Crawled ${results.length} pages.                    \n`);
  return { results, sitemapUrls };
}

/* ────────────────────── Report: Markdown ────────────── */
function buildMarkdownReport(results) {
  const critPages = results.filter(p => detectIssues(p).some(i => i.prio === 'high'));
  const warnPages = results.filter(p => !detectIssues(p).some(i => i.prio === 'high') && detectIssues(p).some(i => i.prio === 'medium'));
  const okPages = results.filter(p => detectIssues(p).length === 0);
  const nonIdx = results.filter(p => !p.indexable && !p.error);
  const thin = results.filter(p => p.wordCount > 0 && p.wordCount < 300);

  const lines = [];
  lines.push(`# SEO Audit Report`);
  lines.push(`> ${SITE} — ${new Date().toISOString().slice(0, 10)}`);
  lines.push('');
  lines.push(`## Summary`);
  lines.push('');
  lines.push(`| Metric | Count |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Pages crawled | **${results.length}** |`);
  lines.push(`| 🔴 Critical issues | **${critPages.length}** |`);
  lines.push(`| 🟠 Warnings | **${warnPages.length}** |`);
  lines.push(`| ✅ No issues | **${okPages.length}** |`);
  lines.push(`| Non-indexable | **${nonIdx.length}** |`);
  lines.push(`| Thin content (<300 words) | **${thin.length}** |`);
  lines.push('');

  // Sort: critical first, then warnings, then info, then OK
  const sorted = [...results].sort((a, b) => {
    const pa = detectIssues(a);
    const pb = detectIssues(b);
    const scoreA = pa.some(i => i.prio === 'high') ? 0 : pa.some(i => i.prio === 'medium') ? 1 : pa.length > 0 ? 2 : 3;
    const scoreB = pb.some(i => i.prio === 'high') ? 0 : pb.some(i => i.prio === 'medium') ? 1 : pb.length > 0 ? 2 : 3;
    return scoreA - scoreB;
  });

  // Only show pages with issues
  const pagesWithIssues = sorted.filter(p => detectIssues(p).length > 0);

  if (pagesWithIssues.length === 0) {
    lines.push('## 🎉 No issues found!');
    lines.push('');
    return lines.join('\n');
  }

  lines.push(`---`);
  lines.push('');
  lines.push(`## Pages With Issues (${pagesWithIssues.length})`);
  lines.push('');

  for (const page of pagesWithIssues) {
    const issues = detectIssues(page);
    const fixes = generateFixes(page, issues);
    const prio = issues.some(i => i.prio === 'high') ? '🔴 HIGH' : issues.some(i => i.prio === 'medium') ? '🟠 MEDIUM' : '🔵 LOW';
    const shortUrl = page.url.replace(origin, '') || '/';

    lines.push(`### ${prio} — \`${shortUrl}\``);
    lines.push('');

    // Page data
    lines.push(`| Field | Value |`);
    lines.push(`|-------|-------|`);
    lines.push(`| Title | ${page.title ? `\`${page.title}\` (${page.titleLength} chars)` : '❌ Missing'} |`);
    lines.push(`| Meta description | ${page.metaDesc ? `\`${page.metaDesc.slice(0, 80)}${page.metaDesc.length > 80 ? '…' : ''}\` (${page.metaDescLength} chars)` : '❌ Missing'} |`);
    lines.push(`| H1 | ${page.h1s.length > 0 ? `\`${page.h1s[0]}\`${page.h1s.length > 1 ? ` ⚠ +${page.h1s.length - 1} more` : ''}` : '❌ Missing'} |`);
    lines.push(`| Word count | ${page.wordCount} ${page.wordCount < 300 ? '⚠ thin' : '✓'} |`);
    lines.push(`| Indexable | ${page.indexable ? '✅ Yes' : '❌ No'} |`);
    lines.push(`| In sitemap | ${page.inSitemap ? '✅' : '❌'} |`);
    lines.push(`| JSON-LD | ${page.hasJsonLd ? '✅' : '❌'} |`);
    lines.push(`| og:image | ${page.ogImage ? '✅' : '❌'} |`);
    lines.push('');

    // Fixes
    lines.push('**Fixes:**');
    lines.push('');
    for (const fix of fixes) {
      const icon = fix.priority === 'high' ? '🔴' : fix.priority === 'medium' ? '🟠' : '🔵';
      lines.push(`${icon} **${fix.fixType}**`);
      lines.push('');
      lines.push('```');
      lines.push(fix.suggestion);
      lines.push('```');
      lines.push('');
    }
    lines.push('---');
    lines.push('');
  }

  // Pages OK section
  if (okPages.length > 0) {
    lines.push(`## ✅ Pages With No Issues (${okPages.length})`);
    lines.push('');
    for (const p of okPages) {
      lines.push(`- \`${p.url.replace(origin, '') || '/'}\` — ${p.wordCount} words, ${p.titleLength} char title`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/* ────────────────────── Report: JSON ────────────────── */
function buildJsonReport(results) {
  return results.map(page => {
    const issues = detectIssues(page);
    const fixes = generateFixes(page, issues);
    return {
      url: page.url,
      path: page.url.replace(origin, '') || '/',
      status: page.status,
      indexable: page.indexable,
      inSitemap: page.inSitemap,
      title: { value: page.title, length: page.titleLength },
      metaDescription: { value: page.metaDesc, length: page.metaDescLength },
      h1: page.h1s[0] || null,
      h1Count: page.h1s.length,
      wordCount: page.wordCount,
      ogTitle: page.ogTitle || null,
      ogDescription: page.ogDesc || null,
      ogImage: page.ogImage || null,
      hasJsonLd: page.hasJsonLd,
      canonical: page.canonical || null,
      issues: issues.map(i => ({ label: i.label, priority: i.prio, category: i.cat })),
      fixes: fixes.map(f => ({ issue: f.issue, fixType: f.fixType, suggestion: f.suggestion, priority: f.priority })),
      error: page.error,
    };
  });
}

/* ────────────────────── Main ────────────────────── */
async function main() {
  const { results } = await crawl();

  mkdirSync(OUT_DIR, { recursive: true });

  const mdPath = join(OUT_DIR, 'seo-report.md');
  const jsonPath = join(OUT_DIR, 'seo-report.json');

  writeFileSync(mdPath, buildMarkdownReport(results), 'utf-8');
  writeFileSync(jsonPath, JSON.stringify(buildJsonReport(results), null, 2), 'utf-8');

  // Print summary
  const allIssues = results.flatMap(p => detectIssues(p));
  const crit = allIssues.filter(i => i.prio === 'high').length;
  const warn = allIssues.filter(i => i.prio === 'medium').length;
  const info = allIssues.filter(i => i.prio === 'low').length;

  console.log('  ┌─────────────────────────────────────────┐');
  console.log(`  │  Pages:    ${String(results.length).padStart(4)}                          │`);
  console.log(`  │  Critical: ${String(crit).padStart(4)} 🔴                        │`);
  console.log(`  │  Warnings: ${String(warn).padStart(4)} 🟠                        │`);
  console.log(`  │  Info:     ${String(info).padStart(4)} 🔵                        │`);
  console.log('  └─────────────────────────────────────────┘');
  console.log('');
  console.log(`  📄 ${mdPath}`);
  console.log(`  📊 ${jsonPath}`);
  console.log('');
  console.log('  To auto-fix issues, open the report in Cursor and ask:');
  console.log('  "Read audit/seo-report.md and fix every issue listed"');
  console.log('');
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
