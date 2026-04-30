/**
 * Canonical ceremonial / administrative English counties for directory registration.
 * **London** is included as a county-level option (aligned with `/directory/london` and regional hubs).
 * Use `coverage_areas` for boroughs, towns, or extra locality detail beyond the county selection.
 */

export const ENGLISH_COUNTIES: readonly string[] = [
  'Bedfordshire',
  'Berkshire',
  'Bristol',
  'Buckinghamshire',
  'Cambridgeshire',
  'Cheshire',
  'Cornwall',
  'County Durham',
  'Cumbria',
  'Derbyshire',
  'Devon',
  'Dorset',
  'East Riding of Yorkshire',
  'East Sussex',
  'Essex',
  'Gloucestershire',
  'Greater Manchester',
  'Hampshire',
  'Herefordshire',
  'Hertfordshire',
  'Isle of Wight',
  'Kent',
  'Lancashire',
  'Leicestershire',
  'Lincolnshire',
  'London',
  'Merseyside',
  'Norfolk',
  'North Yorkshire',
  'Northamptonshire',
  'Northumberland',
  'Nottinghamshire',
  'Oxfordshire',
  'Rutland',
  'Shropshire',
  'Somerset',
  'South Yorkshire',
  'Staffordshire',
  'Suffolk',
  'Surrey',
  'Tyne and Wear',
  'Warwickshire',
  'West Midlands',
  'West Sussex',
  'West Yorkshire',
  'Wiltshire',
  'Worcestershire',
] as const;

const CANONICAL_LOWER = new Map<string, string>(
  ENGLISH_COUNTIES.map((c) => [c.toLowerCase(), c] as const),
);

/** Labels that must never be accepted as a county (cities, boroughs, regions mis-used as county). */
export const REJECTED_COUNTY_TOKENS_LOWER = new Set([
  'birmingham',
  'manchester',
  'liverpool',
  'leeds',
  'sheffield',
  'nottingham',
  'brighton',
  'canterbury',
  'maidstone',
  'medway',
  'dartford',
  'gravesend',
  'sevenoaks',
  'swanley',
  'croydon',
  'bromley',
  'greenwich',
  'bexley',
  'cardiff',
  'swansea',
  'newport',
  'powys',
]);

/** Obvious misspellings / aliases → canonical name (not for substituting towns). */
const ALIAS_TO_CANONICAL: Record<string, string> = {
  'greater london': 'London',
  durham: 'County Durham',
  'east riding': 'East Riding of Yorkshire',
  'east riding of yorkshire': 'East Riding of Yorkshire',
  'greater manchester': 'Greater Manchester',
  'tyne & wear': 'Tyne and Wear',
  'tyne and wear': 'Tyne and Wear',
  'west mids': 'West Midlands',
  'west midlands': 'West Midlands',
};

const UK_POSTCODE_LIKE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;

function normalizeWhitespace(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

export function looksLikeUkPostcodeOnly(s: string): boolean {
  const t = normalizeWhitespace(s);
  return UK_POSTCODE_LIKE.test(t) || /^\d{3,6}$/.test(t);
}

/** Slash, comma-county mash, or "foo and bar" in one token when it looks like multiple jurisdictions. */
export function looksLikeMixedOrInvalidCountyPhrase(s: string): boolean {
  const t = s.trim();
  if (!t) return false;
  if (/[/|]/.test(t)) return true;
  if (/,\s*\w/.test(t) && /,\s*\w.*,/.test(t)) return true;
  if (/\bkent\b.*\blondon\b|\blondon\b.*\bkent\b/i.test(t)) return true;
  return false;
}

function resolveOneToken(raw: string): { ok: true; canonical: string } | { ok: false; reason: string } {
  const t = normalizeWhitespace(raw);
  if (!t) return { ok: false, reason: 'Empty county value.' };
  if (looksLikeMixedOrInvalidCountyPhrase(t)) {
    return {
      ok: false,
      reason: `Use one ceremonial county per value from the list. Put boroughs, towns, or mixed locations in "Towns & coverage areas". Received: "${t}"`,
    };
  }
  if (looksLikeUkPostcodeOnly(t)) {
    return { ok: false, reason: 'Postcodes cannot be entered as a county.' };
  }

  const lower = t.toLowerCase();
  if (REJECTED_COUNTY_TOKENS_LOWER.has(lower)) {
    return {
      ok: false,
      reason: `"${t}" is not a county for this form. Choose the correct ceremonial county (e.g. Kent, West Midlands) and add towns or boroughs under coverage areas.`,
    };
  }

  const aliasHit = ALIAS_TO_CANONICAL[lower];
  if (aliasHit) return { ok: true, canonical: aliasHit };

  const canonical = CANONICAL_LOWER.get(lower);
  if (canonical) return { ok: true, canonical };

  return {
    ok: false,
    reason: `"${t}" is not a recognised English county in our directory list. Select from the county list.`,
  };
}

export type CountyValidationResult =
  | { ok: true; canonical: string[] }
  | { ok: false; error: string };

/**
 * Validates county selections for registration / profile API.
 * Accepts string (comma-separated), string[], or undefined (treated as missing).
 */
export function validateEnglishCountySelections(input: unknown): CountyValidationResult {
  let tokens: string[] = [];
  if (input == null || input === '') {
    return { ok: false, error: 'Select at least one English county.' };
  }
  if (Array.isArray(input)) {
    tokens = input.map((x) => String(x)).flatMap((s) => s.split(/[,;]+/));
  } else if (typeof input === 'string') {
    tokens = input.split(/[,;]+/);
  } else {
    return { ok: false, error: 'Invalid counties payload.' };
  }

  const trimmed = tokens.map((s) => normalizeWhitespace(s)).filter(Boolean);
  if (trimmed.length === 0) {
    return { ok: false, error: 'Select at least one English county.' };
  }

  const canonical: string[] = [];
  const seen = new Set<string>();
  for (const token of trimmed) {
    const r = resolveOneToken(token);
    if (!r.ok) return { ok: false, error: r.reason };
    if (!seen.has(r.canonical)) {
      seen.add(r.canonical);
      canonical.push(r.canonical);
    }
  }

  return { ok: true, canonical };
}

/** Optional phone: empty OK; if present must look like a real phone (UK-friendly). */
export function validateOptionalRegistrationPhone(phone: unknown): { ok: true } | { ok: false; error: string } {
  if (phone == null || phone === '') return { ok: true };
  const s = String(phone).trim();
  if (s.length > 40) return { ok: false, error: 'Phone number is too long.' };
  const digits = s.replace(/\D/g, '');
  if (digits.length < 10) return { ok: false, error: 'Enter a valid phone number (at least 10 digits), or leave blank.' };
  if (!/^[\d\s+().-]+$/.test(s)) return { ok: false, error: 'Phone number contains invalid characters.' };
  return { ok: true };
}

export function countiesToStorageString(canonical: string[]): string {
  return canonical.join(', ');
}
