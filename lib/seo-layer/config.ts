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

export const DEFAULT_DESCRIPTION =
  'UK directory of accredited police station representatives providing duty solicitor cover and criminal defence representation at police stations across England and Wales.';
