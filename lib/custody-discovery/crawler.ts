import crypto from 'crypto';
import {
  confidenceLevelFromScore,
  initialFindingStatus,
  scoreConfidence,
  shouldAutoRejectFinding,
} from './confidence';
import { classifyPhoneNumber } from './classify';
import { hashSourceEvidence } from './hash';
import { numberSafetyFlags } from './number-safety';
import { toE164Uk } from '@/lib/phone-format';
import {
  extractPhonesFromText,
  hasCustodyWordingNear,
  isValidCustodyCandidate,
  listScoredCustodyCandidatePhones,
  pickBestCustodyCandidatePhone,
  type ExtractedPhone,
  type PhonePickContext,
} from './phone';
import { fetchOfficialSources } from './official-pages';
import { fetchOsmPhoneSources } from './openstreetmap';
import { isPdfUrl } from './pdf-text';
import {
  searchForSuite,
  isSearchQueryError,
  isSuiteSearchOutcome,
  defaultMaxSearchQueries,
  defaultFallbackSearchQueries,
  type SearchProvider,
} from './search';
import { fetchPageTextFromUrl } from './source-evidence';
import { detectSourceType, extractDomain } from './source-type';
import {
  getApprovedNumber,
  getFindingByHash,
  getFindingsForSuite,
  saveFinding,
} from './storage';
import { selectSuiteBatch } from './cursor';
import type { CrawlerRunStats, CustodyNumberFinding, CustodySuite, SearchResult } from './types';

/** Never store these — noise, not labelled contact outcomes. */
const REJECT_CLASSIFICATIONS = new Set([
  'irrelevant',
  'solicitor_office',
  'victim_witness',
]);

/** Cap how many distinct scored phones we persist per URL. */
const MAX_CANDIDATES_PER_HIT = 6;

function newFindingId(): string {
  return `cnf_${Date.now().toString(36)}_${crypto.randomBytes(4).toString('hex')}`;
}

export { defaultMaxSearchQueries };

export function maxPageFetchesPerSuite(): number {
  return Math.max(0, Number(process.env.CUSTODY_DISCOVERY_PAGE_FETCH_LIMIT ?? 6));
}

function phonePickContext(suite: CustodySuite): PhonePickContext {
  return {
    forceName: suite.forceName,
    suiteNames: [suite.custodySuiteName, suite.policeStationName, ...(suite.aliases ?? [])],
  };
}

export function mergeSearchResults(...lists: SearchResult[][]): SearchResult[] {
  const seen = new Set<string>();
  const merged: SearchResult[] = [];
  for (const list of lists) {
    for (const row of list) {
      const key = row.url.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(row);
    }
  }
  return merged;
}

function urlFetchPriority(url: string): number {
  const u = url.toLowerCase();
  if (u.includes('.police.uk') || u.includes('police.uk/')) return 4;
  if (u.includes('gov.uk')) return 3;
  if (isPdfUrl(u)) return 3;
  if (u.includes('openstreetmap.org')) return 2;
  return 1;
}

function isFetchableUrl(url: string): boolean {
  return url.startsWith('http');
}

function snippetNeedsPageFetch(hit: SearchResult, opts: PhonePickContext): boolean {
  const combined = `${hit.title} ${hit.snippet}`;
  const phone = pickBestCustodyCandidatePhone(combined, opts);
  if (!phone) return true;
  return !hasCustodyWordingNear(phone.context);
}

function resolvePhonesFromHit(
  hit: SearchResult,
  opts: PhonePickContext,
  pageText?: string,
): ExtractedPhone[] {
  const combined = `${hit.title} ${hit.snippet}`;
  const extractSource = pageText ? `${combined} ${pageText}` : combined;
  const scored = listScoredCustodyCandidatePhones(extractSource, opts);
  if (scored.length > 0) return scored.slice(0, MAX_CANDIDATES_PER_HIT);

  // Fallback: best single even if below shared list (legacy path)
  const fromSnippet = pickBestCustodyCandidatePhone(combined, opts);
  if (fromSnippet && hasCustodyWordingNear(fromSnippet.context)) return [fromSnippet];
  if (pageText) {
    const fromPage = pickBestCustodyCandidatePhone(pageText, opts);
    if (fromPage) return [fromPage];
  }
  return fromSnippet ? [fromSnippet] : [];
}

async function buildPageTextCache(
  hits: SearchResult[],
  opts: PhonePickContext,
  budget: number,
): Promise<Map<string, string>> {
  const cache = new Map<string, string>();
  if (budget <= 0) return cache;

  const candidates = hits
    .filter((hit) => isFetchableUrl(hit.url) && snippetNeedsPageFetch(hit, opts))
    .sort((a, b) => urlFetchPriority(b.url) - urlFetchPriority(a.url));

  for (const hit of candidates) {
    if (cache.size >= budget) break;
    if (cache.has(hit.url)) continue;
    const text = await fetchPageTextFromUrl(hit.url);
    if (text) cache.set(hit.url, text);
  }

  return cache;
}

