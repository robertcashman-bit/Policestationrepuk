import type { SearchResult } from './types';
import {
  buildRankedSearchQueries,
  type RankedSearchQuery,
  type SearchStrategy,
} from './station-aliases';
import { recentlyExhaustedStrategies, recordSearchAttempt } from './search-attempts';

export type SearchProvider = (query: string) => Promise<SearchQueryResult>;

export type SearchQueryResult = SearchResult[] | SearchQueryError;

export interface SearchQueryError {
  ok: false;
  reason: string;
  httpStatus?: number;
}

export function isSearchQueryError(result: unknown): result is SearchQueryError {
  return Boolean(
    result &&
      typeof result === 'object' &&
      !Array.isArray(result) &&
      'ok' in result &&
      (result as { ok: unknown }).ok === false &&
      'reason' in result,
  );
}

const SERPER_URL = 'https://google.serper.dev/search';

async function sleep(ms: number): Promise<void> {
  await new Promise((r) => setTimeout(r, ms));
}

async function serperSearchOnce(query: string): Promise<SearchQueryResult> {
  const key = process.env.SERPER_API_KEY?.trim();
  if (!key) {
    return { ok: false, reason: 'SERPER_API_KEY missing' };
  }

  const res = await fetch(SERPER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': key,
    },
    body: JSON.stringify({ q: query, gl: 'uk', hl: 'en', num: 10 }),
  });

  if (!res.ok) {
    return { ok: false, reason: `Serper HTTP ${res.status}`, httpStatus: res.status };
  }
  const data = (await res.json()) as {
    organic?: Array<{ title?: string; link?: string; snippet?: string; date?: string }>;
  };

  return (data.organic ?? [])
    .filter((r) => r.link?.startsWith('http'))
    .map((r) => ({
      title: r.title ?? '',
      url: r.link!,
      snippet: r.snippet ?? '',
      date: r.date,
    }));
}

/** Serper search with lightweight retry on 429 / 5xx. */
export async function serperSearch(query: string): Promise<SearchQueryResult> {
  let last: SearchQueryResult = { ok: false, reason: 'unknown' };
  for (let attempt = 0; attempt < 3; attempt++) {
    last = await serperSearchOnce(query);
    if (!isSearchQueryError(last)) return last;
    const status = last.httpStatus ?? 0;
    if (status !== 429 && status < 500) return last;
    await sleep(400 * 2 ** attempt);
  }
  return last;
}

/** @deprecated Prefer buildRankedSearchQueries — kept for existing callers/tests. */
export function buildSearchQueries(suite: import('./types').CustodySuite): string[] {
  return buildRankedSearchQueries(suite).map((q) => q.query);
}

export function isSerperConfigured(): boolean {
  return Boolean(process.env.SERPER_API_KEY?.trim());
}

export function defaultMaxSearchQueries(): number {
  return Math.max(1, Number(process.env.CUSTODY_DISCOVERY_MAX_QUERIES ?? 8));
}

export function defaultFallbackSearchQueries(): number {
  return Math.max(
    defaultMaxSearchQueries(),
    Number(process.env.CUSTODY_DISCOVERY_FALLBACK_QUERIES ?? 14),
  );
}

export interface SuiteSearchOutcome {
  results: SearchResult[];
  queriesRun: number;
  queryErrors: string[];
  strategiesUsed: SearchStrategy[];
  exhaustedWithoutResults: boolean;
}

function selectQueriesForRun(
  ranked: RankedSearchQuery[],
  maxQueries: number,
  exhausted: Set<string>,
): RankedSearchQuery[] {
  const preferred = ranked.filter((q) => !exhausted.has(`${q.strategy}::${q.query.toLowerCase()}`));
  const pool = preferred.length > 0 ? preferred : ranked;
  return pool.slice(0, maxQueries);
}

