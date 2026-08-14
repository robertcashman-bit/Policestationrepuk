import { normalizeEmail } from './normalize';

/**
 * Domains that must never receive outreach, even before KV is written.
 * HPJV asked (13 Aug 2026) to unsubscribe every @hpjv.co.uk address.
 */
export const SEED_SUPPRESSED_DOMAINS = ['hpjv.co.uk'] as const;

export function registrableEmailDomain(emailOrDomain: string): string | null {
  const raw = normalizeEmail(emailOrDomain);
  const domain = raw.includes('@') ? raw.split('@')[1] : raw;
  if (!domain) return null;
  return domain.replace(/^\.+|\.+$/g, '') || null;
}

export function isSeedSuppressedDomain(emailOrDomain: string): boolean {
  const domain = registrableEmailDomain(emailOrDomain);
  if (!domain) return false;
  return SEED_SUPPRESSED_DOMAINS.some(
    (blocked) => domain === blocked || domain.endsWith(`.${blocked}`),
  );
}