export interface ProcessSearchResultInput {
  suite: CustodySuite;
  title: string;
  url: string;
  snippet: string;
  date?: string;
  existingFindings: CustodyNumberFinding[];
  searchProvider?: SearchProvider;
  pageText?: string;
  /** When set, only this candidate is processed (multi-candidate loop). */
  candidatePhone?: ExtractedPhone;
}

async function persistPhoneCandidate(
  input: ProcessSearchResultInput,
  phone: ExtractedPhone,
): Promise<{ action: 'created' | 'updated' | 'rejected' | 'duplicate'; finding?: CustodyNumberFinding }> {
  const { suite, title, url, snippet, date } = input;

  if (!isValidCustodyCandidate(phone.display, suite.forceName)) {
    return { action: 'rejected' };
  }

  const sourceType = detectSourceType(url, title);
  const sourceDomain = extractDomain(url);
  const hash = hashSourceEvidence({
    custodySuiteId: suite.id,
    normalizedPhoneNumber: phone.normalized,
    sourceUrl: url,
    pageSnippet: phone.context,
  });

  const duplicate = await getFindingByHash(hash);
  if (duplicate) {
    const now = new Date().toISOString();
    const updated: CustodyNumberFinding = { ...duplicate, lastChecked: now, updatedAt: now };
    await saveFinding(updated);
    return { action: 'duplicate', finding: updated };
  }

  const sameNumberCount =
    input.existingFindings.filter(
      (f) => f.normalizedPhoneNumber === phone.normalized && f.status !== 'rejected',
    ).length + 1;

  const distinctNumbers = new Set(
    input.existingFindings
      .filter((f) => f.status !== 'rejected')
      .map((f) => f.normalizedPhoneNumber),
  );
  distinctNumbers.add(phone.normalized);
  const hasConflictingNumbers = distinctNumbers.size > 1;

  const approved = await getApprovedNumber(suite.id);
  const conflictsWithApproved =
    approved &&
    approved.normalizedPhoneNumber !== phone.normalized &&
    approved.publicVisible;

  const confidenceScore = scoreConfidence({
    sourceType,
    sourceUrl: url,
    sourceTitle: title,
    pageSnippet: phone.context,
    matchingSourceCount: input.existingFindings.length + 1,
    sameNumberSourceCount: sameNumberCount,
    sourceDate: date,
    isArchiveOnly: sourceType === 'archived',
    hasConflictingNumbers,
  });

  const classification = await classifyPhoneNumber({
    phoneNumber: phone.display,
    pageSnippet: phone.context,
    sourceTitle: title,
    custodySuiteName: suite.custodySuiteName,
    forceName: suite.forceName,
  });

  if (shouldAutoRejectFinding(confidenceScore, url) || REJECT_CLASSIFICATIONS.has(classification)) {
    return { action: 'rejected' };
  }

  // Persist switchboard / 101 as labelled outcomes (not publishable as direct custody)
  const now = new Date().toISOString();
  const hasConflict = hasConflictingNumbers || Boolean(conflictsWithApproved);
  const status = initialFindingStatus();
  const conflictReason = hasConflict ? 'possible_conflict' : undefined;

  const finding: CustodyNumberFinding = {
    id: newFindingId(),
    custodySuiteId: suite.id,
    forceName: suite.forceName,
    custodySuiteName: suite.custodySuiteName,
    policeStationName: suite.policeStationName,
    possiblePhoneNumber: phone.display,
    normalizedPhoneNumber: phone.normalized,
    e164: toE164Uk(phone.normalized),
    numberFlags: numberSafetyFlags(phone.normalized),
    sourceTitle: title,
    sourceUrl: url,
    sourceDomain,
    sourceType,
    pageSnippet: phone.context || snippet,
    classification,
    confidenceScore,
    confidenceLevel: confidenceLevelFromScore(confidenceScore),
    status,
    dateFound: now,
    lastChecked: now,
    hashOfSourceEvidence: hash,
    notes: '',
    conflictReason,
    createdAt: now,
    updatedAt: now,
  };

  await saveFinding(finding);
  return { action: 'created', finding };
}

