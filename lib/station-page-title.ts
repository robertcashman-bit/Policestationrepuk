const POLICE_STATION_SUFFIX = /\s+police\s+station\s*$/i;

/** Station display name with a single trailing "Police Station" (any casing). */
export function stationPoliceStationLabel(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return 'Police Station';
  if (POLICE_STATION_SUFFIX.test(trimmed)) return trimmed;
  return `${trimmed} Police Station`;
}

export function stationPageDocumentTitle(name: string, suffix: string): string {
  return `${stationPoliceStationLabel(name)} — ${suffix}`;
}
