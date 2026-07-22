/**
 * Clear unverified station main phones (Long Eaton failure mode).
 *
 * Dry-run: npx tsx scripts/clear-unverified-main-phones.ts
 * Apply:   npx tsx scripts/clear-unverified-main-phones.ts --write
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { PoliceStation } from '../lib/types';
import {
  applyStationVerificationMeta,
  loadStationVerification,
  saveStationVerification,
  stationVerificationKey,
} from '../lib/station-verification';
import { getPublishedPhoneValue } from '../lib/station-contacts/publish';
import { isDialablePhone } from '../lib/station-phone-dialable';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const STATIONS_PATH = resolve(ROOT, 'data/stations.json');
const BASE44_PATH = resolve(ROOT, 'data/stations-base44-raw.json');
const BASE44_STATION_PATH = resolve(ROOT, 'data/base44-raw/Station.json');
const REPORT_PATH = resolve(ROOT, 'data/reports/clear-unverified-main-phones.json');
const WRITE = process.argv.includes('--write');

const stations = JSON.parse(readFileSync(STATIONS_PATH, 'utf-8')) as PoliceStation[];
const verification = loadStationVerification();
const withMeta = applyStationVerificationMeta(stations, verification);

const cleared: Array<{ id: string; name: string; slug?: string; force?: string; phone: string }> = [];
const keptPublished: Array<{ name: string; phone: string }> = [];

for (let i = 0; i < stations.length; i++) {
  const metaStation = withMeta[i];
  const raw = (stations[i].phone || '').trim();
  if (!raw || !isDialablePhone(raw)) continue;

  const published = getPublishedPhoneValue(metaStation, 'phone');
  if (published) {
    if (keptPublished.length < 20) keptPublished.push({ name: stations[i].name, phone: raw });
    continue;
  }

  cleared.push({
    id: stations[i].id,
    name: stations[i].name,
    slug: stations[i].slug,
    force: stations[i].forceName,
    phone: raw,
  });
  if (WRITE) stations[i].phone = '';
}

const clearedIds = new Set(cleared.map((c) => c.id));
const clearedDigits = new Set(
  cleared.map((c) => c.phone.replace(/\D/g, '')).filter((d) => d.length >= 10),
);

function scrubBase44(path: string): number {
  if (!WRITE) return 0;
  let data: Array<Record<string, unknown>>;
  try {
    data = JSON.parse(readFileSync(path, 'utf-8'));
  } catch {
    return 0;
  }
  let n = 0;
  for (const row of data) {
    const id = String(row.id || '');
    const phone = String(row.phone || '');
    const digits = phone.replace(/\D/g, '');
    if (clearedIds.has(id) || (digits.length >= 10 && clearedDigits.has(digits))) {
      if (phone.trim()) {
        row.phone = '';
        n++;
      }
    }
  }
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
  return n;
}

const report = {
  generatedAt: new Date().toISOString(),
  mode: WRITE ? 'write' : 'dry-run',
  clearedCount: cleared.length,
  keptPublishedCount: stations.filter((s) => (s.phone || '').trim()).length - (WRITE ? 0 : cleared.length),
  samples: cleared.slice(0, 40),
  keptPublishedSamples: keptPublished,
};

if (WRITE) {
  writeFileSync(STATIONS_PATH, JSON.stringify(stations, null, 2) + '\n');
  report.base44RawCleared = scrubBase44(BASE44_PATH);
  report.base44StationCleared = scrubBase44(BASE44_STATION_PATH);
  // Mark verification fields so we don't re-promote without evidence
  for (const c of cleared) {
    const key = stationVerificationKey(
      stations.find((s) => s.id === c.id) || ({ id: c.id, stationId: c.id } as PoliceStation),
    );
    const existing = verification[key] || { fields: {} };
    verification[key] = {
      ...existing,
      fields: {
        ...existing.fields,
        phone: {
          status: 'not_publicly_listed',
          dateVerified: new Date().toISOString().slice(0, 10),
          notes: `Cleared ${c.phone} — unverified legacy main line (Long Eaton-class risk). Use 101 until official source confirmed.`,
        },
      },
      verificationStatus: existing.verificationStatus === 'verified' ? 'partial' : 'unverified',
      dateVerified: new Date().toISOString().slice(0, 10),
    };
  }
  saveStationVerification(verification);
}

mkdirSync(resolve(ROOT, 'data/reports'), { recursive: true });
writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ ...report, samples: report.samples.slice(0, 12) }, null, 2));
console.log(`Report: ${REPORT_PATH}`);
if (!WRITE) console.log('Dry-run. Re-run with --write to clear unverified main phones.');
