export interface RepContactDetails {
  phone: string;
  email: string;
  whatsappLink: string;
}

/**
 * Client-side fetch for contact details after an explicit reveal click.
 * Returns null on failure (caller shows profile fallback).
 */
export async function fetchRepContactDetails(
  slug: string,
): Promise<RepContactDetails | null> {
  if (!slug) return null;
  try {
    const res = await fetch(`/api/rep/${encodeURIComponent(slug)}/contact`, {
      method: 'GET',
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Partial<RepContactDetails>;
    return {
      phone: typeof data.phone === 'string' ? data.phone : '',
      email: typeof data.email === 'string' ? data.email : '',
      whatsappLink: typeof data.whatsappLink === 'string' ? data.whatsappLink : '',
    };
  } catch {
    return null;
  }
}
