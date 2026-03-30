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

/** Short meta/JSON-LD description: directory only — not a law firm or provider of regulated services. */
export const DEFAULT_DESCRIPTION =
  'Free directory connecting criminal defence firms with accredited police station representatives across England and Wales. PoliceStationRepUK is not a law firm and does not provide legal advice or regulated legal services through the directory.';
