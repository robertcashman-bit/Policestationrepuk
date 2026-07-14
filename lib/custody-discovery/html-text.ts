/**
 * Convert HTML to searchable text without discarding contact-bearing markup.
 * Stripping tags first would drop `href="tel:…"` which many force pages rely on.
 */

const TEL_HREF_RE = /href\s*=\s*["']\s*(?:tel:)\s*([^"'\s>]+)/gi;

/** Pull dialable numbers from tel: hyperlinks before tags are removed. */
export function extractTelHrefs(html: string): string[] {
  if (!html) return [];
  const out: string[] = [];
  for (const match of html.matchAll(TEL_HREF_RE)) {
    const raw = decodeURIComponent(match[1] ?? '')
      .replace(/^tel:/i, '')
      .trim();
    if (raw) out.push(raw);
  }
  return out;
}

/**
 * HTML → text for phone extraction.
 * Injects `Telephone: <number>` tokens for every tel: href so UK regex extractors see them.
 */
export function htmlToSearchableText(html: string): string {
  if (!html?.trim()) return '';
  const tels = extractTelHrefs(html);
  const telPrefix =
    tels.length > 0 ? `${tels.map((n) => `Telephone: ${n}`).join(' ')} ` : '';

  const body = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return `${telPrefix}${body}`.replace(/\s+/g, ' ').trim();
}
