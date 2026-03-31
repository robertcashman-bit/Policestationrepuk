#!/usr/bin/env node
/**
 * enrich-station-coverage.mjs
 *
 * For reps with empty station arrays, suggests stations in their county
 * based on forceName matching.  Run with --write to patch scraped-reps.json
 * in-place, or without flags for a dry-run report.
 *
 * Usage:
 *   node scripts/enrich-station-coverage.mjs          # dry-run
 *   node scripts/enrich-station-coverage.mjs --write   # apply changes
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');

function readJson(name) {
  const p = path.join(DATA_DIR, name);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

const FORCE_TO_COUNTY = {
  'kent police': 'kent',
  'metropolitan police': 'london',
  'west midlands police': 'west midlands',
  'west yorkshire police': 'west yorkshire',
  'south yorkshire police': 'south yorkshire',
  'greater manchester police': 'greater manchester',
  'lancashire constabulary': 'lancashire',
  'cheshire constabulary': 'cheshire',
  'essex police': 'essex',
  'hampshire constabulary': 'hampshire',
  'surrey police': 'surrey',
  'sussex police': 'sussex',
  'norfolk constabulary': 'norfolk',
  'suffolk constabulary': 'suffolk',
  'leicestershire police': 'leicestershire',
  'northamptonshire police': 'northamptonshire',
  'bedfordshire police': 'bedfordshire',
  'hertfordshire constabulary': 'hertfordshire',
  'staffordshire police': 'staffordshire',
  'nottinghamshire police': 'nottinghamshire',
  'lincolnshire police': 'lincolnshire',
  'devon & cornwall police': 'devon',
  'gloucestershire constabulary': 'gloucestershire',
  'merseyside police': 'merseyside',
  'northumbria police': 'northumberland',
  'durham constabulary': 'county durham',
  'thames valley police': 'berkshire',
};

function countyForStation(station) {
  if (station.county) return station.county.toLowerCase().trim();
  const force = (station.forceName || '').toLowerCase().trim();
  return FORCE_TO_COUNTY[force] || '';
}

function run() {
  const doWrite = process.argv.includes('--write');

  const stations = readJson('stations.json') || [];
  const scrapedReps = readJson('scraped-reps.json');
  const fallbackReps = readJson('reps.json') || [];

  const reps = Array.isArray(scrapedReps) ? scrapedReps : fallbackReps;
  const source = Array.isArray(scrapedReps) ? 'scraped-reps.json' : 'reps.json';

  console.log(`Loaded ${stations.length} stations, ${reps.length} reps from ${source}\n`);

  let enriched = 0;
  let skipped = 0;

  for (const rep of reps) {
    const repStations = rep.stations || rep.stationsCovered || [];
    if (repStations.length > 0) {
      skipped++;
      continue;
    }

    const repCounty = (rep.county || rep.addressCounty || '').toLowerCase().trim();
    if (!repCounty) {
      console.log(`  SKIP  ${rep.name || rep.slug} — no county`);
      continue;
    }

    const matches = stations.filter((s) => {
      const sc = countyForStation(s);
      return sc === repCounty || sc.includes(repCounty) || repCounty.includes(sc);
    });

    if (matches.length === 0) {
      console.log(`  SKIP  ${rep.name || rep.slug} — no stations match county "${repCounty}"`);
      continue;
    }

    const stationNames = matches.map((s) => s.name).slice(0, 20);
    console.log(`  ENRICH  ${rep.name || rep.slug} (${repCounty}) → ${stationNames.length} stations`);

    if (doWrite) {
      rep.stations = stationNames;
    }
    enriched++;
  }

  console.log(`\nSummary: ${enriched} reps enriched, ${skipped} already had stations`);

  if (doWrite && enriched > 0) {
    const outPath = path.join(DATA_DIR, source);
    fs.writeFileSync(outPath, JSON.stringify(reps, null, 2) + '\n');
    console.log(`Written to ${outPath}`);
  } else if (!doWrite && enriched > 0) {
    console.log('Dry run — re-run with --write to apply changes.');
  }
}

run();
