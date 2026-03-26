import type { PoliceStation } from '@/lib/types';
import { levenshtein } from '@/lib/rep-search';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type PhoneClass = 'station' | 'switchboard' | 'generic' | 'none';

export interface NormalizedStationQuery {
  raw: string;
  tokens: string[];
  force: string | null;
  postcode: string | null;
  isPostcodeSearch: boolean;
}

export type ScoredStation = PoliceStation & { _score: number };

/* ------------------------------------------------------------------ */
/*  Force alias map                                                    */
/* ------------------------------------------------------------------ */

const FORCE_ALIASES: Record<string, string> = {
  met: 'metropolitan police',
  'met police': 'metropolitan police',
  'the met': 'metropolitan police',
  metropolitan: 'metropolitan police',
  gmp: 'greater manchester police',
  btp: 'british transport police',
  'west mids': 'west midlands police',
  'west mid': 'west midlands police',
  'south yorks': 'south yorkshire police',
  'north yorks': 'north yorkshire police',
  'west yorks': 'west yorkshire police',
  'avon': 'avon and somerset constabulary',
  herts: 'hertfordshire constabulary',
  cambs: 'cambridgeshire constabulary',
  lancs: 'lancashire constabulary',
  notts: 'nottinghamshire police',
  staffs: 'staffordshire police',
  lincs: 'lincolnshire police',
  northants: 'northamptonshire police',
  beds: 'bedfordshire police',
  'mod police': 'ministry of defence police',
};

/* ------------------------------------------------------------------ */
/*  Switchboard / generic number sets                                  */
/*  Built from data audit: numbers shared by 3+ stations in one force  */
/* ------------------------------------------------------------------ */

const SWITCHBOARD_NUMBERS = new Set([
  '020 7230 1212',
  '0800 40 50 40',
  '0161 872 5050',
  '101',
  '01656 655555',
  '0115 967 0999',
  '0300 333 4444',
  '0116 222 2222',
  '01772 614444',
  '01782 234234',
  '01622 690690',
  '0151 709 6010',
  '01482 356413',
  '01707 354000',
  '01267 222020',
  '01522 532222',
  '0191 375 2582',
  '01202 222 222',
  '01926 415000',
  '0191 454 7555',
  '01480 456111',
  '01473 613500',
  '020 8733 3700',
  '01483 571212',
  '01962 841534',
  '01865 841 148',
  '0121 626 5000',
  '01432 347317',
  '01905 331029',
  '01785 236211',
  '0151 777 3000',
  '0161 856 5200',
  '0345 606 0365',
  '01245 491491',
  '01234 841212',
  '0300 123 1212',
  '020 8577 1212',
]);

const GENERIC_NUMBERS = new Set(['101', '0800 40 50 40']);

/* ------------------------------------------------------------------ */
/*  classifyPhone                                                      */
/* ------------------------------------------------------------------ */

export function classifyPhone(station: PoliceStation): PhoneClass {
  const raw = (station.custodyPhone || station.phone || '').trim();
  if (!raw) return 'none';
  if (GENERIC_NUMBERS.has(raw)) return 'generic';
  if (SWITCHBOARD_NUMBERS.has(raw)) return 'switchboard';
  return 'station';
}

export function displayPhoneNumber(station: PoliceStation): string | null {
  const raw = (station.custodyPhone || station.phone || station.custodyPhone2 || station.nonEmergencyPhone || '').trim();
  return raw || null;
}

/* ------------------------------------------------------------------ */
/*  Query normalisation                                                */
/* ------------------------------------------------------------------ */

const POSTCODE_RE = /^[A-Z]{1,2}\d{1,2}[A-Z]?\s*\d?[A-Z]{0,2}$/i;
const POSTCODE_PREFIX_RE = /^[A-Z]{1,2}\d/i;

function stripPunctuation(s: string): string {
  return s.replace(/[^\w\s-]/g, '').replace(/\s+/g, ' ').trim();
}

export function normalizeStationQuery(query: string): NormalizedStationQuery {
  const raw = query.trim();
  const cleaned = stripPunctuation(raw.toLowerCase());
  const tokens = cleaned.split(/\s+/).filter(Boolean);

  let force: string | null = null;
  let postcode: string | null = null;
  const isPostcodeSearch = POSTCODE_RE.test(raw) || POSTCODE_PREFIX_RE.test(raw);

  if (isPostcodeSearch) {
    postcode = cleaned.replace(/\s+/g, '').toUpperCase();
  }

  // Try full query as force alias
  const fullQuery = tokens.join(' ');
  if (FORCE_ALIASES[fullQuery]) {
    force = FORCE_ALIASES[fullQuery];
  } else {
    // Try individual tokens and 2-token combos
    for (let i = 0; i < tokens.length; i++) {
      if (FORCE_ALIASES[tokens[i]]) {
        force = FORCE_ALIASES[tokens[i]];
        break;
      }
      if (i + 1 < tokens.length) {
        const pair = tokens[i] + ' ' + tokens[i + 1];
        if (FORCE_ALIASES[pair]) {
          force = FORCE_ALIASES[pair];
          break;
        }
      }
    }
  }

  return { raw, tokens, force, postcode, isPostcodeSearch };
}

