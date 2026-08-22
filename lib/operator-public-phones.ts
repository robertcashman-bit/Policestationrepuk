/**
 * Robert Cashman / Police Station Agent numbers that must not be scraped as
 * site-wide or station “police” contact lines.
 *
 * - Landline: never emit in public HTML / JSON-LD.
 * - Mobile: allowed on Robert’s own directory profile and WhatsApp join copy;
 *   omit from station-page “Call” CTAs (reads like a custody desk number).
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
 * Phone for Call buttons on police-station pages: also omit operator mobile so
 * it is not presented as the station contact line.
 */
export function stationPageRepCallPhone(phone: string | null | undefined): string {
  const pub = publicDirectoryPhone(phone);
  if (!pub) return '';
  if (isOperatorMobile(pub)) return '';
  return pub;
}
