import type { Representative, PoliceStation, County } from '@/lib/types';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface NormalizedQuery {
  raw: string;
  tokens: string[];
  station: string | null;
  town: string | null;
  county: string | null;
  remainingTokens: string[];
}

export type ScoredRep = Representative & { _score: number };

/* ------------------------------------------------------------------ */
/*  Alias maps                                                         */
/* ------------------------------------------------------------------ */

const TOWN_ALIASES: Record<string, string[]> = {
  medway: ['gillingham', 'chatham', 'rochester', 'strood', 'rainham'],
  'thames valley': ['reading', 'slough', 'maidenhead', 'windsor', 'oxford', 'aylesbury', 'high wycombe'],
  teesside: ['middlesbrough', 'stockton', 'hartlepool', 'redcar'],
  'stoke-on-trent': ['stoke', 'hanley', 'burslem', 'tunstall', 'longton', 'fenton'],
  potteries: ['stoke', 'hanley', 'stoke-on-trent'],
  tyneside: ['newcastle', 'gateshead', 'south shields', 'north shields', 'sunderland'],
  'black country': ['wolverhampton', 'walsall', 'dudley', 'west bromwich', 'sandwell'],
};

const COUNTY_ALIASES: Record<string, string[]> = {
  london: ['greater london', 'central london', 'north london', 'east london', 'south london', 'west london', 'middlesex'],
  sussex: ['west sussex', 'east sussex'],
  yorkshire: ['north yorkshire', 'south yorkshire', 'west yorkshire', 'east yorkshire'],
  'county durham': ['co durham', 'durham'],
  'greater manchester': ['manchester'],
  'tyne and wear': ['northumberland', 'tyneside'],
};

const FORCE_TO_COUNTY: Record<string, string[]> = {
  'avon and somerset': ['Somerset', 'Bristol'],
  bedfordshire: ['Bedfordshire'],
  cambridgeshire: ['Cambridgeshire'],
  cheshire: ['Cheshire'],
  'city of london': ['London'],
  cleveland: ['Cleveland'],
  cumbria: ['Cumbria'],
  derbyshire: ['Derbyshire'],
  'devon and cornwall': ['Devon', 'Cornwall'],
  dorset: ['Dorset'],
  durham: ['County Durham'],
  'dyfed-powys': ['Powys', 'Dyfed'],
  essex: ['Essex'],
  gloucestershire: ['Gloucestershire'],
  'greater manchester': ['Greater Manchester'],
  gwent: ['Gwent'],
  hampshire: ['Hampshire'],
  hertfordshire: ['Hertfordshire'],
  humberside: ['Humberside'],
  kent: ['Kent'],
  lancashire: ['Lancashire'],
  leicestershire: ['Leicestershire'],
  lincolnshire: ['Lincolnshire'],
  merseyside: ['Merseyside'],
  met: ['London'],
  metropolitan: ['London'],
  norfolk: ['Norfolk'],
  'north wales': ['North Wales'],
  'north yorkshire': ['North Yorkshire', 'Yorkshire'],
  northamptonshire: ['Northamptonshire'],
  northumbria: ['Northumberland', 'Tyne and Wear'],
  nottinghamshire: ['Nottinghamshire'],
  'south wales': ['South Wales'],
  'south yorkshire': ['South Yorkshire', 'Yorkshire'],
  staffordshire: ['Staffordshire'],
  suffolk: ['Suffolk'],
  surrey: ['Surrey'],
  sussex: ['Sussex'],
  'thames valley': ['Berkshire', 'Buckinghamshire', 'Oxfordshire'],
  warwickshire: ['Warwickshire'],
  'west mercia': ['Shropshire', 'Herefordshire', 'Worcestershire'],
  'west midlands': ['West Midlands'],
  'west yorkshire': ['West Yorkshire', 'Yorkshire'],
  wiltshire: ['Wiltshire'],
};

/* ------------------------------------------------------------------ */
/*  Levenshtein distance                                               */
/* ------------------------------------------------------------------ */

