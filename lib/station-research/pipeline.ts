import crypto from 'crypto';
import type { PoliceStation } from '@/lib/types';
import {
  getDefaultWebSearchProvider,
  isWebSearchConfigured,
  isWebSearchError,
  type WebSearchProvider,
} from '@/lib/web-search/provider';
import { decideStationContactUpdate } from './decision';
import { extractStationPhonesFromText } from './extract';
import {
  stationMainlineResearchEnabled,
  stationResearchAutoPublishEnabled,
  stationResearchBatchLimit,
  stationResearchDryRun,
  stationResearchEnabled,
  stationResearchMaxElapsedMs,
  stationResearchMaxPages,
  stationResearchMaxQueries,
} from './flags';
import { getForceSourceEntry, sourceTierForUrl } from './force-source-registry';
import { nextResearchAt, pickStationsForResearch } from './priority';
import { buildStationResearchQueries } from './queries';
import { safeFetchText } from './safe-fetch';
import { saveResearchCandidate, saveResearchRunReport } from './storage';
import type { ResearchCandidate, ResearchEvidence, StationResearchRunReport } from './types';

type FetchText = typeof safeFetchText;

function newId(prefix: string): string {
  return `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
}

function textMentionsStation(text: string, station: PoliceStation): boolean {
  const hay = text.toLowerCase();
  const name = station.name.toLowerCase().replace(/\s*police station\s*/g, ' ').trim();
  if (name && hay.includes(name)) return true;
  const tokens = name.split(/\s+/).filter((t) => t.length >= 4);
  return tokens.length > 0 && tokens.filter((t) => hay.includes(t)).length >= Math.min(2, tokens.length);
}

function textMentionsPostcode(text: string, station: PoliceStation): boolean {
  const pc = station.postcode?.replace(/\s+/g, '').toLowerCase();
  if (!pc) return false;
  return text.replace(/\s+/g, '').toLowerCase().includes(pc);
}

function textMentionsForce(text: string, station: PoliceStation): boolean {
  const force = station.forceName?.toLowerCase();
  if (!force) return false;
  return text.toLowerCase().includes(force.replace(/\s+police$/, '').trim()) || text.toLowerCase().includes(force);
}

async function researchOneStation(
  station: PoliceStation,
  opts: {
    dryRun: boolean;
    maxQueries: number;
    maxPages: number;
    provider: WebSearchProvider;
    fetchText: FetchText;
  },
): Promise<{
  candidates: ResearchCandidate[];
  queriesMade: number;
  pagesFetched: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let queriesMade = 0;
  let pagesFetched = 0;
  const candidates: ResearchCandidate[] = [];
  const forceEntry = getForceSourceEntry(station.forceName);
  const fetchText = opts.fetchText;

  // Stage: official force contact pages first
  const officialUrls = forceEntry?.contactPageUrls.slice(0, opts.maxPages) ?? [];
  for (const url of officialUrls) {
    if (pagesFetched >= opts.maxPages) break;
    const fetched = await fetchText(url);
    pagesFetched++;
    if (!fetched.ok) {
      errors.push(`${station.slug}:fetch:${fetched.reason}:${url}`);
      continue;
    }
    const phones = extractStationPhonesFromText(fetched.text);
    for (const phone of phones.slice(0, 3)) {
      const evidence: ResearchEvidence[] = [
        {
          sourceUrl: fetched.finalUrl,
          sourceTitle: station.forceName,
          sourcePublisher: station.forceName,
          sourceTier: sourceTierForUrl(fetched.finalUrl),
          excerpt: phone.context,
          retrievalDate: new Date().toISOString(),
        },
      ];
      const decided = decideStationContactUpdate({
        station,
        field: 'phone',
        rawValue: phone.display,
        normalizedValue: phone.normalized,
        displayValue: phone.display,
        contactType: phone.contactType,
        contextScore: phone.contextScore,
        evidence,
        stationNameMatched: textMentionsStation(fetched.text, station),
        postcodeMatched: textMentionsPostcode(fetched.text, station),
        forceMatched: textMentionsForce(fetched.text, station),
        dryRun: opts.dryRun,
      });
      const candidate: ResearchCandidate = {
        ...decided,
        id: newId('src'),
        createdAt: new Date().toISOString(),
        status: 'open',
      };
      candidates.push(candidate);
    }
  }

  // Stage: web search discovery (snippets only until page fetch)
  if (isWebSearchConfigured()) {
    const queries = buildStationResearchQueries(station).slice(0, opts.maxQueries);
    for (const q of queries) {
      queriesMade++;
      const hits = await opts.provider(q);
      if (isWebSearchError(hits)) {
        errors.push(`${station.slug}:search:${hits.reason}`);
        break;
      }
      for (const hit of hits.slice(0, 3)) {
        if (sourceTierForUrl(hit.url) > 2) continue;
        if (pagesFetched >= opts.maxPages) break;
        const fetched = await fetchText(hit.url);
        if (!fetched.ok) continue;
        pagesFetched++;
        const phones = extractStationPhonesFromText(fetched.text);
        for (const phone of phones.slice(0, 2)) {
          const evidence: ResearchEvidence[] = [
            {
              sourceUrl: fetched.finalUrl,
              sourceTitle: hit.title,
              sourceTier: sourceTierForUrl(fetched.finalUrl),
              excerpt: phone.context,
              retrievalDate: new Date().toISOString(),
            },
          ];
          const decided = decideStationContactUpdate({
            station,
            field: 'phone',
            rawValue: phone.display,
            normalizedValue: phone.normalized,
            displayValue: phone.display,
            contactType: phone.contactType,
            contextScore: phone.contextScore,
            evidence,
            stationNameMatched: textMentionsStation(fetched.text, station),
            postcodeMatched: textMentionsPostcode(fetched.text, station),
            forceMatched: textMentionsForce(fetched.text, station),
            dryRun: opts.dryRun,
          });
          candidates.push({
            ...decided,
            id: newId('src'),
            createdAt: new Date().toISOString(),
            status: 'open',
          });
        }
      }
    }
  }

  return { candidates, queriesMade, pagesFetched, errors };
}

export interface RunStationResearchOptions {
  stations: PoliceStation[];
  limit?: number;
  dryRun?: boolean;
  provider?: WebSearchProvider;
  fetchText?: FetchText;
  /** Force run even when STATION_RESEARCH_ENABLED is off (local scripts). */
  force?: boolean;
}

/**
 * Continuous station-contact research cycle.
 * Default: dry-run, no public writes. Auto-publish only when all publish flags are on.
 */
export async function runStationContactResearch(
  opts: RunStationResearchOptions,
): Promise<StationResearchRunReport> {
  const startedAt = new Date().toISOString();
  const runId = newId('run');
  const enabled = stationResearchEnabled() || Boolean(opts.force);
  const dryRun = opts.dryRun ?? stationResearchDryRun();
  const autoPublish = stationResearchAutoPublishEnabled() && !dryRun;
  const limit = opts.limit ?? stationResearchBatchLimit();
  const maxElapsed = stationResearchMaxElapsedMs();
  const t0 = Date.now();

  const report: StationResearchRunReport = {
    runId,
    startedAt,
    completedAt: startedAt,
    dryRun,
    enabled,
    stationsConsidered: opts.stations.length,
    stationsResearched: 0,
    queriesMade: 0,
    pagesFetched: 0,
    candidatesFound: 0,
    queuedForAdmin: 0,
    published: 0,
    rejected: 0,
    leftUnchanged: 0,
    errors: [],
    candidates: [],
    nextRecheckHints: [],
  };

  if (!enabled) {
    report.errors.push('STATION_RESEARCH_ENABLED is off');
    report.completedAt = new Date().toISOString();
    await saveResearchRunReport(report);
    return report;
  }

  if (!stationMainlineResearchEnabled() && !opts.force) {
    report.errors.push('STATION_MAINLINE_RESEARCH_ENABLED is off');
    report.completedAt = new Date().toISOString();
    await saveResearchRunReport(report);
    return report;
  }

  const picks = pickStationsForResearch(opts.stations, limit);
  const byId = new Map(opts.stations.map((s) => [s.id, s]));
  const provider = opts.provider ?? getDefaultWebSearchProvider();
  const fetchText = opts.fetchText ?? safeFetchText;

  for (const pick of picks) {
    if (Date.now() - t0 > maxElapsed) {
      report.errors.push('max_elapsed_reached');
      break;
    }
    const station = byId.get(pick.stationId);
    if (!station) continue;

    const result = await researchOneStation(station, {
      dryRun,
      maxQueries: stationResearchMaxQueries(),
      maxPages: stationResearchMaxPages(),
      provider,
      fetchText,
    });
    report.stationsResearched++;
    report.queriesMade += result.queriesMade;
    report.pagesFetched += result.pagesFetched;
    report.errors.push(...result.errors);

    if (result.candidates.length === 0) {
      report.leftUnchanged++;
      const hint = nextResearchAt({
        confidenceScore: 0,
        published: false,
        conflicted: false,
        missing: true,
      });
      report.nextRecheckHints.push({ stationId: station.id, ...hint });
      continue;
    }

    for (const candidate of result.candidates) {
      report.candidatesFound++;
      report.candidates.push(candidate);

      if (candidate.decision === 'reject') {
        report.rejected++;
      } else if (candidate.decision === 'leave_unchanged') {
        report.leftUnchanged++;
      } else if (candidate.decision === 'publish' && autoPublish) {
        // Deliberately not writing stations.json / verification here in v1 —
        // publication still goes through admin approve to protect production data.
        report.queuedForAdmin++;
        candidate.decision = 'queue_admin';
        candidate.decisionReasons.push('auto_publish_deferred_to_admin_gate');
        candidate.humanReviewRequired = true;
        await saveResearchCandidate(candidate);
      } else {
        report.queuedForAdmin++;
        await saveResearchCandidate(candidate);
      }
    }

    const best = result.candidates.sort((a, b) => b.confidenceScore - a.confidenceScore)[0];
    const hint = nextResearchAt({
      confidenceScore: best?.confidenceScore ?? 0,
      published: false,
      conflicted: best?.confidenceStatus === 'CONFLICTED',
      missing: !station.phone,
    });
    report.nextRecheckHints.push({ stationId: station.id, ...hint });
  }

  report.completedAt = new Date().toISOString();
  await saveResearchRunReport(report);
  return report;
}
