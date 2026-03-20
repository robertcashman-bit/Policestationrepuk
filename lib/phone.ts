/**
 * Normalise phone numbers for tel: links (strip formatting; keep leading +).
 */
export function phoneToTelHref(phone: string): string {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/[^\d+]/g, '');
  return digits ? `tel:${digits}` : '';
}