export function levenshtein(a: string, b: string): number {
  const la = a.length;
  const lb = b.length;
  if (la === 0) return lb;
  if (lb === 0) return la;

  let prev = new Array<number>(lb + 1);
  let curr = new Array<number>(lb + 1);

  for (let j = 0; j <= lb; j++) prev[j] = j;

  for (let i = 1; i <= la; i++) {
    curr[0] = i;
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[lb];
}

/* ------------------------------------------------------------------ */
/*  Index builder                                                      */
/* ------------------------------------------------------------------ */

export interface StationIndex {
  nameSet: Set<string>;
  nameList: string[];
  nameToForce: Map<string, string>;
}

export function buildStationIndex(stations: PoliceStation[]): StationIndex {
  const nameSet = new Set<string>();
  const nameList: string[] = [];
  const nameToForce = new Map<string, string>();

  for (const s of stations) {
    const n = s.name.toLowerCase().trim();
    if (n) {
      nameSet.add(n);
      nameList.push(n);
      if (s.forceName) nameToForce.set(n, s.forceName.toLowerCase());
    }
  }
  return { nameSet, nameList, nameToForce };
}

/* ------------------------------------------------------------------ */
/*  Query normalisation                                                */
/* ------------------------------------------------------------------ */

function stripPunctuation(s: string): string {
  return s.replace(/[^\w\s-]/g, '').replace(/\s+/g, ' ').trim();
}

export function normalizeQuery(
  query: string,
  stationIndex: StationIndex,
  countyNames: string[],
): NormalizedQuery {
  const raw = query.trim();
  const cleaned = stripPunctuation(raw.toLowerCase());
  const tokens = cleaned.split(/\s+/).filter(Boolean);

  let station: string | null = null;
  let town: string | null = null;
  let county: string | null = null;
  const remainingTokens: string[] = [];

  const fullQuery = tokens.join(' ');

  // Try matching the full query or large substrings as a station name
  if (stationIndex.nameSet.has(fullQuery)) {
    station = fullQuery;
  } else {
    for (const name of stationIndex.nameList) {
      if (name.includes(fullQuery) || fullQuery.includes(name)) {
        station = name;
        break;
      }
    }
  }

  // Resolve town aliases (expand tokens)
  const expandedTokens: string[] = [];
  for (const t of tokens) {
    const aliases = TOWN_ALIASES[t];
    if (aliases) {
      town = t;
      expandedTokens.push(t, ...aliases);
    } else {
      expandedTokens.push(t);
    }
  }

  // Detect county from tokens
  const countyLower = countyNames.map((c) => c.toLowerCase());
  for (const t of tokens) {
    if (countyLower.includes(t)) {
      county = countyNames[countyLower.indexOf(t)];
      break;
    }
    // Check multi-word counties
    for (let i = 0; i < countyNames.length; i++) {
      if (countyLower[i].includes(t) || t.includes(countyLower[i])) {
        county = countyNames[i];
        break;
      }
    }
    if (county) break;

    // Check county aliases
    for (const [canonical, aliases] of Object.entries(COUNTY_ALIASES)) {
      if (t === canonical || aliases.includes(t)) {
        const match = countyNames.find((c) => c.toLowerCase() === canonical || aliases.includes(c.toLowerCase()));
        if (match) { county = match; break; }
        county = canonical;
        break;
      }
    }
    if (county) break;

    // Check force-to-county mapping
    for (const [forceKey, counties] of Object.entries(FORCE_TO_COUNTY)) {
      if (t === forceKey || forceKey.includes(t)) {
        county = counties[0];
        break;
      }
    }
    if (county) break;
  }

  // Build remaining tokens (those not consumed by station/county/town)
  for (const t of expandedTokens) {
    const isStation = station && station.includes(t);
    const isCounty = county && county.toLowerCase().includes(t);
    const isTown = town === t;
    if (!isStation && !isCounty && !isTown) {
      remainingTokens.push(t);
    }
  }

  return { raw, tokens: expandedTokens, station, town, county, remainingTokens };
}

/* ------------------------------------------------------------------ */
/*  Scoring                                                            */
/* ------------------------------------------------------------------ */

function countyMatches(repCounty: string, targetCounty: string): boolean {
  const a = repCounty.toLowerCase().trim();
  const b = targetCounty.toLowerCase().trim();
  if (!a || !b) return false;
  if (a === b || a.includes(b) || b.includes(a)) return true;

  const aliases = COUNTY_ALIASES[b] || COUNTY_ALIASES[a];
  if (aliases) {
    return aliases.some((alt) => a === alt || a.includes(alt) || alt.includes(a));
  }

  for (const counties of Object.values(FORCE_TO_COUNTY)) {
    const lowerCounties = counties.map((c) => c.toLowerCase());
    if (lowerCounties.includes(a) && lowerCounties.includes(b)) return true;
    if (lowerCounties.includes(b) && (a.includes(b) || b.includes(a))) return true;
  }

  return false;
}

export function scoreRep(rep: Representative, nq: NormalizedQuery): number {
  let score = 0;
  const repStations = (rep.stations || []).map((s) => s.toLowerCase());
  const repCounty = (rep.county || '').toLowerCase();
  const repName = (rep.name || '').toLowerCase();
  const repNotes = (rep.notes || '').toLowerCase();

  // Station matching
  if (nq.station) {
    const exactMatch = repStations.some((s) => s === nq.station);
    if (exactMatch) {
      score += 100;
    } else {
      const partialMatch = repStations.some(
        (s) => s.includes(nq.station!) || nq.station!.includes(s),
      );
      if (partialMatch) score += 70;
    }
  }

  // Token-in-station matching (for partial queries like "maidstone")
  for (const token of nq.tokens) {
    if (token.length < 3) continue;
    const tokenInStation = repStations.some((s) => s.includes(token));
    if (tokenInStation && score < 70) {
      score += 70;
      break;
    }
  }

  // Town matching (expanded aliases)
  if (nq.town) {
    const townAliases = TOWN_ALIASES[nq.town] || [nq.town];
    for (const alias of townAliases) {
      if (repStations.some((s) => s.includes(alias))) {
        score += 60;
        break;
      }
    }
  }

  // County matching
  if (nq.county) {
    if (countyMatches(rep.county || '', nq.county)) {
      score += 40;
    }
  }

  // Remaining tokens: fuzzy match across name, notes, stations
  for (const token of nq.remainingTokens) {
    if (token.length < 2) continue;
    const haystack = [repName, repCounty, repNotes, ...repStations].join(' ');

    if (haystack.includes(token)) {
      score += 25;
    } else if (token.length >= 4) {
      const words = haystack.split(/\s+/);
      const fuzzyHit = words.some((w) => w.length >= 3 && levenshtein(w, token) <= 2);
      if (fuzzyHit) score += 15;
    }
  }

  // Availability bonus
  const avail = (rep.availability || '').toLowerCase();
  if (/24|on\s*call|anytime|any\s*time/i.test(avail)) {
    score += 20;
  }

  // Accreditation bonus
  const accred = (rep.accreditation || '').toLowerCase();
  if (accred && !accred.includes('probationary')) {
    score += 10;
  }

  // Featured bonus
  if (rep.featured) {
    score += 5;
  }

  return score;
}

/* ------------------------------------------------------------------ */
/*  Main search function                                               */
/* ------------------------------------------------------------------ */

export function searchReps(
  query: string,
  reps: Representative[],
  stations: PoliceStation[],
  counties: County[],
): ScoredRep[] {
  const trimmed = query.trim();
  if (!trimmed) return reps.map((r) => ({ ...r, _score: 0 }));

  const stationIndex = buildStationIndex(stations);
  const countyNames = counties.map((c) => c.name);
  const nq = normalizeQuery(trimmed, stationIndex, countyNames);

  const scored: ScoredRep[] = reps.map((r) => ({
    ...r,
    _score: scoreRep(r, nq),
  }));

  let results = scored.filter((r) => r._score >= 30);
  results.sort((a, b) => b._score - a._score);

  if (results.length > 0) return results;

  // Fallback 1: county-only retry
  if (nq.county) {
    results = scored
      .filter((r) => countyMatches(r.county || '', nq.county!))
      .map((r) => ({ ...r, _score: Math.max(r._score, 40) }));
    results.sort((a, b) => b._score - a._score);
    if (results.length > 0) return results;
  }

  // Fallback 2: broad token match across all fields
  const allTokens = nq.tokens;
  results = scored.filter((r) => {
    const hay = [
      r.name, r.county, r.notes, ...(r.stations || []),
    ].join(' ').toLowerCase();
    return allTokens.some((t) => t.length >= 3 && hay.includes(t));
  });
  results.sort((a, b) => b._score - a._score);
  if (results.length > 0) return results.map((r) => ({ ...r, _score: Math.max(r._score, 30) }));

  // Fallback 3: return top available reps (never empty)
  scored.sort((a, b) => {
    const aAvail = /24|on\s*call/i.test(a.availability || '') ? 1 : 0;
    const bAvail = /24|on\s*call/i.test(b.availability || '') ? 1 : 0;
    if (bAvail !== aAvail) return bAvail - aAvail;
    return (a.name || '').localeCompare(b.name || '');
  });
  return scored.slice(0, 10).map((r) => ({ ...r, _score: 1 }));
}
