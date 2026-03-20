import counties from '@/data/counties.json';

export const COUNTY_SLUG_SET = new Set(
  (counties as { slug: string }[]).map((c) => c.slug.toLowerCase()),
);
