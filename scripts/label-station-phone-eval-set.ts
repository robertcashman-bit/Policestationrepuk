/**
 * Label data/evaluation/station-phone-eval-set.json from official seeds + stations.json.
 * Does not invent phone numbers.
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { isGenericCustodyNumber } from '../lib/custody-discovery/generic-numbers';
import { normalizePhoneDigits } from '../lib/phone-format';

const ROOT = process.cwd();
const evalPath = join(ROOT, 'data/evaluation/station-phone-eval-set.json');
const stations = JSON.parse(readFileSync(join(ROOT, 'data/stations.json'), 'utf8')) as Array<{
  id: string;
  slug: string;
  name: string;
  forceName?: string;
  phone?: string;
  custodyPhone?: string;
  status?: string;
  isCustodyStation?: boolean;
}>;
const byId = new Map(stations.map((s) => [s.id, s]));
const bySlug = new Map(stations.map((s) => [s.slug, s]));

const seedPhones = new Map<string, { phone: string; source: string; suiteName?: string }>();
for (const name of readdirSync(join(ROOT, 'data'))) {
  if (!name.endsWith('-custody-numbers.json')) continue;
  const file = JSON.parse(readFileSync(join(ROOT, 'data', name), 'utf8')) as {
    source?: string;
    stations: Record<string, { custodyPhone?: string; sourceUrl?: string; suiteName?: string }>;
  };
  if (/policestationreps/i.test(file.source || '')) continue;
  for (const [key, entry] of Object.entries(file.stations)) {
    if (!entry.custodyPhone) continue;
    if (entry.sourceUrl && /policestationreps/i.test(entry.sourceUrl)) continue;
    seedPhones.set(key, {
      phone: entry.custodyPhone,
      source: entry.sourceUrl || file.source || '',
      suiteName: entry.suiteName,
    });
  }
}

const HQ_HINT = /headquarters|hq\b|force headquarters/i;
const evalSet = JSON.parse(readFileSync(evalPath, 'utf8')) as {
  stations: Array<{
    id: string;
    slug: string;
    name: string;
    forceName: string;
    isCustodyStation?: boolean;
    expected: { outcome: string; notes?: string; phone?: string };
  }>;
  labelledAt?: string;
  labelProtocol?: string;
};

for (const row of evalSet.stations) {
  const st = byId.get(row.id) || bySlug.get(row.slug);
  const seed = seedPhones.get(row.slug) || seedPhones.get(row.id);

  if (st?.status === 'closed' || /closed/i.test(row.name)) {
    row.expected = { outcome: 'station_closed', notes: 'Station marked closed.' };
    continue;
  }

  if (seed?.phone) {
    row.expected = {
      outcome: 'direct_custody',
      phone: seed.phone,
      notes: `Official seed ${seed.source}${seed.suiteName ? ` (${seed.suiteName})` : ''}`,
    };
    continue;
  }

  if (HQ_HINT.test(row.name) || HQ_HINT.test(row.slug)) {
    row.expected = {
      outcome: 'force_switchboard_only',
      notes: 'Force HQ — expect 101 / force switchboard only as station-specific desk line.',
    };
    continue;
  }

  const custody = st?.custodyPhone?.trim();
  const phone = st?.phone?.trim();
  const candidate = custody || phone;
  if (
    candidate &&
    normalizePhoneDigits(candidate) !== '101' &&
    !isGenericCustodyNumber(candidate, row.forceName)
  ) {
    row.expected = {
      outcome: row.isCustodyStation || st?.isCustodyStation ? 'direct_custody' : 'direct_station',
      phone: candidate,
      notes: 'From stations.json dialable non-generic phone.',
    };
    continue;
  }

  row.expected = {
    outcome: 'force_switchboard_only',
    notes: 'No station-specific public number in official seeds / non-generic directory phones.',
  };
}

evalSet.labelledAt = new Date().toISOString();
evalSet.labelProtocol =
  'Official custody JSON (non-PSR) + stations.json non-generic phones + HQ → force_switchboard_only.';
writeFileSync(evalPath, JSON.stringify(evalSet, null, 2) + '\n');

const outcomes: Record<string, number> = {};
for (const s of evalSet.stations) {
  outcomes[s.expected.outcome] = (outcomes[s.expected.outcome] || 0) + 1;
}
console.log(
  JSON.stringify(
    {
      labelled: evalSet.stations.length,
      withPhone: evalSet.stations.filter((s) => s.expected.phone).length,
      outcomes,
    },
    null,
    2,
  ),
);
