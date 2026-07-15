/**
 * Station identity helpers for multi-query web search.
 * Builds aliases and ordered search strategies without guessing phone numbers.
 */

import type { CustodySuite } from './types';

export interface StationSearchIdentity {
  canonicalName: string;
  shortName: string;
  forceName: string;
  forceDomain: string;
  address: string;
  postcode: string;
  town: string;
  county: string;
  aliases: string[];
  isDedicatedCustodySuite: boolean;
}

export function stationSearchLabel(name: string): string {
  return name
    .replace(/\s*police station\s*/gi, ' ')
    .replace(/\s*custody suite\s*/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function townFromAddress(address: string, postcode: string): string {
  if (!address?.trim()) return '';
  const withoutPostcode = postcode
    ? address.replace(new RegExp(postcode.replace(/\s+/g, '\\s*'), 'i'), '')
    : address;
  const parts = withoutPostcode
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length >= 2) return parts[parts.length - 1]!;
  return parts[0] ?? '';
}

/** Derive searchable aliases from suite identity fields. */
export function buildStationAliases(suite: CustodySuite): string[] {
  const canonical = suite.custodySuiteName || suite.policeStationName;
  const shortName = stationSearchLabel(canonical);
  const aliases = new Set<string>();

  if (canonical) aliases.add(canonical);
  if (shortName && shortName.toLowerCase() !== canonical.toLowerCase()) {
    aliases.add(shortName);
    aliases.add(`${shortName} Police Station`);
  }
  if (suite.policeStationName && suite.policeStationName !== canonical) {
    aliases.add(suite.policeStationName);
  }
  for (const a of suite.aliases ?? []) {
    if (a?.trim()) aliases.add(a.trim());
  }

  return [...aliases].filter(Boolean);
}

export function resolveStationSearchIdentity(suite: CustodySuite): StationSearchIdentity {
  const canonicalName = suite.custodySuiteName || suite.policeStationName;
  const postcode = (suite.postcode ?? '').trim().toUpperCase();
  const address = suite.address ?? '';
  const town = (suite.town ?? townFromAddress(address, postcode)).trim();

  return {
    canonicalName,
    shortName: stationSearchLabel(canonicalName),
    forceName: suite.forceName,
    forceDomain: suite.forceDomain,
    address,
    postcode,
    town,
    county: suite.county ?? '',
    aliases: buildStationAliases(suite),
    isDedicatedCustodySuite:
      suite.isDedicatedCustodySuite ?? /custody|justice centre/i.test(canonicalName),
  };
}

export type SearchStrategy =
  | 'canonical_custody'
  | 'enquiry_office'
  | 'name_town'
  | 'postcode'
  | 'address'
  | 'alias'
  | 'force_domain'
  | 'police_uk'
  | 'gov_uk'
  | 'pdf_official'
  | 'force_directory'
  | 'opening_times'
  | 'contact_us';

export interface RankedSearchQuery {
  query: string;
  strategy: SearchStrategy;
  tier: 1 | 2 | 3;
}

/**
 * Ordered query list: Tier 1 official targeting first, then identity variants,
 * then broader corroborating strategies. Callers slice by budget / fallback.
 */
export function buildRankedSearchQueries(suite: CustodySuite): RankedSearchQuery[] {
  const id = resolveStationSearchIdentity(suite);
  const domain = id.forceDomain;
  const force = id.forceName;
  const name = id.canonicalName;
  const short = id.shortName;
  const out: RankedSearchQuery[] = [];
  const seen = new Set<string>();

  const add = (query: string, strategy: SearchStrategy, tier: 1 | 2 | 3) => {
    const q = query.replace(/\s+/g, ' ').trim();
    if (!q || seen.has(q.toLowerCase())) return;
    seen.add(q.toLowerCase());
    out.push({ query: q, strategy, tier });
  };

  // Tier 1 — for ordinary stations, put enquiry/postcode early so the default
  // query budget (8) is not spent only on custody wording.
  if (!id.isDedicatedCustodySuite) {
    add(`"${name}" police station telephone number`, 'enquiry_office', 1);
    add(`"${name}" police contact number`, 'enquiry_office', 1);
    add(`"${name}" police station phone`, 'enquiry_office', 1);
    add(`"${name}" police enquiry office`, 'enquiry_office', 1);
    if (id.postcode) {
      add(`"${id.postcode}" police station`, 'postcode', 1);
      add(`"${name}" "${id.postcode}"`, 'postcode', 1);
    }
    if (id.town) {
      add(`"${short}" police station ${id.town} telephone`, 'name_town', 1);
    }
  }

  // Tier 1 — official / high-signal custody + contact queries
  add(`"${name}" custody telephone`, 'canonical_custody', 1);
  add(`"${name}" police custody phone number`, 'canonical_custody', 1);
  add(`"${name}" custody suite telephone`, 'canonical_custody', 1);
  add(`"${force}" "${short}" custody telephone`, 'canonical_custody', 1);
  if (domain) {
    add(`site:${domain} "${short}" telephone`, 'force_domain', 1);
    add(`site:${domain} "${short}" custody`, 'force_domain', 1);
    add(`site:${domain} custody telephone`, 'force_domain', 1);
    add(`site:${domain} custody suite`, 'force_domain', 1);
  }
  add(`site:police.uk "${name}"`, 'police_uk', 1);
  add(`site:police.uk "${short}" custody`, 'police_uk', 1);
  add(`site:gov.uk "${name}" police`, 'gov_uk', 1);
  add(`filetype:pdf "${force}" custody suite telephone number`, 'pdf_official', 1);
  add(`filetype:pdf "${force}" "${short}" custody`, 'pdf_official', 1);

  // Enquiry / public contact variants (also for dedicated custody suites)
  add(`"${name}" police enquiry office`, 'enquiry_office', 1);
  add(`"${name}" police station telephone number`, 'enquiry_office', 1);
  add(`"${name}" police contact number`, 'enquiry_office', 1);
  add(`"${name}" police station phone`, 'enquiry_office', 1);
  add(`"${name}" "contact us" police`, 'contact_us', 2);
  add(`"${name}" "opening times" telephone`, 'opening_times', 2);

  // Identity fallbacks
  if (id.town) {
    add(`"${short}" police station ${id.town} telephone`, 'name_town', 2);
    add(`"${name}" ${id.town} custody`, 'name_town', 2);
  }
  if (id.postcode) {
    add(`"${id.postcode}" police station`, 'postcode', 2);
    add(`${id.postcode} police telephone`, 'postcode', 2);
    add(`"${name}" "${id.postcode}"`, 'postcode', 2);
  }
  if (id.address && id.address.length > 12) {
    add(`"${id.address}" police station`, 'address', 2);
  }

  for (const alias of id.aliases.slice(0, 4)) {
    if (alias.toLowerCase() === name.toLowerCase()) continue;
    add(`"${alias}" custody telephone`, 'alias', 2);
    add(`"${alias}" police station phone`, 'alias', 2);
  }

  // Force-wide directories / corroboration
  add(`"${force}" custody suite contact`, 'force_directory', 2);
  add(`"${force}" custody telephone number`, 'force_directory', 2);
  add(`"${name}" "telephone"`, 'enquiry_office', 3);
  add(`"${name}" custody`, 'canonical_custody', 3);

  return out;
}
