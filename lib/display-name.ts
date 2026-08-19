const LOWERCASE_PARTICLES = new Set(['de', 'da', 'di', 'du', 'del', 'della', 'van', 'von', 'la', 'le', 'of']);

function lettersOnly(value: string): string {
  return value.replace(/[^a-zA-Z]/g, '');
}

/** True when the token already has internal capitals (e.g. McCurry, O'Blein). */
function hasMixedCase(token: string): boolean {
  const letters = lettersOnly(token);
  if (!letters) return false;
  return letters !== letters.toUpperCase() && letters !== letters.toLowerCase();
}

function titleCaseSegment(part: string): string {
  const lower = part.toLowerCase();
  if (!lower) return part;

  // O'Brien / O'Blein
  if (lower.length > 2 && lower.startsWith("o'")) {
    return `O'${lower.charAt(2).toUpperCase()}${lower.slice(3)}`;
  }

  // McCurry / McNeil
  if (lower.length > 2 && lower.startsWith('mc')) {
    return `Mc${lower.charAt(2).toUpperCase()}${lower.slice(3)}`;
  }

  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

/**
 * Normalise person names for public UI (ALL CAPS / all lowercase / collapsed spaces).
 * Keeps intentional particles lowercase when they are not the first token.
 * Preserves already mixed-case tokens (Mc / O' names) and title-cases apostrophe/Mc segments.
 */
export function formatPersonDisplayName(raw: string): string {
  const cleaned = raw.replace(/\s+/g, ' ').trim();
  if (!cleaned) return raw;

  return cleaned
    .split(' ')
    .map((token, index) => {
      if (!token) return token;
      // Leave correctly cased names alone (McCurry, O'Blein, etc.)
      if (hasMixedCase(token)) return token;

      return token
        .split('-')
        .map((part, partIndex) => {
          if (!part) return part;
          const lower = part.toLowerCase();
          if (index > 0 && partIndex === 0 && LOWERCASE_PARTICLES.has(lower)) {
            return lower;
          }
          return titleCaseSegment(part);
        })
        .join('-');
    })
    .join(' ');
}
