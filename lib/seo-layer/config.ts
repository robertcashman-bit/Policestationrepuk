/**
 * policestationrepuk-seo-layer — central SEO config.
 * Override via env if needed: NEXT_PUBLIC_SITE_URL
 */

/** Production default: .org clone; override with NEXT_PUBLIC_SITE_URL if needed. */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '').trim() ||
  'https://policestationrepuk.org';
export const SITE_NAME = 'PoliceStationRepUK';

export const DEFAULT_DESCRIPTION =
  'UK directory of accredited police station representatives providing duty solicitor cover and criminal defence representation at police stations across England and Wales.';
