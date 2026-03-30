import type { Representative, PoliceStation } from '../lib/types';
import {
  buildCountyCanonicalMap,
  representativeToSearchRow,
  searchDirectory,
  normalize,
  extractUkPostcodeNorm,
} from '../lib/directory-search-engine';

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const counties = [
  { name: "Essex", slug: "essex" },
  { name: "Kent", slug: "kent" },
  { name: "London", slug: "london" },
];
const map = buildCountyCanonicalMap(counties.map((c) => c.name));

const mockStations: PoliceStation[] = [
  {
    id: 'st1',
    slug: 'chelmsford',
    name: 'Chelmsford Police Station',
    address: 'Chelmsford CM1 1AA',
    postcode: 'CM1 1AA',
    county: 'Essex',
    forceName: 'Essex Police',
  },
];

const rep: Representative = {
  id: '1',
  slug: 'test-rep',
  name: 'Jane TestRep',
  phone: '07123456789',
  email: 'j@example.com',
  county: 'essex',
  postcode: 'CM1 1AA',
  stations: ['Chelmsford Police Station', 'South Essex Suite'],
  availability: '24/7',
  accreditation: 'Law Society',
  notes: 'Covers north and south Essex',
};

const row = representativeToSearchRow(rep, map, mockStations);
assert(row.county === 'Essex', 'county canonical');
assert(normalize(row.stations).includes('chelmsford'), 'stations joined');
assert(row.postcodeNorm === 'CM11AA', 'postcode norm');
assert(row.geoText.includes('essex'), 'geo text includes force/county');

const data = [row];

function expectHits(q: string, min: number) {
  const hits = searchDirectory(data, q);
  assert(hits.length >= min, `query "${q}" expected >=${min} hits, got ${hits.length}`);
}

expectHits("essex", 1);
expectHits("Essex", 1);
expectHits("ESSEX", 1);
expectHits("south essex", 1);
expectHits("ess", 1);
expectHits("chelmsford", 1);
expectHits("jane", 1);
expectHits('nonsense-xyz-123', 0);

assert(extractUkPostcodeNorm('near SW1A 1AA today') === 'SW1A1AA', 'extract postcode');

console.log('directory-search-selftest: OK');
