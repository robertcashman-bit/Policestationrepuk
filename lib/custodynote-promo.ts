/** Central Custody Note conversion URLs and copy (UTM for funnel attribution). */
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

/** Backup / direct download (Windows + Mac installers). Not the primary Windows CTA. */
export const CUSTODYNOTE_DOWNLOAD_HREF = cnHref('directory', '/download');
export const CUSTODYNOTE_PRICING_HREF = cnHref('directory', '/pricing');
/** Free practitioner resources — linkable checklists and templates. */
export const CUSTODYNOTE_TOOLS_HREF = cnHref('directory', '/tools');
export const CUSTODYNOTE_CHECKLIST_HREF = cnHref('directory', '/police-station-attendance-checklist');
/** Mac section on the custodynote.com download page (Apple Silicon + Intel pickers). */
export const CUSTODYNOTE_MAC_DOWNLOAD_HREF = `${CUSTODYNOTE_DOWNLOAD_HREF}#mac`;

/** Current desktop release to show (GitHub latest tag). Windows primary CTA is Microsoft Store; direct download is backup. */
export const CUSTODYNOTE_VERSION = '1.9.106';

/** Microsoft Store product page (Windows only, UK). Not for Mac. Primary Windows install path. */
export const CUSTODYNOTE_STORE_ID = '9NFSRVT3T45V';
export const CUSTODYNOTE_STORE_HREF = `https://apps.microsoft.com/detail/${CUSTODYNOTE_STORE_ID}`;
export const CUSTODYNOTE_STORE_CTA = 'Get it on Microsoft Store';

/**
 * Microsoft Store status — Windows listing is live on Microsoft Store (UK) and installable now.
 * Store is the primary Windows CTA. Direct download is backup. Mac is direct download only (not on Store).
 */
export const CUSTODYNOTE_STORE_STATUS_LINE =
  'Get Custody Note on Microsoft Store (Windows only, UK) — not for Mac. Direct download (Windows & Mac) is available as a backup at custodynote.com/download.';

/**
 * Where to get desktop builds — Store-primary for Windows; direct download is backup; Mac is download-only.
 */
export const CUSTODYNOTE_DOWNLOAD_LOCATION_LINE =
  'Windows: get it on Microsoft Store (UK). Backup direct download (Windows & Mac) at custodynote.com/download — Mac builds under the Mac section (not on the Store).';

/** Plain-language — use in headlines and promos. */
export const CUSTODYNOTE_APPS_LINE = 'Native desktop apps for Windows PC and Mac';

/** Technical requirements — use in footnotes and fine print. */
export const CUSTODYNOTE_PLATFORM_LINE =
  'Windows 10+ and macOS 11+ (Apple Silicon and Intel)';
/**
 * Planned Pro list price after beta (GBP), as stated on custodynote.com.
 * Payments are not wired yet — do not promote as a current paid offer or discount.
 */
export const CUSTODYNOTE_PRICE_GBP = '9.99';

/** Free tier label during public beta. */
export const CUSTODYNOTE_FREE_LABEL = 'Free during beta';
export const CUSTODYNOTE_TRIAL_LABEL = CUSTODYNOTE_FREE_LABEL;

/**
 * Primary conversion href/CTA for single-button promo surfaces.
 * Windows → Microsoft Store. Do not point primary CTAs at direct download.
 */
export const CUSTODYNOTE_TRIAL_HREF = CUSTODYNOTE_STORE_HREF;
export const CUSTODYNOTE_TRIAL_CTA = CUSTODYNOTE_STORE_CTA;

/** Backup direct-download CTA label (Windows & Mac installers). Secondary to Store. */
export const CUSTODYNOTE_DOWNLOAD_CTA = 'Direct download';
/** Backup dual-platform download button label — never use as the sole Windows primary CTA. */
export const CUSTODYNOTE_DOWNLOAD_APPS_CTA = 'Direct download (Windows & Mac)';
/** Mac-only direct download CTA — Mac is not on Microsoft Store. */
export const CUSTODYNOTE_MAC_DOWNLOAD_CTA = 'Download for Mac';

export const CUSTODYNOTE_BETA_REASON =
  "Custody Note is in beta — that's why it's free while we test with real police station work.";
export const CUSTODYNOTE_NO_CARD_LINE = 'No credit card required';

/** Reusable pricing line for promos and banners. */
export const CUSTODYNOTE_PROMO_PRICE_LINE = 'Free during beta';

/** Short reusable phrases for headers / banners — aligned with custodynote.com product copy. */
export const CUSTODYNOTE_TAGLINE =
  'Structured custody attendance notes, built for criminal defence work';

export const CUSTODYNOTE_SHORT_DESCRIPTION =
  'Digital note-taking and workflow tool for criminal defence professionals attending police stations and managing pre-charge case preparation.';

/** Soft post-beta note only — not a live paid offer or promo code. */
export const CUSTODYNOTE_PLANNED_PRO_LINE =
  `Paid Pro is planned after beta (around £${CUSTODYNOTE_PRICE_GBP}/month). Payments are not wired yet.`;

export const CUSTODYNOTE_APPS_DETAIL =
  'Install on your Windows PC (Microsoft Store, or direct download) or Mac (direct download — Apple Silicon and Intel). Signed Mac builds, automatic updates on both platforms.';

export const TOP_BANNER_TEXT =
  'Get Custody Note on Microsoft Store (Windows) — free during beta · Mac via direct download';

/** Shorter line for narrow phone screens (full text from `TOP_BANNER_TEXT` on sm+). */
export const TOP_BANNER_TEXT_MOBILE = 'Get it on Microsoft Store — free during beta';

export const INLINE_CTA_HEADLINE = 'Stop rewriting custody notes at 2am';
export const INLINE_CTA_BULLETS = [
  'PACE-aligned structured sections',
  'Works offline at the custody desk',
  'PDF + LAA billing in one record',
] as const;
