const LOWERCASE_PARTICLES = new Set(['de', 'da', 'di', 'du', 'del', 'della', 'van', 'von', 'la', 'le', 'of']);

/**
 * Normalise person names for public UI (ALL CAPS / all lowercase / collapsed spaces).
 * Keeps intentional particles lowercase when they are not the first token.
 */
export function formatPersonDisplayName(raw: string): string {
  const cleaned = raw.replace(/\s+/g, ' ').trim();
  if (!cleaned) return raw;

  return cleaned
    .split(' ')
    .map((token, index) => {
      if (!token) return token;
      // Preserve hyphenated parts: "OYEMIKE-SMITH" → "Oyemike-Smith"
      return token
        .split('-')
        .map((part, partIndex) => {
          if (!part) return part;
          const lower = part.toLowerCase();
          if (index > 0 && partIndex === 0 && LOWERCASE_PARTICLES.has(lower)) {
            return lower;
          }
          return lower.charAt(0).toUpperCase() + lower.slice(1);
        })
        .join('-');
    })
    .join(' ');
}
