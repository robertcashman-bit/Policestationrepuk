/** Central Custody Note conversion URLs, pricing and copy (UTM for funnel attribution). */
import { partnerHref } from '@/lib/utm';

function cnHref(campaign: string, path = ''): string {
  const base = path
    ? `https://custodynote.com${path.startsWith('/') ? path : `/${path}`}`
    : 'https://custodynote.com';
  return partnerHref(base, campaign);
}

/** User-facing product name — matches custodynote.com. */
export const CUSTODYNOTE_BRAND_NAME = 'Custody Note';

export const CUSTODYNOTE_SITE = 'https://custodynote.com';
export const CUSTODYNOTE_DOWNLOAD_HREF = cnHref('directory', '/download');
/** Primary download CTA — custodynote.com/download is the canonical install path. */
export const CUSTODYNOTE_TRIAL_HREF = CUSTODYNOTE_DOWNLOAD_HREF;
export const CUSTODYNOTE_PRICING_HREF = cnHref('directory', '/pricing');
/** Free practitioner resources — linkable checklists and templates. */
export const CUSTODYNOTE_TOOLS_HREF = cnHref('directory', '/tools');
export const CUSTODYNOTE_CHECKLIST_HREF = cnHref('directory', '/police-station-attendance-checklist');
/** Mac section on the custodynote.com download page (Apple Silicon + Intel pickers). */
export const CUSTODYNOTE_MAC_DOWNLOAD_HREF = `${CUSTODYNOTE_DOWNLOAD_HREF}#mac`;

/** Current release published on custodynote.com (see custody-note-website/data/releases.json). */
export const CUSTODYNOTE_VERSION = '1.9.11';

/** Plain-language — use in headlines and promos. */
export const CUSTODYNOTE_APPS_LINE = 'Native desktop apps for Windows PC and Mac';

/** Technical requirements — use in footnotes and fine print. */
export const CUSTODYNOTE_PLATFORM_LINE =
  'Windows 10+ and macOS 11+ (Apple Silicon and Intel)';

/** Planned Pro price after beta (GBP). */
export const CUSTODYNOTE_PRICE_GBP = '9.99';
/** Discounted Pro price for PSR UK readers using the member code (9.99 × 0.80 ≈ 7.99). */
export const CUSTODYNOTE_MEMBER_PRICE_GBP = '7.99';
/** Member discount code surfaced exclusively on PoliceStationRepUK. */
export const CUSTODYNOTE_DISCOUNT_CODE = 'A2MJY2NQ';
export const CUSTODYNOTE_DISCOUNT_PCT = 20;

/** Free tier label during public beta. */
export const CUSTODYNOTE_FREE_LABEL = 'Free during beta';
export const CUSTODYNOTE_TRIAL_LABEL = CUSTODYNOTE_FREE_LABEL;
export const CUSTODYNOTE_TRIAL_CTA = 'Download Free';
export const CUSTODYNOTE_DOWNLOAD_CTA = 'Download Free';
export const CUSTODYNOTE_BETA_REASON =
  "Custody Note is in beta — that's why it's free while we test with real police station work.";

/** Reusable pricing line for promos and banners. */
export const CUSTODYNOTE_PROMO_PRICE_LINE = 'Free during beta';

/** Short reusable phrases for headers / banners — aligned with custodynote.com product copy. */
export const CUSTODYNOTE_TAGLINE =
  'Structured custody attendance notes, built for criminal defence work';

export const CUSTODYNOTE_SHORT_DESCRIPTION =
  'Digital note-taking and workflow tool for criminal defence professionals attending police stations and managing pre-charge case preparation.';

export const CUSTODYNOTE_MEMBER_DEAL =
  `After beta, PSR UK readers ~£${CUSTODYNOTE_MEMBER_PRICE_GBP}/mo with code ${CUSTODYNOTE_DISCOUNT_CODE} (${CUSTODYNOTE_DISCOUNT_PCT}% off Pro)`;

export const CUSTODYNOTE_DOWNLOAD_APPS_CTA = 'Download for Windows & Mac';

export const CUSTODYNOTE_APPS_DETAIL =
  'Install on your Windows PC or Mac (Apple Silicon and Intel). Signed Mac builds, automatic updates on both platforms.';

export const TOP_BANNER_TEXT =
  'Custody Note for Windows PC & Mac — in beta, free while we test';

/** Shorter line for narrow phone screens (full text from `TOP_BANNER_TEXT` on sm+). */
export const TOP_BANNER_TEXT_MOBILE = 'Custody Note — free during beta';

export const INLINE_CTA_HEADLINE = 'Stop rewriting custody notes at 2am';
export const INLINE_CTA_BULLETS = [
  'PACE-aligned structured sections',
  'Works offline at the custody desk',
  'PDF + LAA billing in one record',
] as const;
