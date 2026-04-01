/**
 * Maps /county-seo/{slug} to /directory/{countySlug} (data/counties.json slugs).
 * Edge-safe — no fs / data imports.
 */
export const COUNTY_SEO_SLUG_TO_DIRECTORY_SLUG: Record<string, string> = {
  kent: 'kent',
  london: 'london',
  essex: 'essex',
  manchester: 'greater-manchester',
  'west-midlands': 'west-midlands',
  'west-yorkshire': 'west-yorkshire',
  surrey: 'surrey',
  sussex: 'sussex',
  hampshire: 'hampshire',
  norfolk: 'norfolk',
  suffolk: 'suffolk',
  berkshire: 'berkshire',
  hertfordshire: 'hertfordshire',
  merseyside: 'merseyside',
  'south-yorkshire': 'south-yorkshire',
  nottinghamshire: 'nottinghamshire',
  'avon-and-somerset': 'avon-and-somerset',
  lancashire: 'lancashire',
  'devon-and-cornwall': 'devon-and-cornwall',
};
