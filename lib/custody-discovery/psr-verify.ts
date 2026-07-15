/**
 * PSR candidate → verify → publish (or queue).
 *
 * Never publishes from policestationreps.com alone. Official page match
 * publishes verified; two independent corroborating fetches publish probable.
 * Self-sites (repuk / agent) are never corroborators.
 */
import crypto from 'crypto';
import { getKV } from '@/lib/kv';
import { claimKey, incrementCounter, releaseKey } from '@/lib/kv-atomic';
import { formatPhoneUk, normalizePhoneDigits } from '@/lib/phone-format';
import {
  isTrustworthyPsrCustodyCandidate,
  parseRepDirectoryStationHtml,
  repDirectoryUrlCandidates,
} from '@/lib/rep-directory-parse';
import { processSearchHit } from './crawler';
import { sendPsrBackfillCompleteEmail } from './email';
import { FORCE_CUSTODY_PAGES } from './official-pages';
import { isAutoPublishableRange } from './number-safety';
import { isSearchQueryError, serperSearch } from './search';
import { fetchCachedPageHtml, fetchPageTextFromUrl } from './source-evidence';
import { extractDomain } from './source-type';
import {
  approveFinding,
  getApprovedNumber,
  getAllCustodySuites,
  getFindingsForSuite,
  loadAllApprovedNumbers,
} from './storage';
import type { CustodyNumberFinding, CustodySuite } from './types';

const MODE_KEY = 'custody:psr-crawl:mode';
const BACKFILL_STARTED_KEY = 'custody:psr-crawl:backfill-started-at';
const BACKFILL_DONE_KEY = 'custody:psr-crawl:backfill-done-at';
const FORCE_CURSOR_KEY = 'custody:psr-crawl:force';
const SUITE_CURSOR_KEY = 'custody:psr-crawl:suite-cursor';
const LOCK_KEY = 'custody:psr-crawl:lock';
const STATS_KEY = 'custody:psr-crawl:stats';

const BLOCKED_CORROBORATOR =
  /policestationreps\.com|policestationrepuk\.org|policestationrep\.com|policestationagent\.com/i;

export type PsrCrawlMode = 'backfill' | 'steady';

export interface PsrVerifyRunStats {
  mode: PsrCrawlMode;
  enabled: boolean;
  locked: boolean;
  budgetExhausted: boolean;
  processed: number;
  skippedUnchanged: number;
  skippedNoPsr: number;
  verified: number;
  probable: number;
  queued: number;
  noDesk: number;
  failed: number;
  serperUsed: number;
  forcePacked: string | null;
  backfillComplete: boolean;
  results: Array<{
    suiteId: string;
    outcome: string;
    phone?: string;
    detail?: string;
  }>;
}

export interface PsrSuiteFingerprint {
  psrUrl: string;
  custodyNormalized: string;
  mainNormalized?: string;
  checkedAt: string;
  outcome: string;
}

function envEnabled(): boolean {
  return process.env.CUSTODY_PSR_VERIFY !== 'false';
}

function backfillBatchLimit(): number {
  return Math.max(1, Number(process.env.CUSTODY_PSR_VERIFY_BATCH_LIMIT ?? 50));
}

function steadyBatchLimit(): number {
  return Math.max(1, Number(process.env.CUSTODY_PSR_VERIFY_STEADY_BATCH ?? 20));
}

function deskRecheckDays(): number {
  return Math.max(7, Number(process.env.CUSTODY_DESK_RECHECK_DAYS ?? 35));
}

function serperDailyCap(): number {
  return Math.max(10, Number(process.env.CUSTODY_PSR_SERPER_DAILY_CAP ?? 400));
}

function utcDayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

function fingerprintKey(suiteId: string): string {
  return `custody:psr-fp:${suiteId}`;
}

function nextCheckKey(suiteId: string): string {
  return `custody:psr-next:${suiteId}`;
}

function serperBudgetKey(day = utcDayKey()): string {
  return `custody:psr-serper:${day}`;
}

