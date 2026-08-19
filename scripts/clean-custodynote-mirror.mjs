#!/usr/bin/env node
/**
 * Remove stale CustodyNote mirror page and refresh embedded promo copy in crawl data.
 * The live /CustodyNote route is served by app/CustodyNote/page.tsx — mirror entry is obsolete.
 * Commercial line must match custodynote.com: free during beta, no credit card, no trial/discount codes.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const REPLACEMENTS = [
  // Brand in prose only — never rewrite /CustodyNote paths or route ids.
  [/(?<!\/)CustodyNote(?![\w/])/g, 'Custody Note'],
  [/Version 1\.4\.\d+/g, 'Version 1.9.11'],
  [/Windows 10\+ · From £15\.99\/mo/g, 'Windows 10+ and macOS 11+ · Free during beta'],
  [/From £15\.99\/mo/g, 'Free during beta'],
  [/From £11\.99\/mo/g, 'Free during beta'],
  [/£11\.99\/mo/g, 'free during beta'],
  [/£15\.99\/mo/g, 'free during beta'],
  [/No credit card for trial · Windows 10\+ ·/g, 'No credit card required · Windows 10+ and macOS 11+ ·'],
  [/No credit card for trial/gi, 'No credit card required'],
  [/in one Windows app/g, 'on Windows and Mac'],
  [/one Windows app/g, 'Windows and Mac desktop apps'],
  [/Custody Note Anywhere[^\n]*/gi, 'Custody Note for Windows PC and Mac — download at custodynote.com/download'],
  [/custodynote-anywhere/gi, 'custodynote.com/download'],
  [/Windows only/gi, 'Windows PC and Mac'],
  [/one Windows app/gi, 'Windows PC and Mac desktop apps'],
  [
    /try Custody Note free for 30 days PSR UK readers £11\.99\/mo · code A2MJY2NQ/gi,
    'download Custody Note free during beta — no credit card required',
  ],
  [
    /Custody Note — The app for freelance reps30-day free trial · From £15\.99\/mo · Use code A2MJY2NQ for 25% off/gi,
    'Custody Note — structured attendance notes for Windows PC & Mac · Free during beta · No credit card',
  ],
  [
    /🎁 Exclusive for PSR UK members — 25% off your subscriptionEnter code A2MJY2NQ at checkout on custodynote\.com/gi,
    'Free during beta — no credit card required. Download at custodynote.com/download',
  ],
  [
    /🎁 Exclusive for PSR UK members — 25% offEnter code A2MJY2NQ at checkout on custodynote\.com/gi,
    'Free during beta — no credit card required. Download at custodynote.com/download',
  ],
  [
    /🎁 PSR UK exclusive: 25% off with code A2MJY2NQ/gi,
    'Free during beta — no credit card required',
  ],
  [
    /Write structured PACE custody notes in 3 minutes — try Custody Note free for 30 days/gi,
    'Structured custody attendance notes for criminal defence work — free during beta on core features',
  ],
  [/Start 30-Day Free Trial/gi, 'Download free'],
  [/Start Free Trial/gi, 'Download free'],
  [/30-Day Free Trial/gi, 'Free during beta'],
  [/30-day free trial/gi, 'free during beta'],
  [/free 30-day trial/gi, 'free during beta on core features'],
  [/Try Free/g, 'Download free'],
  [/Enter code A2MJY2NQ[^.]*\.?/gi, ''],
  [/code A2MJY2NQ/gi, ''],
  [/A2MJY2NQ/g, ''],
  [/PSR UK readers ~?£7\.99\/mo[^.]*\.?/gi, ''],
  [/After beta, PSR UK readers[^.]*\.?/gi, ''],
  [/Cancel any time/gi, 'No credit card required'],
  [/Subscription only · /gi, ''],
];

const DEDICATED_MIRROR_PATHS = new Set(['/CustodyNote', '/custodynote']);

