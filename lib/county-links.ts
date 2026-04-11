import type { County } from '@/lib/types';

/** Resolve a human area label (county or force name) to a /directory/{slug} path when possible. */
export function directoryHrefForAreaName(
  areaLabel: string | undefined | null,
  counties: County[],
): string | null {
  const raw = (areaLabel || '').trim();
  if (!raw) return null;
  const lower = raw.toLowerCase();
  const direct = counties.find((c) => c.name.toLowerCase() === lower);
  if (direct) return `/directory/${direct.slug}`;
  const slugGuess = lower.replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const bySlug = counties.find((c) => c.slug === slugGuess || c.slug === lower.replace(/\s+/g, '-'));
  if (bySlug) return `/directory/${bySlug.slug}`;
  const partial = counties.find(
    (c) => lower.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(lower),
  );
  if (partial) return `/directory/${partial.slug}`;
  return null;
}