/**
 * Multi-query search with fallbacks.
 * - Continues after per-query Serper errors (does not abort the suite).
 * - Expands to fallback query budget when early queries return empty.
 * - Records attempts in KV when available.
 */
export async function searchForSuite(
  suite: import('./types').CustodySuite,
  provider: SearchProvider = serperSearch,
  maxQueries = defaultMaxSearchQueries(),
): Promise<SearchResult[] | SearchQueryError | SuiteSearchOutcome> {
  if (provider === serperSearch && !isSerperConfigured()) {
    return { ok: false, reason: 'SERPER_API_KEY missing' };
  }

  const ranked = buildRankedSearchQueries(suite);
  const fallbackBudget = Math.max(maxQueries, defaultFallbackSearchQueries());
  const exhausted =
    provider === serperSearch ? await recentlyExhaustedStrategies(suite.id) : new Set<string>();

  let budget = maxQueries;
  const selected = selectQueriesForRun(ranked, budget, exhausted);
  const seen = new Set<string>();
  const results: SearchResult[] = [];
  const queryErrors: string[] = [];
  const strategiesUsed: SearchStrategy[] = [];
  let queriesRun = 0;

  const runBatch = async (batch: RankedSearchQuery[]) => {
    for (const item of batch) {
      const startedAt = new Date().toISOString();
      queriesRun++;
      strategiesUsed.push(item.strategy);
      const rows = await provider(item.query);

      if (isSearchQueryError(rows)) {
        queryErrors.push(`${item.strategy}: ${rows.reason}`);
        await recordSearchAttempt({
          stationId: suite.id,
          query: item.query,
          provider: provider === serperSearch ? 'serper' : 'custom',
          strategy: item.strategy,
          status: 'error',
          resultCount: 0,
          errorCode: rows.httpStatus ? String(rows.httpStatus) : 'provider_error',
          errorMessage: rows.reason,
          startedAt,
        });
        // Auth / missing key: stop further spend
        if (/SERPER_API_KEY missing|Serper HTTP 401|Serper HTTP 403/i.test(rows.reason)) {
          return;
        }
        continue;
      }

      await recordSearchAttempt({
        stationId: suite.id,
        query: item.query,
        provider: provider === serperSearch ? 'serper' : 'custom',
        strategy: item.strategy,
        status: rows.length === 0 ? 'empty' : 'ok',
        resultCount: rows.length,
        startedAt,
      });

      for (const row of rows) {
        const key = row.url.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        results.push(row);
      }
    }
  };

  await runBatch(selected);

  // Adaptive fallback: if nothing useful yet, spend remaining budget on next strategies
  if (results.length === 0 && budget < fallbackBudget) {
    budget = fallbackBudget;
    const more = selectQueriesForRun(ranked, budget, exhausted).slice(selected.length);
    await runBatch(more);
  } else if (results.length < 3 && budget < fallbackBudget) {
    // Sparse results — try a few more identity/postcode strategies
    const extra = Math.min(fallbackBudget, budget + 4);
    const more = selectQueriesForRun(ranked, extra, exhausted).slice(selected.length);
    await runBatch(more);
  }

  // Only hard-fail the suite when every query failed with the same fatal config error
  if (
    results.length === 0 &&
    queryErrors.length > 0 &&
    queryErrors.every((e) => /SERPER_API_KEY missing/i.test(e))
  ) {
    return { ok: false, reason: 'SERPER_API_KEY missing' };
  }

  return {
    results,
    queriesRun,
    queryErrors,
    strategiesUsed: [...new Set(strategiesUsed)],
    exhaustedWithoutResults: results.length === 0,
  };
}

export function isSuiteSearchOutcome(
  value: SearchResult[] | SearchQueryError | SuiteSearchOutcome,
): value is SuiteSearchOutcome {
  return Boolean(value && typeof value === 'object' && 'results' in value && 'queriesRun' in value);
}

export { buildRankedSearchQueries };
export type { RankedSearchQuery, SearchStrategy };