export async function getPsrCrawlMode(): Promise<PsrCrawlMode> {
  const kv = getKV();
  if (!kv) return 'backfill';
  const mode = await kv.get<string>(MODE_KEY);
  return mode === 'steady' ? 'steady' : 'backfill';
}

export async function setPsrCrawlMode(mode: PsrCrawlMode): Promise<void> {
  const kv = getKV();
  if (!kv) return;
  await kv.set(MODE_KEY, mode);
  if (mode === 'backfill') {
    const started = await kv.get<string>(BACKFILL_STARTED_KEY);
    if (!started) await kv.set(BACKFILL_STARTED_KEY, new Date().toISOString());
    await kv.del(BACKFILL_DONE_KEY);
  }
}

async function ensureBackfillStarted(): Promise<void> {
  const kv = getKV();
  if (!kv) return;
  const started = await kv.get<string>(BACKFILL_STARTED_KEY);
  if (!started) await kv.set(BACKFILL_STARTED_KEY, new Date().toISOString());
}

async function getSerperUsedToday(): Promise<number> {
  const kv = getKV();
  if (!kv) return 0;
  const n = await kv.get<number>(serperBudgetKey());
  return typeof n === 'number' ? n : 0;
}

async function consumeSerperBudget(n = 1): Promise<boolean> {
  const used = await getSerperUsedToday();
  if (used + n > serperDailyCap()) return false;
  await incrementCounter(serperBudgetKey(), 86_400);
  for (let i = 1; i < n; i++) {
    await incrementCounter(serperBudgetKey(), 86_400);
  }
  return true;
}

function hashFingerprint(parts: {
  psrUrl: string;
  custodyNormalized: string;
  mainNormalized?: string;
}): string {
  return crypto
    .createHash('sha256')
    .update(`${parts.psrUrl}|${parts.custodyNormalized}|${parts.mainNormalized ?? ''}`)
    .digest('hex')
    .slice(0, 24);
}

async function loadFingerprint(suiteId: string): Promise<(PsrSuiteFingerprint & { hash: string }) | null> {
  const kv = getKV();
  if (!kv) return null;
  const row = await kv.get<PsrSuiteFingerprint & { hash: string }>(fingerprintKey(suiteId));
  return row ?? null;
}

async function saveFingerprint(
  suiteId: string,
  fp: PsrSuiteFingerprint & { hash: string },
): Promise<void> {
  const kv = getKV();
  if (!kv) return;
  await kv.set(fingerprintKey(suiteId), fp);
  const next = new Date();
  next.setDate(next.getDate() + deskRecheckDays());
  await kv.set(nextCheckKey(suiteId), next.toISOString());
}

async function isDueForPsrCheck(suiteId: string, force = false): Promise<boolean> {
  if (force) return true;
  const kv = getKV();
  if (!kv) return true;
  const next = await kv.get<string>(nextCheckKey(suiteId));
  if (!next) return true;
  const ts = Date.parse(next);
  return !Number.isFinite(ts) || Date.now() >= ts;
}

function textHasPhone(text: string, normalized: string): boolean {
  const digits = normalized.replace(/\D/g, '');
  if (!digits || digits.length < 10) return false;
  const compact = text.replace(/\D/g, '');
  if (compact.includes(digits)) return true;
  if (digits.startsWith('0') && compact.includes(digits.slice(1))) return true;
  return false;
}

function textMentionsSuite(text: string, suite: CustodySuite): boolean {
  const lower = text.toLowerCase();
  const tokens = [
    suite.policeStationName,
    suite.custodySuiteName,
    suite.postcode ?? '',
    suite.town ?? '',
    ...(suite.aliases ?? []),
  ]
    .map((t) => t.toLowerCase().trim())
    .filter((t) => t.length >= 4);
  if (suite.postcode && lower.includes(suite.postcode.toLowerCase())) return true;
  let hits = 0;
  for (const t of tokens) {
    const key = t.replace(/\s+police station$/i, '').trim();
    if (key.length >= 4 && lower.includes(key)) hits++;
  }
  return hits >= 1;
}