/* ------------------------------------------------------------------ */
/*  Scoring                                                            */
/* ------------------------------------------------------------------ */

export function scoreStation(
  station: PoliceStation,
  nq: NormalizedStationQuery,
): number {
  let score = 0;
  const name = station.name.toLowerCase();
  const address = (station.address || '').toLowerCase();
  const postcode = (station.postcode || '').toUpperCase().replace(/\s+/g, '');
  const force = (station.forceName || '').toLowerCase();
  const fullQuery = nq.tokens.join(' ');

  // Exact name match
  if (name === fullQuery || name === fullQuery + ' police station') {
    score += 100;
  } else {
    // Partial name match: any token of length >=3 found inside name
    for (const token of nq.tokens) {
      if (token.length >= 3 && name.includes(token)) {
        score += 70;
        break;
      }
    }
  }

  // Postcode match
  if (nq.postcode && postcode) {
    const queryPC = nq.postcode.replace(/\s+/g, '').toUpperCase();
    if (postcode === queryPC) {
      score += 60;
    } else if (postcode.startsWith(queryPC) || queryPC.startsWith(postcode)) {
      score += 50;
    }
  }

  // Force match
  if (nq.force) {
    if (force === nq.force || force.includes(nq.force) || nq.force.includes(force)) {
      score += 40;
    }
  } else {
    // Check tokens against force name (user typed "kent" etc.)
    for (const token of nq.tokens) {
      if (token.length >= 3 && force.includes(token)) {
        score += 40;
        break;
      }
    }
  }

  // Address token match
  for (const token of nq.tokens) {
    if (token.length >= 3 && address.includes(token)) {
      score += 30;
      break;
    }
  }

  // Fuzzy name match (Levenshtein)
  if (score < 70) {
    const nameWords = name.split(/\s+/);
    for (const token of nq.tokens) {
      if (token.length >= 4) {
        const fuzzyHit = nameWords.some(
          (w) => w.length >= 3 && levenshtein(w, token) <= 2,
        );
        if (fuzzyHit) {
          score += 25;
          break;
        }
      }
    }
  }

  // Bonus: has station-specific phone
  if (classifyPhone(station) === 'station') {
    score += 10;
  }

  // Bonus: custody suite
  if (station.isCustodyStation || station.custodySuite) {
    score += 5;
  }

  return score;
}

/* ------------------------------------------------------------------ */
/*  Main search function                                               */
/* ------------------------------------------------------------------ */

export function searchStations(
  query: string,
  stations: PoliceStation[],
): ScoredStation[] {
  const trimmed = query.trim();
  if (!trimmed) return stations.map((s) => ({ ...s, _score: 0 }));

  const nq = normalizeStationQuery(trimmed);

  const scored: ScoredStation[] = stations.map((s) => ({
    ...s,
    _score: scoreStation(s, nq),
  }));

  let results = scored.filter((s) => s._score >= 20);
  results.sort((a, b) => b._score - a._score);

  if (results.length > 0) return results;

  // Fallback 1: force-only match
  if (nq.force) {
    results = scored.filter((s) => {
      const f = (s.forceName || '').toLowerCase();
      return f === nq.force || f.includes(nq.force!) || nq.force!.includes(f);
    });
    results.sort((a, b) => a.name.localeCompare(b.name, 'en-GB'));
    if (results.length > 0) return results.map((s) => ({ ...s, _score: Math.max(s._score, 40) }));
  }

  // Fallback 2: broad substring match
  const allTokens = nq.tokens.filter((t) => t.length >= 3);
  results = scored.filter((s) => {
    const hay = [s.name, s.address, s.postcode, s.forceName, s.forceCode]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return allTokens.some((t) => hay.includes(t));
  });
  results.sort((a, b) => b._score - a._score);
  if (results.length > 0) return results.map((s) => ({ ...s, _score: Math.max(s._score, 20) }));

  // Fallback 3: return all stations alphabetically (never empty)
  scored.sort((a, b) => a.name.localeCompare(b.name, 'en-GB'));
  return scored.map((s) => ({ ...s, _score: 0 }));
}
