/**
 * Generic Playwright fetch for Cloudflare-protected force custody pages.
 *
 * Usage:
 *   npx playwright install chromium
 *   npx tsx scripts/fetch-force-custody-generic.ts --force=west-midlands [--write]
 *   npx tsx scripts/fetch-force-custody-generic.ts --force=essex --write
 *
 * Writes data/<force>-custody-numbers.json when phones + suite names can be
 * parsed from the official page. Does not invent numbers.
 */
import { mkdirSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';
import { FORCE_CUSTODY_PAGES } from '../lib/custody-discovery/official-pages';
import { extractPhonesFromText } from '../lib/custody-discovery/phone';
import { htmlToSearchableText } from '../lib/custody-discovery/html-text';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const WRITE = process.argv.includes('--write');
const forceArg = process.argv.find((a) => a.startsWith('--force='))?.split('=')[1];

const FORCE_KEYS: Record<string, string> = {
  'west-midlands': 'west midlands police',
  essex: 'essex police',
  hampshire: 'hampshire constabulary',
  'south-wales': 'south wales police',
  'north-wales': 'north wales police',
  gmp: 'greater manchester police',
  'greater-manchester': 'greater manchester police',
  surrey: 'surrey police',
  sussex: 'sussex police',
};

async function fetchHtml(url: string): Promise<string | null> {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-GB,en;q=0.9' });
    const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await page.waitForTimeout(5000);
    let title = await page.title();
    if (/just a moment|cloudflare/i.test(title)) {
      await page.waitForTimeout(10_000);
      title = await page.title();
    }
    const html = await page.content();
    if (/just a moment/i.test(title) && html.length < 20_000) {
      console.error(JSON.stringify({ ok: false, url, title, reason: 'cloudflare_blocked' }));
      return null;
    }
    if (!res?.ok() && !/custody|police|telephone/i.test(html)) return null;
    return html;
  } finally {
    await browser.close();
  }
}

/**
 * Heuristic: lines that look like "Suite Name … 01234 567890".
 * Only emits rows when both a name-like token and a phone appear nearby.
 */
function parseCustodyRows(
  text: string,
  sourceUrl: string,
): Array<{ suiteName: string; custodyPhone: string; sourceUrl: string }> {
  const rows: Array<{ suiteName: string; custodyPhone: string; sourceUrl: string }> = [];
  const lines = text
    .split(/\n+/)
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter((l) => l.length > 8 && l.length < 240);

  for (const line of lines) {
    if (!/custody|suite|police station|justice/i.test(line)) continue;
    const phones = extractPhonesFromText(line, 40);
    if (phones.length !== 1) continue;
    const phone = phones[0]!;
    const name = line
      .replace(phone, ' ')
      .replace(/telephone|phone|tel\.?:?/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (name.length < 4 || name.length > 80) continue;
    if (/^click|^read more|^cookie/i.test(name)) continue;
    rows.push({ suiteName: name, custodyPhone: phone, sourceUrl });
  }

  // Deduplicate by phone+name
  const seen = new Set<string>();
  return rows.filter((r) => {
    const k = `${r.custodyPhone}|${r.suiteName.toLowerCase()}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

async function main() {
  if (!forceArg || !FORCE_KEYS[forceArg]) {
    console.error(
      `Usage: npx tsx scripts/fetch-force-custody-generic.ts --force=<${Object.keys(FORCE_KEYS).join('|')}> [--write]`,
    );
    process.exit(1);
  }

  const forceKey = FORCE_KEYS[forceArg]!;
  const urls = FORCE_CUSTODY_PAGES[forceKey] ?? [];
  if (urls.length === 0) {
    console.error(JSON.stringify({ ok: false, reason: 'no_urls', force: forceKey }));
    process.exit(1);
  }

  const allRows: Array<{ suiteName: string; custodyPhone: string; sourceUrl: string }> = [];
  for (const url of urls) {
    const html = await fetchHtml(url);
    if (!html) continue;
    const text = htmlToSearchableText(html);
    allRows.push(...parseCustodyRows(text, url));
  }

  const stations: Record<
    string,
    { custodyPhone: string; suiteName: string; sourceUrl: string }
  > = {};
  for (const row of allRows) {
    const slug = slugify(row.suiteName);
    if (!slug) continue;
    stations[slug] = {
      custodyPhone: row.custodyPhone,
      suiteName: row.suiteName,
      sourceUrl: row.sourceUrl,
    };
  }

  const out = {
    _comment: `Custody numbers scraped via Playwright from official ${forceKey} pages. Do not invent.`,
    source: urls[0],
    verifiedAt: new Date().toISOString().slice(0, 10),
    stations,
  };

  const reportDir = resolve(ROOT, 'data/reports');
  mkdirSync(reportDir, { recursive: true });
  const reportPath = resolve(reportDir, `${forceArg}-custody-fetch.json`);
  writeFileSync(
    reportPath,
    JSON.stringify(
      {
        force: forceKey,
        urls,
        rowCount: allRows.length,
        stationKeys: Object.keys(stations).length,
        sample: allRows.slice(0, 10),
        at: new Date().toISOString(),
      },
      null,
      2,
    ),
  );

  if (WRITE && Object.keys(stations).length > 0) {
    const outPath = resolve(ROOT, `data/${forceArg}-custody-numbers.json`);
    writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n');
    console.log(JSON.stringify({ ok: true, wrote: outPath, stations: Object.keys(stations).length, reportPath }));
  } else {
    console.log(
      JSON.stringify({
        ok: true,
        wrote: false,
        stations: Object.keys(stations).length,
        sample: Object.entries(stations).slice(0, 8),
        reportPath,
        hint: Object.keys(stations).length === 0 ? 'No parseable rows — page may list 101 only or use JS widgets' : 'Pass --write to save',
      }),
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