function applyReplacements(text) {
  if (!text || typeof text !== 'string') return text;
  let out = text;
  for (const [pattern, replacement] of REPLACEMENTS) {
    out = out.replace(pattern, replacement);
  }
  return out.replace(/ {2,}/g, ' ').replace(/ · · /g, ' · ').replace(/··+/g, '·');
}

function deepClean(value) {
  if (typeof value === 'string') return applyReplacements(value);
  if (Array.isArray(value)) return value.map(deepClean);
  if (value && typeof value === 'object') {
    const next = {};
    for (const [k, v] of Object.entries(value)) {
      next[k] = deepClean(v);
    }
    return next;
  }
  return value;
}

function cleanPagesJson() {
  const file = path.join(ROOT, 'data', 'pages.json');
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  const before = raw.pages.length;
  raw.pages = raw.pages
    .filter((p) => !DEDICATED_MIRROR_PATHS.has(p.path))
    .map((p) => deepClean(p));
  raw.count = raw.pages.length;
  fs.writeFileSync(file, JSON.stringify(raw));
  console.log(`pages.json: removed ${before - raw.count} CustodyNote mirror page(s); ${raw.count} pages remain`);
}

function cleanPageContentJson() {
  const file = path.join(ROOT, 'data', 'page-content.json');
  if (!fs.existsSync(file)) return;
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  const before = raw.pages?.length ?? 0;
  if (Array.isArray(raw.pages)) {
    raw.pages = raw.pages
      .filter((p) => !DEDICATED_MIRROR_PATHS.has(p.path))
      .map((p) => deepClean(p));
    raw.count = raw.pages.length;
  } else {
    Object.assign(raw, deepClean(raw));
  }
  fs.writeFileSync(file, JSON.stringify(raw, null, 2) + '\n');
  console.log(`page-content.json: cleaned (${before} pages before filter)`);
}

function removeCrawlCustodyNote() {
  const file = path.join(ROOT, 'content', 'crawl', 'CustodyNote.json');
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
    console.log('Removed content/crawl/CustodyNote.json (obsolete mirror)');
  }
}

function cleanCrawlPagesJson() {
  const file = path.join(ROOT, 'data', 'crawl-pages.json');
  if (!fs.existsSync(file)) return;
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (Array.isArray(raw)) {
    const before = raw.length;
    const cleaned = raw
      .filter((p) => !DEDICATED_MIRROR_PATHS.has(p.path))
      .map((p) => deepClean(p));
    fs.writeFileSync(file, JSON.stringify(cleaned, null, 2) + '\n');
    console.log(`crawl-pages.json: removed ${before - cleaned.length} mirror page(s); cleaned ${cleaned.length}`);
    return;
  }
  if (Array.isArray(raw.pages)) {
    const before = raw.pages.length;
    raw.pages = raw.pages
      .filter((p) => !DEDICATED_MIRROR_PATHS.has(p.path))
      .map((p) => deepClean(p));
    raw.count = raw.pages.length;
    fs.writeFileSync(file, JSON.stringify(raw, null, 2) + '\n');
    console.log(`crawl-pages.json: removed ${before - raw.pages.length} mirror page(s)`);
  }
}

function cleanMissingPagesJson() {
  const file = path.join(ROOT, 'data', 'missing-pages.json');
  if (!fs.existsSync(file)) return;
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  const cleaned = deepClean(raw);
  fs.writeFileSync(file, JSON.stringify(cleaned, null, 2) + '\n');
  console.log('missing-pages.json: cleaned');
}

function cleanCrawlContentDir() {
  const dir = path.join(ROOT, 'content', 'crawl');
  if (!fs.existsSync(dir)) return;
  let n = 0;
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith('.json')) continue;
    const file = path.join(dir, name);
    const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
    const cleaned = deepClean(raw);
    fs.writeFileSync(file, JSON.stringify(cleaned, null, 2) + '\n');
    n += 1;
  }
  console.log(`content/crawl: cleaned ${n} JSON file(s)`);
}

cleanPagesJson();
cleanPageContentJson();
cleanCrawlPagesJson();
cleanMissingPagesJson();
cleanCrawlContentDir();
removeCrawlCustodyNote();
console.log('Done.');
