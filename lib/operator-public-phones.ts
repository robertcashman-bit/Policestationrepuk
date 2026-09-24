/**
 * Robert Cashman / Police Station Agent numbers that must not be scraped as
 * site-wide or station “police” contact lines.
 *
 * - Landline: omit from site-wide HTML, JSON-LD, station Call buttons, and
 *   directory contact-reveal. Allowed on Robert’s own /rep/robert-cashman
 *   visible Call button via ownProfileDirectoryPhone() (labelled answering service).
 * - Mobile: omit from station-page Call CTAs, profile SSR/RSC/JSON-LD, and
 *   directory contact-reveal. Revealed only client-side on Robert’s profile
 *   after a solicitor/agency confirm step.
 */

export const OPERATOR_LANDLINE_DIGITS = '01732247427';
export const OPERATOR_MOBILE_DIGITS = '07535494446';

/** Normalize UK numbers to national digits starting with 0 when possible. */
export function normalizeUkPhoneDigits(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('44') && digits.length >= 12) {
    return `0${digits.slice(2)}`;
  }
  return digits;
}

export function isOperatorLandline(phone: string | null | undefined): boolean {
  if (!phone?.trim()) return false;
  return normalizeUkPhoneDigits(phone) === OPERATOR_LANDLINE_DIGITS;
}

export function isOperatorMobile(phone: string | null | undefined): boolean {
  if (!phone?.trim()) return false;
  return normalizeUkPhoneDigits(phone) === OPERATOR_MOBILE_DIGITS;
}

/**
 * Phone safe for public directory HTML/schema: strips operator landline only.
 * Other reps’ numbers pass through unchanged.
 */
export function publicDirectoryPhone(phone: string | null | undefined): string {
  if (!phone?.trim()) return '';
  if (isOperatorLandline(phone)) return '';
  return phone.trim();
}

/**
 * Visible Call-button phone on a rep’s own /rep/[slug] profile page.
 * Permits the operator landline only on Robert Cashman’s profile; every other
 * slug still strips it. JSON-LD on the same page must keep using
 * publicDirectoryPhone() so schema.org never receives the landline.
 */
export function ownProfileDirectoryPhone(
  phone: string | null | undefined,
  slug: string,
): string {
  if (slug === 'robert-cashman') {
    const trimmed = phone?.trim() || '';
    // Mobile is never SSR'd on Robert's profile — client reveal only.
    if (!trimmed || isOperatorMobile(trimmed)) return '01732 247427';
    if (isOperatorLandline(trimmed)) return trimmed;
    return trimmed;
  }
  if (!phone?.trim()) return '';
  return publicDirectoryPhone(phone);
}

/**
 * Phone for Call buttons on police-station pages: also omit operator mobile so
 * it is not presented as the station contact line.
 */
export function stationPageRepCallPhone(phone: string | null | undefined): string {
  const pub = publicDirectoryPhone(phone);
  if (!pub) return '';
  if (isOperatorMobile(pub)) return '';
  return pub;
}
