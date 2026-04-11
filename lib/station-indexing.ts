import type { PoliceStation, Representative } from '@/lib/types';

/**
 * Central rules for police station URL indexing (Google crawl budget).
 *
 * HIGH VALUE (index + sitemap): at least one rep lists this station, OR the row is flagged as a custody suite.
 * LOW VALUE (noindex + omit sitemap): zero matching reps and not custody — avoids “Discovered – currently not indexed” churn on thin templates.
 *
 * Future: when adding new station pages or imports, keep `isCustodyStation` / `custodySuite` accurate in `stations.json`
 * so major suites stay discoverable even before reps register.
 */

export function buildStationMatchKeys(
  station: PoliceStation,
  allStations: PoliceStation[],
): Set<string> {
  const normalizedInput = station.name.toLowerCase().trim();
  const meta =
    allStations.find((s) => s.slug === station.slug || s.name === station.name) ?? station;
  const keys = new Set<string>();
  keys.add(normalizedInput);
  keys.add(meta.name.toLowerCase());
  const short = meta.name.toLowerCase().replace(/\s*police station\s*$/i, '').trim();
  if (short.length >= 5) keys.add(short);
  return keys;
}

/** Same matching logic as getRepsByStation — sync, for sitemap and metadata. */
export function countRepsForStation(
  station: PoliceStation,
  reps: Representative[],
  allStations: PoliceStation[],
): number {
  const keys = buildStationMatchKeys(station, allStations);
  return reps.filter((r) =>
    (r.stations || []).some((label) => {
      const sl = label.toLowerCase();
      for (const key of keys) {
        if (!key) continue;
        if (sl === key || sl.includes(key) || key.includes(sl)) return true;
      }
      return false;
    }),
  ).length;
}

/** Pages Google should spend crawl budget indexing. */
export function shouldIndexPoliceStationPage(station: PoliceStation, repCount: number): boolean {
  if (repCount > 0) return true;
  if (station.isCustodyStation || station.custodySuite) return true;
  return false;
}

export function shouldIncludePoliceStationInSitemap(
  station: PoliceStation,
  repCount: number,
): boolean {
  return shouldIndexPoliceStationPage(station, repCount);
}