function isBlockedCorroboratorUrl(url: string): boolean {
  return BLOCKED_CORROBORATOR.test(url) || BLOCKED_CORROBORATOR.test(extractDomain(url));
}

function isOfficialUrl(url: string, forceDomain?: string): boolean {
  const d = extractDomain(url).toLowerCase();
  if (d === 'police.uk' || d.endsWith('.police.uk')) return true;
  if (forceDomain) {
    const force = forceDomain.toLowerCase().replace(/^www\./, '');
    if (force && (d === force || d.endsWith(`.${force}`))) return true;
  }
  return false;
}

async function fetchPsrCandidate(
  suite: CustodySuite,
): Promise<{
  url: string;
  custodyPhone: string;
  custodyNormalized: string;
  mainPhone?: string;
  mainNormalized?: string;
  htmlHash: string;
} | null> {
  const slug = suite.stationSlug ?? suite.id;
  const urls = repDirectoryUrlCandidates(slug, suite.policeStationName);
  for (const url of urls.slice(0, 4)) {
    const html = await fetchCachedPageHtml(url);
    if (!html || html.length < 200) continue;
    const parsed = parseRepDirectoryStationHtml(html, url);
    if (!isTrustworthyPsrCustodyCandidate(parsed) || !parsed.custodyPhone) continue;
    const custodyNormalized = normalizePhoneDigits(parsed.custodyPhone);
    if (!custodyNormalized || custodyNormalized === '101') continue;
    if (!isAutoPublishableRange(custodyNormalized)) continue;
    return {
      url,
      custodyPhone: parsed.custodyPhone,
      custodyNormalized,
      mainPhone: parsed.mainPhone,
      mainNormalized: parsed.mainPhone ? normalizePhoneDigits(parsed.mainPhone) : undefined,
      htmlHash: crypto.createHash('sha256').update(html.slice(0, 8000)).digest('hex').slice(0, 16),
    };
  }
  return null;
}

async function checkOfficialPages(
  suite: CustodySuite,
  normalized: string,
): Promise<{ url: string; quote: string } | null> {
  const forceKey = suite.forceName.toLowerCase().trim();
  const urls = [...(FORCE_CUSTODY_PAGES[forceKey] ?? [])];
  if (suite.forceDomain) {
    const d = suite.forceDomain.replace(/^www\./, '');
    urls.push(
      `https://www.${d}/contact/custody-information`,
      `https://www.${d}/contact`,
    );
  }
  const seen = new Set<string>();
  for (const url of urls) {
    if (seen.has(url)) continue;
    seen.add(url);
    const text = await fetchPageTextFromUrl(url);
    if (!text) continue;
    if (!textHasPhone(text, normalized)) continue;
    if (!textMentionsSuite(text, suite) && !/custody/i.test(text)) continue;
    const quote = text.slice(0, 280);
    return { url, quote };
  }
  return null;
}

async function corroborateViaSerper(
  suite: CustodySuite,
  phoneDisplay: string,
  normalized: string,
): Promise<Array<{ url: string; title: string; snippet: string }>> {
  if (!(await consumeSerperBudget(1))) return [];
  const q = `"${phoneDisplay}" "${suite.policeStationName}" custody OR "police station"`;
  const rows = await serperSearch(q);
  if (isSearchQueryError(rows)) return [];
  const out: Array<{ url: string; title: string; snippet: string }> = [];
  for (const r of rows) {
    if (isBlockedCorroboratorUrl(r.url)) continue;
    const blob = `${r.title} ${r.snippet}`;
    if (!textHasPhone(blob, normalized) && !blob.includes(phoneDisplay)) continue;
    out.push({ url: r.url, title: r.title, snippet: r.snippet });
  }
  return out;
}

async function confirmCorroboratorFetch(
  url: string,
  normalized: string,
  suite: CustodySuite,
): Promise<boolean> {
  if (isBlockedCorroboratorUrl(url)) return false;
  const text = await fetchPageTextFromUrl(url);
  if (!text) return false;
  if (!textHasPhone(text, normalized)) return false;
  return textMentionsSuite(text, suite) || /custody|police station/i.test(text);
}