export async function processSearchHit(
  input: ProcessSearchResultInput,
): Promise<{ action: 'created' | 'updated' | 'rejected' | 'duplicate'; finding?: CustodyNumberFinding }> {
  const { suite, title, url, snippet, pageText, candidatePhone } = input;

  if (!url?.trim().startsWith('http')) {
    return { action: 'rejected' };
  }

  if (candidatePhone) {
    return persistPhoneCandidate(input, candidatePhone);
  }

  const phones = resolvePhonesFromHit({ title, url, snippet }, phonePickContext(suite), pageText);
  if (phones.length === 0) return { action: 'rejected' };
  return persistPhoneCandidate(input, phones[0]!);
}

/** Process every scored phone on a hit (max MAX_CANDIDATES_PER_HIT). */
export async function processAllPhonesFromHit(
  input: ProcessSearchResultInput,
): Promise<Array<{ action: 'created' | 'updated' | 'rejected' | 'duplicate'; finding?: CustodyNumberFinding }>> {
  const { suite, title, url, snippet, pageText } = input;
  if (!url?.trim().startsWith('http')) return [{ action: 'rejected' }];

  const phones = resolvePhonesFromHit({ title, url, snippet }, phonePickContext(suite), pageText);
  if (phones.length === 0) return [{ action: 'rejected' }];

  const outcomes = [];
  for (const phone of phones) {
    const outcome = await persistPhoneCandidate({ ...input, candidatePhone: phone }, phone);
    outcomes.push(outcome);
    if (outcome.finding && outcome.action === 'created') {
      input.existingFindings.push(outcome.finding);
    }
  }
  return outcomes;
}

export interface CrawlSuiteOptions {
  searchProvider?: SearchProvider;
  maxQueries?: number;
  includeOsm?: boolean;
}

export async function crawlCustodySuite(
  suite: CustodySuite,
  options: CrawlSuiteOptions = {},
): Promise<{
  searchesRun: number;
  numbersExtracted: number;
  created: number;
  updated: number;
  rejected: number;
  conflicts: number;
  officialPagesFetched: number;
  pageFetchesUsed: number;
  osmResults: number;
  queryErrors: string[];
  newFindingIds: string[];
  exhaustedWithoutResults: boolean;
}> {
  const maxQueries = options.maxQueries ?? defaultMaxSearchQueries();
  const pickOpts = phonePickContext(suite);
  const includeOsm = options.includeOsm ?? process.env.CUSTODY_DISCOVERY_OSM !== 'false';

  const [serperOutcome, officialResults, osmResults] = await Promise.all([
    searchForSuite(suite, options.searchProvider, maxQueries),
    fetchOfficialSources(suite),
    includeOsm ? fetchOsmPhoneSources(suite) : Promise.resolve([] as SearchResult[]),
  ]);

  if (isSearchQueryError(serperOutcome)) {
    throw new Error(serperOutcome.reason);
  }

  const searchMeta = isSuiteSearchOutcome(serperOutcome)
    ? serperOutcome
    : {
        results: serperOutcome as SearchResult[],
        queriesRun: maxQueries,
        queryErrors: [] as string[],
        strategiesUsed: [],
        exhaustedWithoutResults: (serperOutcome as SearchResult[]).length === 0,
      };

  const results = mergeSearchResults(officialResults, searchMeta.results, osmResults);
  const pageTextCache = await buildPageTextCache(results, pickOpts, maxPageFetchesPerSuite());

  const existing = await getFindingsForSuite(suite.id);

  let created = 0;
  let updated = 0;
  let rejected = 0;
  let conflicts = 0;
  let numbersExtracted = 0;
  const newFindingIds: string[] = [];

  const processHits = async (hits: SearchResult[]) => {
    for (const hit of hits) {
      const pageText = pageTextCache.get(hit.url);
      const extractSource = pageText
        ? `${hit.title} ${hit.snippet} ${pageText}`
        : `${hit.title} ${hit.snippet}`;
      numbersExtracted += extractPhonesFromText(extractSource, 120, suite.forceName).length;

      const outcomes = await processAllPhonesFromHit({
        suite,
        title: hit.title,
        url: hit.url,
        snippet: hit.snippet,
        date: hit.date,
        existingFindings: existing,
        searchProvider: options.searchProvider,
        pageText,
      });

      for (const outcome of outcomes) {
        if (outcome.action === 'created') {
          created++;
          if (outcome.finding?.id) newFindingIds.push(outcome.finding.id);
          if (outcome.finding?.conflictReason) conflicts++;
        } else if (outcome.action === 'duplicate') {
          updated++;
        } else {
          rejected++;
        }
      }
    }
  };

  await processHits(results);

  // Adaptive identity search: SERP rows ≠ phones. If nothing persisted, spend
  // remaining fallback query budget on unused strategies.
  const fallbackBudget = defaultFallbackSearchQueries();
  let queriesRun = searchMeta.queriesRun;
  let queryErrors = [...searchMeta.queryErrors];
  if (created === 0 && queriesRun < fallbackBudget) {
    const retryOutcome = await searchForSuite(
      suite,
      options.searchProvider,
      fallbackBudget,
    );
    if (!isSearchQueryError(retryOutcome)) {
      const retryMeta = isSuiteSearchOutcome(retryOutcome)
        ? retryOutcome
        : {
            results: retryOutcome as SearchResult[],
            queriesRun: fallbackBudget,
            queryErrors: [] as string[],
            strategiesUsed: [],
            exhaustedWithoutResults: (retryOutcome as SearchResult[]).length === 0,
          };
      queriesRun = Math.max(queriesRun, retryMeta.queriesRun);
      queryErrors.push(...retryMeta.queryErrors);
      const extraHits = mergeSearchResults(retryMeta.results).filter(
        (hit) => !results.some((r) => r.url.toLowerCase() === hit.url.toLowerCase()),
      );
      if (extraHits.length > 0) {
        const extraCache = await buildPageTextCache(
          extraHits,
          pickOpts,
          maxPageFetchesPerSuite(),
        );
        for (const [url, text] of extraCache) pageTextCache.set(url, text);
        await processHits(extraHits);
      }
    }
  }

  return {
    searchesRun: queriesRun,
    numbersExtracted,
    created,
    updated,
    rejected,
    conflicts,
    officialPagesFetched: officialResults.length,
    pageFetchesUsed: pageTextCache.size,
    osmResults: osmResults.length,
    queryErrors,
    newFindingIds,
    exhaustedWithoutResults: searchMeta.exhaustedWithoutResults && created === 0,
  };
}

