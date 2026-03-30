import type { Representative, PoliceStation } from '@/lib/types';

export interface DirectorySearchRow {
  name: string;
  phone: string;
  county: string;
  stations: string;
  availability: string;
  accreditation: string;
  notes: string;
  /** Specialisms, languages — searchable */
  tags: string;
  /** Normalised UK postcode (no spaces) for boosting */
  postcodeNorm: string;
  /** Lowercased towns, forces, postcodes, addresses from station overlap */
  geoText: string;
  rep: Representative;
}

export function normalize(str: string | null | undefined): string {
  return (str || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

/** Strip spaces for comparison */
export function normaliseUkPostcode(pc: string): string {
  return pc.replace(/\s+/g, '').toUpperCase();
}

/** Extract first UK postcode from free text, normalised */
export function extractUkPostcodeNorm(query: string): string | null {
  const m = query.match(/\b([A-Z]{1,2}\d[A-Z0-9]?\s*\d[A-Z]{2})\b/i);
  return m ? normaliseUkPostcode(m[1]) : null;
}

export function buildCountyCanonicalMap(countyNames: string[]): Record<string, string> {
  const m: Record<string, string> = {};
  for (const name of countyNames) {
    const key = normalize(name);
    if (key) m[key] = name;
  }
  const aliases: Record<string, string> = {
    'greater london': 'London',
    'west sussex': 'Sussex',
    'east sussex': 'Sussex',
    'north yorkshire': 'North Yorkshire',
    'south yorkshire': 'South Yorkshire',
    'west yorkshire': 'West Yorkshire',
    'east yorkshire': 'Yorkshire',
    'co durham': 'County Durham',
    manchester: 'Greater Manchester',
  };
  for (const [k, v] of Object.entries(aliases)) {
    if (!m[k]) m[k] = v;
  }
  return m;
}

export function normalizeCounty(county: string, countyMap: Record<string, string>): string {
  const key = normalize(county);
  if (!key) return '';
  return countyMap[key] || county.trim();
}

function augmentGeoFromStations(rep: Representative, stations: PoliceStation[]): string {
  const labels = [...(rep.stations || []), ...(rep.stationsCovered || [])]
    .map((s) => String(s ?? '').trim().toLowerCase())
    .filter((x) => x.length >= 3);
  if (!labels.length || !stations.length) return '';

  const parts: string[] = [];
  for (const st of stations) {
    const nm = (st.name || '').toLowerCase().trim();
    if (nm.length < 4) continue;
    const shortNm = nm.replace(/\s*police station\s*|\s*custody suite\s*/g, ' ').trim();
    const matched = labels.some((l) => nm.includes(l) || l.includes(shortNm) || shortNm.includes(l));
    if (matched) {
      parts.push(
        st.name,
        st.address || '',
        st.postcode || '',
        st.forceName || '',
        st.county || '',
      );
    }
  }
  return parts.join(' ');
}

export function representativeToSearchRow(
  rep: Representative,
  countyMap: Record<string, string>,
  stations: PoliceStation[] = [],
): DirectorySearchRow {
  const stationsArr = rep.stations?.length ? rep.stations : rep.stationsCovered || [];
  const stationsStr = stationsArr
    .map((s) => String(s ?? '').trim())
    .filter(Boolean)
    .join(', ');

  const tags = [...(rep.specialisms || []), ...(rep.languages || [])].join(', ');
  const pcRaw = String(rep.postcode ?? '').trim();
  const postcodeNorm = pcRaw ? normaliseUkPostcode(pcRaw) : '';
  const geoBlob = stations.length ? augmentGeoFromStations(rep, stations) : '';
  const geoText = normalize(`${geoBlob} ${rep.addressCounty || ''}`);

  return {
    name: String(rep.name ?? '').trim(),
    phone: String(rep.phone ?? '').trim(),
    county: normalizeCounty(String(rep.county ?? '').trim(), countyMap),
    stations: stationsStr,
    availability: String(rep.availability ?? '').trim(),
    accreditation: String(rep.accreditation ?? '').trim(),
    notes: String(rep.notes ?? rep.bio ?? '').trim(),
    tags,
    postcodeNorm,
    geoText,
    rep,
  };
}

export function searchDirectory(data: DirectorySearchRow[], query: string): DirectorySearchRow[] {
  const q = normalize(query);

  if (!q) return [...data];

  const qPostcode = extractUkPostcodeNorm(query);

  return data
    .map((item) => {
      const fields = [
        item.name,
        item.phone,
        item.county,
        item.stations,
        item.availability,
        item.accreditation,
        item.notes,
        item.tags,
        item.geoText,
      ].map(normalize);

      let score = 0;

      fields.forEach((field) => {
        if (!field) return;
        if (field === q) score += 5;
        else if (field.includes(q)) score += 2;
        else if (field.length >= 2 && q.includes(field)) score += 2;
      });

      if (normalize(item.county) === q) score += 10;

      if (qPostcode && item.postcodeNorm && item.postcodeNorm === qPostcode) {
        score += 40;
      } else if (qPostcode && item.geoText.includes(qPostcode.toLowerCase())) {
        score += 25;
      }

      return { item, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.item);
}