async function ensurePsrFinding(
  suite: CustodySuite,
  candidate: {
    url: string;
    custodyPhone: string;
    custodyNormalized: string;
  },
): Promise<CustodyNumberFinding | null> {
  const existing = await getFindingsForSuite(suite.id);
  const already = existing.find(
    (f) =>
      f.normalizedPhoneNumber === candidate.custodyNormalized &&
      /policestationreps\.com/i.test(f.sourceUrl) &&
      f.status !== 'rejected' &&
      f.status !== 'stale',
  );
  if (already) return already;

  const outcome = await processSearchHit({
    suite,
    title: `${suite.policeStationName} — PSR custody candidate`,
    url: candidate.url,
    snippet: `${suite.policeStationName} Custody: ${candidate.custodyPhone} (PSR candidate — verify before publish)`,
    existingFindings: existing,
    candidatePhone: {
      display: formatPhoneUk(candidate.custodyPhone) ?? candidate.custodyPhone,
      normalized: candidate.custodyNormalized,
      context: `Custody: ${candidate.custodyPhone} at ${suite.policeStationName}`,
    },
  });
  return outcome.finding ?? null;
}

async function publishVerified(
  finding: CustodyNumberFinding,
  evidenceUrl: string,
  path: 'official' | 'corroborated',
): Promise<'verified' | 'probable'> {
  const markVerified = path === 'official';
  const notes =
    path === 'official'
      ? `[PSR-verify] Official page confirms desk line (${evidenceUrl})`
      : `[PSR-verify] Probable — 2+ independent sources confirm (${evidenceUrl})`;
  await approveFinding(finding.id, 'psr-verify', { notes, markVerified });
  return markVerified ? 'verified' : 'probable';
}

/** Priority: dedicated custody / missing approved / force packing. */
function prioritizeSuites(
  suites: CustodySuite[],
  approved: Map<string, { publicVisible: boolean; contactField?: string }>,
  forcePack: string | null,
): CustodySuite[] {
  const active = suites.filter((s) => s.active);
  const scored = active.map((s) => {
    const pub = approved.get(s.id);
    const missingDesk =
      !pub?.publicVisible ||
      (pub.contactField && pub.contactField !== 'custodyPhone' && s.isDedicatedCustodySuite);
    let score = 0;
    if (s.isDedicatedCustodySuite) score += 100;
    if (missingDesk) score += 50;
    if (forcePack && s.forceName === forcePack) score += 200;
    return { s, score };
  });
  scored.sort((a, b) => b.score - a.score || a.s.id.localeCompare(b.s.id));
  return scored.map((x) => x.s);
}

async function pickForcePack(suites: CustodySuite[]): Promise<string | null> {
  const kv = getKV();
  const forces = [...new Set(suites.filter((s) => s.active).map((s) => s.forceName))].sort();
  if (forces.length === 0) return null;
  if (!kv) return forces[0] ?? null;
  const current = await kv.get<string>(FORCE_CURSOR_KEY);
  if (current && forces.includes(current)) return current;
  await kv.set(FORCE_CURSOR_KEY, forces[0]!);
  return forces[0]!;
}

async function advanceForceIfDone(
  force: string,
  remainingInForce: number,
): Promise<void> {
  if (remainingInForce > 0) return;
  const kv = getKV();
  if (!kv) return;
  const suites = await getAllCustodySuites();
  const forces = [...new Set(suites.filter((s) => s.active).map((s) => s.forceName))].sort();
  const idx = forces.indexOf(force);
  const next = forces[(idx + 1) % Math.max(forces.length, 1)] ?? force;
  await kv.set(FORCE_CURSOR_KEY, next);
}

export async function queuePsrRecheck(suiteId: string): Promise<void> {
  const kv = getKV();
  if (!kv) return;
  await kv.set(nextCheckKey(suiteId), new Date(0).toISOString());
  await kv.del(fingerprintKey(suiteId));
}

