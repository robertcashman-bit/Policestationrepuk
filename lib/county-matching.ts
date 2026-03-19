/**
 * Match representative county strings (from scraped/rep data) to directory county names.
 * Reduces "0 reps" false negatives when wording differs (e.g. Greater London vs London).
 */

/** Directory county name -> rep.county values that should match */
const REP_COUNTY_ALIASES: Record<string, string[]> = {
  London: ['Greater London', 'Central London', 'North London', 'East London', 'South London', 'West London'],
  Sussex: ['West Sussex', 'East Sussex'],
  Yorkshire: ['North Yorkshire', 'South Yorkshire', 'West Yorkshire', 'East Yorkshire'],
  'County Durham': ['Co Durham', 'Durham'],
  'Greater Manchester': ['Manchester'],
};

function norm(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, ' ');
}

/** True if rep belongs to the given directory county `countyName` (e.g. "Kent"). */
export function repMatchesCountyName(repCounty: string | undefined, countyName: string): boolean {
  const a = norm(repCounty || '');
  const b = norm(countyName);
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;
  const aliases = REP_COUNTY_ALIASES[countyName];
  if (aliases) {
    for (const alt of aliases) {
      if (a === norm(alt) || a.includes(norm(alt)) || norm(alt).includes(a)) return true;
    }
  }
  return false;
}
