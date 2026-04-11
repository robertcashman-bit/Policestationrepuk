import type { County, Representative } from '@/lib/types';
import { repMatchesCountyName } from '@/lib/county-matching';

const FALLBACK_COUNTY_SLUGS = [
  'kent',
  'london',
  'greater-manchester',
  'west-midlands',
  'essex',
  'west-yorkshire',
  'merseyside',
  'hampshire',
  'surrey',
  'lancashire',
  'south-yorkshire',
  'nottinghamshire',
];

/** Counties with the most listed reps first — for homepage internal linking. */
export function selectTopCountiesForHomepage(
  counties: County[],
  reps: Representative[],
  limit: number,
): County[] {
  const scored = counties.map((c) => ({
    c,
    n: reps.filter((r) => repMatchesCountyName(r.county, c.name)).length,
  }));
  scored.sort((a, b) => b.n - a.n);
  const withReps = scored.filter((x) => x.n > 0).map((x) => x.c);
  if (withReps.length >= Math.min(8, limit)) return withReps.slice(0, limit);

  const bySlug = new Map(counties.map((c) => [c.slug, c]));
  const seen = new Set(withReps.map((c) => c.slug));
  const out = [...withReps];
  for (const s of FALLBACK_COUNTY_SLUGS) {
    if (out.length >= limit) break;
    const c = bySlug.get(s);
    if (c && !seen.has(c.slug)) {
      out.push(c);
      seen.add(c.slug);
    }
  }
  return out.slice(0, limit);
}
