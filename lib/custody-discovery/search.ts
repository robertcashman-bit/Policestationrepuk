import type { SearchResult } from './types';
import {
  getDefaultWebSearchProvider,
  isWebSearchConfigured,
  isWebSearchError,
  serperSearch as sharedSerperSearch,
  type WebSearchProvider,
  type WebSearchResult,
} from '@/lib/web-search/provider';

export type SearchProvider = (query: string) => Promise<SearchQueryResult>;

export type SearchQueryResult = SearchResult[] | SearchQueryError;

export interface SearchQueryError {
  ok: false;
  reason: string;
}

export function isSearchQueryError(result: SearchQueryResult): result is SearchQueryError {
  return !Array.isArray(result) && 'ok' in result && result.ok === false;
}

async function adaptProvider(provider: WebSearchProvider, query: string): Promise<SearchQueryResult> {
  const result: WebSearchResult = await provider(query);
  if (isWebSearchError(result)) return result;
  return result.map((r) => ({
    title: r.title,
    url: r.url,
    snippet: r.snippet,
    date: r.date,
  }));
}

const serperSearch: SearchProvider = (query) => adaptProvider(sharedSerperSearch, query);

function stationSearchLabel(name: string): string {
  return name
    .replace(/\s*police station\s*/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildSearchQueries(suite: import('./types').CustodySuite): string[] {
  const name = suite.custodySuiteName || suite.policeStationName;
  const shortName = stationSearchLabel(name);
  const force = suite.forceName;
  const domain = suite.forceDomain;
  const dedicated = suite.isDedicatedCustodySuite ?? /custody|justice centre/i.test(name);

  const stationQueries = dedicated
    ? [
        `"${name}" custody desk telephone`,
        `"${name}" custody suite telephone OR phone`,
        `"${name}" police custody phone number`,
        `"${name}" custody suite telephone site:.gov.uk OR site:.police.uk`,
      ]
    : [
        `"${name}" custody desk telephone`,
        `"${name}" custody telephone number`,
        `"${name}" police station custody phone`,
        `"${force}" "${shortName}" custody desk telephone`,
        `"${shortName}" custody suite contact`,
        `site:${domain} "${shortName}" custody telephone OR phone`,
      ];

  return [
    ...stationQueries,
    `"${force}" custody suite contact telephone`,
    `"${force}" custody telephone number`,
    `site:${domain} custody telephone`,
    `site:${domain} custody suite`,
    `site:whatdotheyknow.com "${force}" custody telephone`,
    `filetype:pdf "${force}" custody suite telephone number`,
    `filetype:pdf "${force}" custody contact police`,
    `site:police.uk "${name}" custody`,
  ];
}

export function isSerperConfigured(): boolean {
  return isWebSearchConfigured();
}

export async function searchForSuite(
  suite: import('./types').CustodySuite,
  provider: SearchProvider = serperSearch,
  maxQueries = 4,
): Promise<SearchResult[] | SearchQueryError> {
  if (provider === serperSearch && !isSerperConfigured()) {
    return { ok: false, reason: 'SERPER_API_KEY missing' };
  }

  const queries = buildSearchQueries(suite).slice(0, maxQueries);
  const seen = new Set<string>();
  const results: SearchResult[] = [];

  for (const q of queries) {
    const rows = await provider(q);
    if (isSearchQueryError(rows)) {
      return rows;
    }
    for (const row of rows) {
      const key = row.url.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      results.push(row);
    }
  }
  return results;
}

export { serperSearch, getDefaultWebSearchProvider };
