/**
 * Cursor-based PSR harvest — write force JSON seeds for the verify cron.
 *
 * Usage:
 *   npx tsx scripts/fetch-psr-custody-numbers.ts --force="Kent Police" --limit=40
 *   npx tsx scripts/fetch-psr-custody-numbers.ts --write --limit=80
 *
 * Polite ~1 req/sec. Does not publish — only writes candidate JSON under data/.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getAllStations } from '../lib/data';
import { isCustodyStation } from '../lib/custody-station';
import { formatPhoneUk, normalizePhoneDigits } from '../lib/phone-format';
import {
  isTrustworthyPsrCustodyCandidate,
  parseRepDirectoryStationHtml,
  repDirectoryUrlCandidates,
} from '../lib/rep-directory-parse';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const WRITE = process.argv.includes('--write');
const forceArg = process.argv.find((a) => a.startsWith('--force='));
const FORCE_FILTER = forceArg?.split('=')[1]?.trim();
const LIMIT = Number(process.argv.find((a) => a.startsWith('--limit='))?.split('=')[1] || '60');
const DELAY_MS = 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function forceSlug(forceName: string): string {
  return forceName
    .toLowerCase()
    .replace(/\s+police$/i, '')
    .replace(/\s+constabulary$/i, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'PoliceStationRepUK-PsrHarvest/1.0 (+https://policestationrepuk.org)',
        Accept: 'text/html',
      },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

async function main() {
  const stations = (await getAllStations()).filter((s) => {
    const force = s.forceName || '';
    if (FORCE_FILTER && force !== FORCE_FILTER && !force.includes(FORCE_FILTER)) {
      return false;
    }
    return isCustodyStation(s) || Boolean(s.custodyPhone);
  });

  const byForce = new Map<string, typeof stations>();
  for (const s of stations) {
    const f = s.forceName || 'Unknown';
    if (!byForce.has(f)) byForce.set(f, []);
    byForce.get(f)!.push(s);
  }

  let fetched = 0;
  let found = 0;
  const report: Array<{ slug: string; force: string; phone?: string; url?: string; status: string }> =
    [];

  for (const [force, list] of [...byForce.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    if (fetched >= LIMIT) break;
    const stationsOut: Record<
      string,
      { custodyPhone: string; psrUrl: string; suiteName?: string }
    > = {};

    for (const station of list) {
      if (fetched >= LIMIT) break;
      const urls = repDirectoryUrlCandidates(station.slug, station.name);
      let hit: { phone: string; url: string } | null = null;
      for (const url of urls.slice(0, 3)) {
        await sleep(DELAY_MS);
        fetched++;
        const html = await fetchHtml(url);
        if (!html) continue;
        const parsed = parseRepDirectoryStationHtml(html, url);
        if (!isTrustworthyPsrCustodyCandidate(parsed) || !parsed.custodyPhone) continue;
        const norm = normalizePhoneDigits(parsed.custodyPhone);
        if (!norm || norm === '101') continue;
        hit = {
          phone: formatPhoneUk(parsed.custodyPhone) ?? parsed.custodyPhone,
          url,
        };
        break;
      }

      if (!hit) {
        report.push({ slug: station.slug, force, status: 'no_psr' });
        continue;
      }

      found++;
      stationsOut[station.slug] = {
        custodyPhone: hit.phone,
        psrUrl: hit.url,
        suiteName: station.name,
      };
      report.push({
        slug: station.slug,
        force,
        phone: hit.phone,
        url: hit.url,
        status: 'candidate',
      });
    }

    if (WRITE && Object.keys(stationsOut).length > 0) {
      const slug = forceSlug(force);
      const outPath = resolve(ROOT, `data/${slug}-psr-custody-numbers.json`);
      let existing: {
        stations?: Record<string, { custodyPhone: string; psrUrl?: string; suiteName?: string }>;
      } = {};
      try {
        existing = JSON.parse(readFileSync(outPath, 'utf-8')) as typeof existing;
      } catch {
        /* new file */
      }
      const merged = { ...(existing.stations ?? {}), ...stationsOut };
      writeFileSync(
        outPath,
        JSON.stringify(
          {
            _comment: `PSR custody candidates for ${force}. Verify via custody-psr-verify cron before publish.`,
            source: 'https://www.policestationreps.com/',
            verifiedAt: new Date().toISOString().slice(0, 10),
            stations: merged,
          },
          null,
          2,
        ) + '\n',
      );
      console.log(`Wrote ${Object.keys(stationsOut).length} candidates → ${outPath}`);
    }
  }

  mkdirSync(resolve(ROOT, 'data/reports'), { recursive: true });
  const reportPath = resolve(ROOT, 'data/reports/psr-harvest.json');
  writeFileSync(
    reportPath,
    JSON.stringify(
      {
        at: new Date().toISOString(),
        write: WRITE,
        fetched,
        found,
        report,
      },
      null,
      2,
    ) + '\n',
  );
  console.log(`PSR harvest: fetched=${fetched} candidates=${found} report=${reportPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
