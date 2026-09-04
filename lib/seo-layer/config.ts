/**
 * policestationrepuk-seo-layer — central SEO config.
 * Production canonical host is always https://policestationrepuk.org (set in vercel.json build env).
 * For local/staging only, override with NEXT_PUBLIC_SITE_URL.
 */

/** Canonical production URL — must stay policestationrepuk.org for sitemap, JSON-LD, and Open Graph. */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '').trim() ||
  'https://policestationrepuk.org';
export const SITE_NAME = 'PoliceStationRepUK';

/** Open Graph / Twitter / social tool preview image (served from `public/`). */
export const SOCIAL_PREVIEW_PATH = '/social-preview.jpg' as const;

export function socialPreviewImageUrl(): string {
  return `${SITE_URL}${SOCIAL_PREVIEW_PATH}`;
}

/** Short meta/JSON-LD description: directory only — not a law firm or provider of regulated services. */
export const DEFAULT_DESCRIPTION =
  'Free UK directory of accredited police station representatives for criminal defence firms across England and Wales. Search and instruct reps by county or station. Not the police — not a law firm.';

/** Default meta keywords for root layout and key hubs. */
export const SITE_KEYWORDS = [
  'police station representative',
  'police station rep directory',
  'police station cover',
  'criminal defence police station',
  'find a police station representative',
  'instruct police station rep',
  'accredited police station rep',
  'freelance police station representative',
  'England Wales police station directory',
] as const;
