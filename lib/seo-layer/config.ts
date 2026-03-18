/**
 * policestationrepuk-seo-layer — central SEO config.
 * Override via env if needed: NEXT_PUBLIC_SITE_URL
 */

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://policestationrepuk.com';
export const SITE_NAME = 'PoliceStationRepUK';

export const DEFAULT_DESCRIPTION =
  'UK directory of accredited police station representatives providing duty solicitor cover and criminal defence representation at police stations across England and Wales.';