export async function verifySuiteFromPsr(
  suite: CustodySuite,
  opts?: { force?: boolean; allowSerper?: boolean },
): Promise<{
  outcome:
    | 'verified'
    | 'probable'
    | 'queued'
    | 'no_psr'
    | 'skipped_unchanged'
    | 'no_desk'
    | 'failed';
  phone?: string;
  detail?: string;
  serperUsed: number;
}> {
  let serperUsed = 0;
  try {
    if (!(await isDueForPsrCheck(suite.id, opts?.force))) {
      return { outcome: 'skipped_unchanged', detail: 'not_due', serperUsed };
    }

    const candidate = await fetchPsrCandidate(suite);
    if (!candidate) {
      return { outcome: 'no_psr', detail: 'no_labelled_custody_on_psr', serperUsed };
    }

    const hash = hashFingerprint({
      psrUrl: candidate.url,
      custodyNormalized: candidate.custodyNormalized,
      mainNormalized: candidate.mainNormalized,
    });
    const prev = await loadFingerprint(suite.id);
    if (!opts?.force && prev?.hash === hash && prev.outcome !== 'queued') {
      await saveFingerprint(suite.id, {
        ...prev,
        checkedAt: new Date().toISOString(),
      });
      return {
        outcome: 'skipped_unchanged',
        phone: candidate.custodyPhone,
        detail: 'fingerprint_unchanged',
        serperUsed,
      };
    }

    const finding = await ensurePsrFinding(suite, candidate);
    if (!finding) {
      return { outcome: 'failed', detail: 'could_not_create_finding', serperUsed };
    }

    // Official wins
    const official = await checkOfficialPages(suite, candidate.custodyNormalized);
    if (official) {
      const pub = await publishVerified(finding, official.url, 'official');
      await saveFingerprint(suite.id, {
        hash,
        psrUrl: candidate.url,
        custodyNormalized: candidate.custodyNormalized,
        mainNormalized: candidate.mainNormalized,
        checkedAt: new Date().toISOString(),
        outcome: pub,
      });
      return { outcome: pub, phone: candidate.custodyPhone, detail: official.url, serperUsed };
    }

    // Existing approved official finding for same number
    const approved = await getApprovedNumber(suite.id);
    if (
      approved?.publicVisible &&
      approved.normalizedPhoneNumber === candidate.custodyNormalized &&
      isOfficialUrl(approved.sourceUrl, suite.forceDomain)
    ) {
      await saveFingerprint(suite.id, {
        hash,
        psrUrl: candidate.url,
        custodyNormalized: candidate.custodyNormalized,
        mainNormalized: candidate.mainNormalized,
        checkedAt: new Date().toISOString(),
        outcome: 'verified',
      });
      return {
        outcome: 'verified',
        phone: candidate.custodyPhone,
        detail: 'matches_published_official',
        serperUsed,
      };
    }

    // Corroboration via Serper + page fetch (never PSR/self)
    let confirmed = 0;
    let evidenceUrl = '';
    if (opts?.allowSerper !== false) {
      const hits = await corroborateViaSerper(
        suite,
        candidate.custodyPhone,
        candidate.custodyNormalized,
      );
      serperUsed = 1;
      for (const hit of hits.slice(0, 5)) {
        const ok = await confirmCorroboratorFetch(
          hit.url,
          candidate.custodyNormalized,
          suite,
        );
        if (!ok) continue;
        confirmed++;
        if (!evidenceUrl) evidenceUrl = hit.url;
        if (confirmed >= 2) break;
      }
    }

    // Sibling trusted findings already in KV count as corroborators
    const siblings = await getFindingsForSuite(suite.id);
    const trustedDomains = new Set<string>();
    for (const f of siblings) {
      if (f.normalizedPhoneNumber !== candidate.custodyNormalized) continue;
      if (f.status === 'rejected' || f.status === 'stale') continue;
      if (isBlockedCorroboratorUrl(f.sourceUrl)) continue;
      if (
        f.sourceType === 'official_police' ||
        f.sourceType === 'police_uk' ||
        f.sourceType === 'foi' ||
        f.sourceType === 'local_authority' ||
        f.sourceType === 'pcc'
      ) {
        trustedDomains.add(f.sourceDomain.toLowerCase());
        if (!evidenceUrl) evidenceUrl = f.sourceUrl;
      }
    }
    confirmed = Math.max(confirmed, trustedDomains.size);

    if (confirmed >= 2 && evidenceUrl) {
      const pub = await publishVerified(finding, evidenceUrl, 'corroborated');
      await saveFingerprint(suite.id, {
        hash,
        psrUrl: candidate.url,
        custodyNormalized: candidate.custodyNormalized,
        mainNormalized: candidate.mainNormalized,
        checkedAt: new Date().toISOString(),
        outcome: pub,
      });
      return { outcome: pub, phone: candidate.custodyPhone, detail: evidenceUrl, serperUsed };
    }

    await saveFingerprint(suite.id, {
      hash,
      psrUrl: candidate.url,
      custodyNormalized: candidate.custodyNormalized,
      mainNormalized: candidate.mainNormalized,
      checkedAt: new Date().toISOString(),
      outcome: 'queued',
    });
    return {
      outcome: 'queued',
      phone: candidate.custodyPhone,
      detail: `needs_human_or_retry; corroborators=${confirmed}`,
      serperUsed,
    };
  } catch (err) {
    return {
      outcome: 'failed',
      detail: err instanceof Error ? err.message : String(err),
      serperUsed,
    };
  }
}

