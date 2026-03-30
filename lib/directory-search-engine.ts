import type { Representative } from '@/lib/types';

export interface DirectorySearchRow {
  name: string;
  phone: string;
  county: string;
  stations: string;
  availability: string;
  accreditation: string;
  notes: string;
  rep: Representative;
}

export function normalize(str: string | null | undefined): string {
  return (str || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
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

export function representativeToSearchRow(
  rep: Representative,
  countyMap: Record<string, string>,
): DirectorySearchRow {
  const stationsArr = rep.stations?.length ? rep.stations : rep.stationsCovered || [];
  const stations = stationsArr
    .map((s) => String(s ?? '').trim())
    .filter(Boolean)
    .join(', ');

  return {
    name: String(rep.name ?? '').trim(),
    phone: String(rep.phone ?? '').trim(),
    county: normalizeCounty(String(rep.county ?? '').trim(), countyMap),
    stations,
    availability: String(rep.availability ?? '').trim(),
    accreditation: String(rep.accreditation ?? '').trim(),
    notes: String(rep.notes ?? rep.bio ?? '').trim(),
    rep,
  };
}

export function searchDirectory(data: DirectorySearchRow[], query: string): DirectorySearchRow[] {
  const q = normalize(query);

  if (!q) return [...data];

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
      ].map(normalize);

      let score = 0;

      fields.forEach((field) => {
        if (!field) return;
        if (field === q) score += 5;
        else if (field.includes(q)) score += 2;
        else if (field.length >= 2 && q.includes(field)) score += 2;
      });

      if (normalize(item.county) === q) score += 10;

      return { item, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.item);
}