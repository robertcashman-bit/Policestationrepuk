/**
 * Tier-2 structured source: OpenStreetMap Nominatim + Overpass.
 * Public APIs — polite User-Agent, small rate, no phone invention.
 */

import type { SearchResult } from './types';
import type { CustodySuite } from './types';

const UA = 'PoliceStationRepUK-CustodyDiscovery/1.0 (+https://policestationrepuk.org; contact@defencelegalservices.co.uk)';

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

interface OsmPhoneHit {
  name: string;
  phone: string;
  lat?: number;
  lon?: number;
  osmUrl: string;
  displayName?: string;
}

function extractPhonesFromTags(tags: Record<string, string | undefined>): string[] {
  const keys = ['phone', 'contact:phone', 'telephone', 'contact:telephone'];
  const out: string[] = [];
  for (const key of keys) {
    const v = tags[key]?.trim();
    if (v) out.push(v);
  }
  return out;
}

async function nominatimSearch(suite: CustodySuite): Promise<OsmPhoneHit[]> {
  const q = [suite.custodySuiteName || suite.policeStationName, suite.postcode, 'United Kingdom']
    .filter(Boolean)
    .join(', ');
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', q);
  url.searchParams.set('format', 'json');
  url.searchParams.set('addressdetails', '0');
  url.searchParams.set('extratags', '1');
  url.searchParams.set('limit', '5');
  url.searchParams.set('countrycodes', 'gb');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': UA, Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!res.ok) return [];
    const rows = (await res.json()) as Array<{
      display_name?: string;
      lat?: string;
      lon?: string;
      osm_type?: string;
      osm_id?: number;
      extratags?: Record<string, string>;
      name?: string;
    }>;

    const hits: OsmPhoneHit[] = [];
    for (const row of rows) {
      const phones = extractPhonesFromTags(row.extratags ?? {});
      if (phones.length === 0) continue;
      const osmType = row.osm_type ?? 'node';
      const osmId = row.osm_id;
      const osmUrl =
        osmId != null
          ? `https://www.openstreetmap.org/${osmType}/${osmId}`
          : 'https://www.openstreetmap.org';
      for (const phone of phones) {
        hits.push({
          name: row.name || row.display_name || suite.policeStationName,
          phone,
          lat: row.lat ? Number(row.lat) : undefined,
          lon: row.lon ? Number(row.lon) : undefined,
          osmUrl,
          displayName: row.display_name,
        });
      }
    }
    return hits;
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

async function overpassNearPoint(
  lat: number,
  lon: number,
  nameHint: string,
): Promise<OsmPhoneHit[]> {
  // 800m radius police amenities with a phone tag
  const query = `
[out:json][timeout:15];
(
  node["amenity"="police"](around:800,${lat},${lon});
  way["amenity"="police"](around:800,${lat},${lon});
);
out center tags 10;
`.trim();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 16_000);
  try {
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal,
    });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      elements?: Array<{
        type: string;
        id: number;
        lat?: number;
        lon?: number;
        center?: { lat: number; lon: number };
        tags?: Record<string, string>;
      }>;
    };

    const hint = nameHint.toLowerCase();
    const hits: OsmPhoneHit[] = [];
    for (const el of data.elements ?? []) {
      const tags = el.tags ?? {};
      const phones = extractPhonesFromTags(tags);
      if (phones.length === 0) continue;
      const name = tags.name || tags['official_name'] || 'Police station';
      // Prefer name matches; still accept nearby police POIs with phones
      if (hint && name.toLowerCase().includes(hint.slice(0, 6)) === false && phones.length) {
        // keep — geographic proximity already constrained
      }
      const osmUrl = `https://www.openstreetmap.org/${el.type}/${el.id}`;
      for (const phone of phones) {
        hits.push({
          name,
          phone,
          lat: el.lat ?? el.center?.lat,
          lon: el.lon ?? el.center?.lon,
          osmUrl,
        });
      }
    }
    return hits;
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

/** Convert OSM hits into SearchResult rows the crawler already understands. */
export function osmHitsToSearchResults(hits: OsmPhoneHit[]): SearchResult[] {
  return hits.map((h) => ({
    title: `${h.name} (OpenStreetMap)`,
    url: h.osmUrl,
    snippet: `${h.name} telephone ${h.phone}${h.displayName ? ` — ${h.displayName}` : ''}`,
    date: undefined,
  }));
}

export function osmLookupEnabled(): boolean {
  return process.env.CUSTODY_DISCOVERY_OSM !== 'false';
}

/**
 * Look up structured OSM phones for a suite. Rate-limit politely (Nominatim 1 req/s).
 */
export async function fetchOsmPhoneSources(suite: CustodySuite): Promise<SearchResult[]> {
  if (!osmLookupEnabled()) return [];

  const hits: OsmPhoneHit[] = [];
  const fromNominatim = await nominatimSearch(suite);
  hits.push(...fromNominatim);
  await sleep(1100);

  const lat = suite.latitude;
  const lon = suite.longitude;
  if (typeof lat === 'number' && typeof lon === 'number' && Number.isFinite(lat) && Number.isFinite(lon)) {
    const fromOverpass = await overpassNearPoint(
      lat,
      lon,
      suite.custodySuiteName || suite.policeStationName,
    );
    hits.push(...fromOverpass);
  }

  // Dedupe by phone+url
  const seen = new Set<string>();
  const unique = hits.filter((h) => {
    const key = `${h.osmUrl}::${h.phone}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return osmHitsToSearchResults(unique);
}