async function countUncheckedPriority(suites: CustodySuite[]): Promise<number> {
  const approved = await loadAllApprovedNumbers();
  let n = 0;
  for (const s of suites) {
    if (!s.active || !s.isDedicatedCustodySuite) continue;
    const a = approved.get(s.id);
    if (!a?.publicVisible) {
      n++;
      continue;
    }
    if (await isDueForPsrCheck(s.id)) n++;
  }
  return n;
}

export async function runPsrVerifyBatch(opts?: {
  limit?: number;
  forceSuiteId?: string;
}): Promise<PsrVerifyRunStats> {
  const enabled = envEnabled();
  const empty: PsrVerifyRunStats = {
    mode: 'backfill',
    enabled,
    locked: false,
    budgetExhausted: false,
    processed: 0,
    skippedUnchanged: 0,
    skippedNoPsr: 0,
    verified: 0,
    probable: 0,
    queued: 0,
    noDesk: 0,
    failed: 0,
    serperUsed: 0,
    forcePacked: null,
    backfillComplete: false,
    results: [],
  };
  if (!enabled) return empty;

  const kv = getKV();
  const claimed = kv ? await claimKey(LOCK_KEY, 280) : true;
  if (!claimed) return { ...empty, locked: true };

  try {
    await ensureBackfillStarted();
    let mode = await getPsrCrawlMode();
    const suites = await getAllCustodySuites();
    const approved = await loadAllApprovedNumbers();

    if (opts?.forceSuiteId) {
      const suite = suites.find((s) => s.id === opts.forceSuiteId);
      if (!suite) return { ...empty, mode, failed: 1 };
      const r = await verifySuiteFromPsr(suite, { force: true });
      return {
        ...empty,
        mode,
        processed: 1,
        verified: r.outcome === 'verified' ? 1 : 0,
        probable: r.outcome === 'probable' ? 1 : 0,
        queued: r.outcome === 'queued' ? 1 : 0,
        skippedNoPsr: r.outcome === 'no_psr' ? 1 : 0,
        failed: r.outcome === 'failed' ? 1 : 0,
        serperUsed: r.serperUsed,
        results: [{ suiteId: suite.id, outcome: r.outcome, phone: r.phone, detail: r.detail }],
      };
    }

    const unchecked = await countUncheckedPriority(suites);
    if (mode === 'backfill' && unchecked === 0) {
      mode = 'steady';
      await setPsrCrawlMode('steady');
      if (kv) {
        const done = await kv.get<string>(BACKFILL_DONE_KEY);
        if (!done) {
          await kv.set(BACKFILL_DONE_KEY, new Date().toISOString());
          const stats = (await kv.get<Partial<PsrVerifyRunStats>>(STATS_KEY)) ?? {};
          await sendPsrBackfillCompleteEmail({
            verified: Number(stats.verified ?? 0),
            probable: Number(stats.probable ?? 0),
            queued: Number(stats.queued ?? 0),
            noDesk: Number(stats.noDesk ?? 0),
          });
        }
      }
      empty.backfillComplete = true;
    }

    const limit =
      opts?.limit ?? (mode === 'backfill' ? backfillBatchLimit() : steadyBatchLimit());
    const forcePacked = mode === 'backfill' ? await pickForcePack(suites) : null;
    const prioritized = prioritizeSuites(suites, approved, forcePacked);
    // During backfill, process the packed force first (cache-friendly official fetches).
    const ordered =
      mode === 'backfill' && forcePacked
        ? [
            ...prioritized.filter((s) => s.forceName === forcePacked),
            ...prioritized.filter((s) => s.forceName !== forcePacked),
          ]
        : prioritized;

    let cursor = 0;
    if (kv && mode === 'steady') {
      const stored = await kv.get<number>(SUITE_CURSOR_KEY);
      if (typeof stored === 'number' && stored >= 0 && stored < ordered.length) cursor = stored;
    }

    const stats: PsrVerifyRunStats = {
      ...empty,
      mode,
      forcePacked,
      backfillComplete: empty.backfillComplete,
    };

    const batch = ordered.slice(cursor, cursor + limit);
    if (batch.length < limit && cursor > 0) {
      batch.push(...ordered.slice(0, limit - batch.length));
    }

    for (const suite of batch) {
      if ((await getSerperUsedToday()) >= serperDailyCap()) {
        stats.budgetExhausted = true;
        break;
      }

      const r = await verifySuiteFromPsr(suite, { allowSerper: true });
      stats.processed++;
      stats.serperUsed += r.serperUsed;
      stats.results.push({
        suiteId: suite.id,
        outcome: r.outcome,
        phone: r.phone,
        detail: r.detail,
      });

      if (r.outcome === 'verified') stats.verified++;
      else if (r.outcome === 'probable') stats.probable++;
      else if (r.outcome === 'queued') stats.queued++;
      else if (r.outcome === 'no_psr') {
        stats.skippedNoPsr++;
        stats.noDesk++;
      } else if (r.outcome === 'skipped_unchanged') stats.skippedUnchanged++;
      else if (r.outcome === 'failed') stats.failed++;
    }

    if (kv) {
      if (mode === 'steady') {
        const nextCursor = (cursor + stats.processed) % Math.max(ordered.length, 1);
        await kv.set(SUITE_CURSOR_KEY, nextCursor);
      }
      const prev = (await kv.get<Partial<PsrVerifyRunStats>>(STATS_KEY)) ?? {};
      await kv.set(STATS_KEY, {
        verified: Number(prev.verified ?? 0) + stats.verified,
        probable: Number(prev.probable ?? 0) + stats.probable,
        queued: Number(prev.queued ?? 0) + stats.queued,
        noDesk: Number(prev.noDesk ?? 0) + stats.noDesk,
        updatedAt: new Date().toISOString(),
        mode,
      });
    }

    if (forcePacked && mode === 'backfill') {
      // Advance force when this pack's due/missing desks are mostly cleared.
      const stillDue = ordered
        .filter((s) => s.forceName === forcePacked)
        .slice(0, 5);
      let remaining = 0;
      for (const s of stillDue) {
        if (await isDueForPsrCheck(s.id)) remaining++;
      }
      await advanceForceIfDone(forcePacked, remaining);
    }

    return stats;
  } finally {
    if (kv) await releaseKey(LOCK_KEY);
  }
}