export interface CrawlAllOptions extends CrawlSuiteOptions {
  limit?: number;
  suiteIds?: string[];
  /** When true (default), rotate batch cursor across cron runs. */
  useCursor?: boolean;
}

export interface CrawlerRunResult {
  stats: CrawlerRunStats;
  newFindingIds: string[];
}

export async function runCustodyDiscoveryCrawler(
  suites: CustodySuite[],
  options: CrawlAllOptions = {},
): Promise<CrawlerRunResult> {
  const started = Date.now();
  const useCursor = options.useCursor !== false;
  let target: CustodySuite[];
  let batchCursor = 0;
  let batchStartIndex = 0;
  let batchTotal = suites.filter((s) => s.active).length;
  let scannedSuiteIds: string[] = [];

  if (options.suiteIds?.length) {
    const set = new Set(options.suiteIds);
    target = suites.filter((s) => s.active && set.has(s.id));
    scannedSuiteIds = target.map((s) => s.id);
  } else if (options.limit && useCursor) {
    const selection = await selectSuiteBatch(suites, options.limit);
    target = selection.batch;
    batchCursor = selection.nextCursor;
    batchStartIndex = selection.batchStartIndex;
    batchTotal = selection.total;
    scannedSuiteIds = selection.scannedSuiteIds;
  } else {
    target = suites.filter((s) => s.active);
    if (options.limit) target = target.slice(0, options.limit);
    scannedSuiteIds = target.map((s) => s.id);
  }

  const stats: CrawlerRunStats = {
    suitesScanned: 0,
    searchesRun: 0,
    numbersExtracted: 0,
    findingsCreated: 0,
    findingsUpdated: 0,
    findingsRejected: 0,
    conflictsFlagged: 0,
    officialPagesFetched: 0,
    pageFetchesUsed: 0,
    batchCursor,
    batchStartIndex,
    batchTotal,
    scannedSuiteIds,
    elapsedMs: 0,
  };
  const newFindingIds: string[] = [];

  for (const suite of target) {
    try {
      const row = await crawlCustodySuite(suite, options);
      stats.searchesRun += row.searchesRun;
      stats.numbersExtracted += row.numbersExtracted;
      stats.findingsCreated += row.created;
      stats.findingsUpdated += row.updated;
      stats.findingsRejected += row.rejected;
      stats.conflictsFlagged += row.conflicts;
      stats.officialPagesFetched += row.officialPagesFetched;
      stats.pageFetchesUsed += row.pageFetchesUsed;
      newFindingIds.push(...row.newFindingIds);
      if (row.queryErrors.length) {
        console.warn(
          `custody discovery: query errors for ${suite.id}:`,
          row.queryErrors.slice(0, 3).join('; '),
        );
      }
    } catch (err) {
      console.error(`custody discovery: crawl failed for ${suite.id}`, err);
    }
    stats.suitesScanned++;
  }

  stats.elapsedMs = Date.now() - started;
  return { stats, newFindingIds };
}
