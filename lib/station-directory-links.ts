export function buildFindStationSearchUrl(query: string): string {
  const trimmed = query.trim();
  return trimmed
    ? `/find-station?q=${encodeURIComponent(trimmed)}`
    : '/find-station';
}

/** @deprecated Prefer buildFindStationSearchUrl for phone search. */
export function buildStationsDirectorySearchUrl(query: string): string {
  return buildFindStationSearchUrl(query);
}

export function stationDirectoryHref(countyFilter?: string, forceFilter?: string): string {
  if (countyFilter) {
    return `/StationsDirectory?county=${encodeURIComponent(countyFilter)}`;
  }
  if (forceFilter) {
    return `/StationsDirectory?force=${encodeURIComponent(forceFilter)}`;
  }
  return '/StationsDirectory';
}
