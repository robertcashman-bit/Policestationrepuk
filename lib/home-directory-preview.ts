import type { Representative } from '@/lib/types';
import { ROBERT_SLUG } from '@/lib/featured';

/**
 * Homepage preview cards — real listed reps only.
 * Prefer featured (Robert first), then reps with clear county + stations.
 * No invented people; contact details stay on profile (not scraped here).
 */
export function selectHomepagePreviewReps(
  reps: Representative[],
  featuredSorted: Representative[],
  limit: number,
): Representative[] {
  const out: Representative[] = [];
  const seen = new Set<string>();

  const push = (r: Representative | undefined) => {
    if (!r?.slug || seen.has(r.slug) || out.length >= limit) return;
    seen.add(r.slug);
    out.push(r);
  };

  for (const r of featuredSorted) push(r);

  const scored = [...reps]
    .filter((r) => r.slug !== ROBERT_SLUG || !seen.has(r.slug))
    .map((r) => {
      const stations = (r.stations || []).length;
      const county = (r.county || '').trim();
      const score =
        (stations > 0 ? 4 : 0) +
        (county && county.toLowerCase() !== 'unknown' ? 2 : 0) +
        (r.availability ? 1 : 0) +
        (r.featured ? 2 : 0);
      return { r, score };
    })
    .sort((a, b) => b.score - a.score || a.r.name.localeCompare(b.r.name));

  for (const { r } of scored) {
    if (out.length >= limit) break;
    push(r);
  }

  return out.slice(0, limit);
}
