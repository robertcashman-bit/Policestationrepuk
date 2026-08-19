/**
 * Single public trust sentence for directory, Terms, and /rep/* banners.
 * Listing-time accreditation check ≠ ongoing supervision or status guarantee.
 */
export const DIRECTORY_LISTING_TRUST_SENTENCE =
  'We check accreditation evidence at listing time; we do not supervise cases or guarantee ongoing status.';

/** Directory founded year — used for “years operating” copy. */
export const DIRECTORY_FOUNDED_YEAR = 2016;

export function directoryYearsOperating(now = new Date()): number {
  const years = now.getFullYear() - DIRECTORY_FOUNDED_YEAR;
  return Math.max(years, 1);
}
