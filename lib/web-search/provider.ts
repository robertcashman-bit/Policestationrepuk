/**
 * Shared web search provider abstraction.
 * Custody discovery and station research both use this — do not hard-code
 * provider secrets; configure via environment variables.
 */

export interface WebSearchHit {
  title: string;
  url: string;
  snippet: string;
  date?: string;
}

export type WebSearchResult = WebSearchHit[] | { ok: false; reason: string };

export type WebSearchProvider = (query: string) => Promise<WebSearchResult>;

export function isWebSearchError(
  result: WebSearchResult,
): result is { ok: false; reason: string } {
  return !Array.isArray(result) && 'ok' in result && result.ok === false;
}

const SERPER_URL = 'https://google.serper.dev/search';

export function isWebSearchConfigured(): boolean {
  const provider = (process.env.WEB_SEARCH_PROVIDER ?? 'serper').trim().toLowerCase();
  if (provider === 'serper' || provider === '') {
    return Boolean(process.env.SERPER_API_KEY?.trim());
  }
  if (provider === 'brave') {
    return Boolean(process.env.BRAVE_SEARCH_API_KEY?.trim());
  }
  if (provider === 'bing') {
    return Boolean(process.env.BING_SEARCH_API_KEY?.trim());
  }
  return false;
}

async function serperSearch(query: string): Promise<WebSearchResult> {
  const key = process.env.SERPER_API_KEY?.trim();
  if (!key) return { ok: false, reason: 'SERPER_API_KEY missing' };

  const res = await fetch(SERPER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': key,
    },
    body: JSON.stringify({ q: query, gl: 'uk', hl: 'en', num: 10 }),
  });

  if (!res.ok) return { ok: false, reason: `Serper HTTP ${res.status}` };

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

async function braveSearch(query: string): Promise<WebSearchResult> {
  const key = process.env.BRAVE_SEARCH_API_KEY?.trim();
  if (!key) return { ok: false, reason: 'BRAVE_SEARCH_API_KEY missing' };

  const url = new URL('https://api.search.brave.com/res/v1/web/search');
  url.searchParams.set('q', query);
  url.searchParams.set('count', '10');
  url.searchParams.set('country', 'GB');

  const res = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
      'X-Subscription-Token': key,
    },
  });
  if (!res.ok) return { ok: false, reason: `Brave HTTP ${res.status}` };

  const data = (await res.json()) as {
    web?: { results?: Array<{ title?: string; url?: string; description?: string }> };
  };
  return (data.web?.results ?? [])
    .filter((r) => r.url?.startsWith('http'))
    .map((r) => ({
      title: r.title ?? '',
      url: r.url!,
      snippet: r.description ?? '',
    }));
}

async function bingSearch(query: string): Promise<WebSearchResult> {
  const key = process.env.BING_SEARCH_API_KEY?.trim();
  if (!key) return { ok: false, reason: 'BING_SEARCH_API_KEY missing' };

  const url = new URL('https://api.bing.microsoft.com/v7.0/search');
  url.searchParams.set('q', query);
  url.searchParams.set('mkt', 'en-GB');
  url.searchParams.set('count', '10');

  const res = await fetch(url.toString(), {
    headers: { 'Ocp-Apim-Subscription-Key': key },
  });
  if (!res.ok) return { ok: false, reason: `Bing HTTP ${res.status}` };

  const data = (await res.json()) as {
    webPages?: { value?: Array<{ name?: string; url?: string; snippet?: string }> };
  };
  return (data.webPages?.value ?? [])
    .filter((r) => r.url?.startsWith('http'))
    .map((r) => ({
      title: r.name ?? '',
      url: r.url!,
      snippet: r.snippet ?? '',
    }));
}

/** Resolve the configured provider (default: Serper). */
export function getDefaultWebSearchProvider(): WebSearchProvider {
  const provider = (process.env.WEB_SEARCH_PROVIDER ?? 'serper').trim().toLowerCase();
  if (provider === 'brave') return braveSearch;
  if (provider === 'bing') return bingSearch;
  return serperSearch;
}

export async function webSearch(
  query: string,
  provider: WebSearchProvider = getDefaultWebSearchProvider(),
): Promise<WebSearchResult> {
  return provider(query);
}

export { serperSearch, braveSearch, bingSearch };
