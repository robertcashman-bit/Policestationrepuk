import type { PoliceStation, Representative } from '@/lib/types';
import { hasDirectNumber } from '@/lib/station-browse';
import { getCustodyPublicDisplay } from '@/lib/station-contacts/publish';
import { isCustodyStation } from '@/lib/custody-station';

/**
 * Central rules for police station URL indexing (Google crawl budget).
 *
 * HIGH VALUE (index + sitemap): reps cover the station, OR custody suite, OR a
 * dialable published station/custody phone line.
 * LOW VALUE (noindex + omit sitemap): no reps, not custody, no publishable
 * station-specific number — avoids thin empty templates.
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

function hasIndexablePhone(station: PoliceStation): boolean {
  if (hasDirectNumber(station)) return true;
  if (isCustodyStation(station) && getCustodyPublicDisplay(station).published) return true;
  return false;
}

/** Pages Google should spend crawl budget indexing. */
export function shouldIndexPoliceStationPage(station: PoliceStation, repCount: number): boolean {
  if (repCount > 0) return true;
  if (station.isCustodyStation || station.custodySuite) return true;
  if (hasIndexablePhone(station)) return true;
  return false;
}

export function shouldIncludePoliceStationInSitemap(
  station: PoliceStation,
  repCount: number,
): boolean {
  return shouldIndexPoliceStationPage(station, repCount);
}
