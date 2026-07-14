import type { PoliceStation } from '@/lib/types';
import { isCustodyStation } from '@/lib/custody-station';
import { forceDomainForName } from './force-domains';
import type { CustodySuite } from './types';

function isActiveStation(station: PoliceStation): boolean {
  const status = station.status?.toLowerCase().trim();
  return !status || status === 'active';
}

function townFromStation(station: PoliceStation): string {
  const postcode = station.postcode?.trim() ?? '';
  const address = station.address ?? '';
  if (!address) return '';
  const withoutPc = postcode
    ? address.replace(new RegExp(postcode.replace(/\s+/g, '\\s*'), 'i'), '')
    : address;
  const parts = withoutPc
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  return parts.length >= 2 ? parts[parts.length - 1]! : (parts[0] ?? '');
}

function buildAliases(station: PoliceStation): string[] {
  const aliases = new Set<string>();
  aliases.add(station.name);
  const short = station.name
    .replace(/\s*police station\s*/gi, ' ')
    .replace(/\s*custody suite\s*/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (short) {
    aliases.add(short);
    aliases.add(`${short} Police Station`);
  }
  if (station.stationId) aliases.add(station.stationId);
  return [...aliases];
}

export function stationToCustodySuite(station: PoliceStation, now = new Date()): CustodySuite {
  const iso = now.toISOString();
  const dedicated = isCustodyStation(station);
  return {
    id: station.id,
    stationSlug: station.slug,
    forceName: station.forceName ?? 'Unknown force',
    forceDomain: forceDomainForName(station.forceName ?? ''),
    county: station.county ?? '',
    custodySuiteName: station.name,
    policeStationName: station.name,
    address: station.address ?? '',
    postcode: station.postcode,
    town: townFromStation(station),
    latitude: station.latitude,
    longitude: station.longitude,
    aliases: buildAliases(station),
    operationalStatus: station.status,
    publicEnquiryStatus: station.frontCounterStatus,
    custodyStatus: station.custodyStatus,
    isDedicatedCustodySuite: dedicated,
    active: isActiveStation(station),
    createdAt: iso,
    updatedAt: iso,
  };
}

/**
 * Build discovery targets from the full police station directory (~900 rows).
 * Every station is searched for a direct custody desk number, not only
 * rows flagged as dedicated custody suites.
 */
export function buildCustodySuitesFromStations(stations: PoliceStation[]): CustodySuite[] {
  return stations.filter(isActiveStation).map((s) => stationToCustodySuite(s));
}
