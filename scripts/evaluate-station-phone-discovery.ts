/**
 * Real-world evaluation harness for station phone discovery.
 *
 * Usage:
 *   npx tsx scripts/evaluate-station-phone-discovery.ts           # dry (query build + extract only)
 *   npx tsx scripts/evaluate-station-phone-discovery.ts --live    # Serper + fetch (needs SERPER_API_KEY)
 *
 * Writes: data/reports/station-phone-eval-YYYY-MM-DD.json
 */
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { stationToCustodySuite } from '../lib/custody-discovery/suites';
import { buildRankedSearchQueries } from '../lib/custody-discovery/station-aliases';
import { searchForSuite, isSearchQueryError, isSuiteSearchOutcome } from '../lib/custody-discovery/search';
import { fetchPageTextFromUrl } from '../lib/custody-discovery/source-evidence';
import {
  extractPhonesFromText,
  listScoredCustodyCandidatePhones,
  hasCustodyWordingNear,
} from '../lib/custody-discovery/phone';
import { isGenericCustodyNumber } from '../lib/custody-discovery/generic-numbers';
import { isNonStationSpecificNumber } from '../lib/custody-discovery/number-ownership';
import { normalizePhoneDigits } from '../lib/phone-format';
import type { PoliceStation } from '../lib/types';

interface EvalStation {
  id: string;
  slug: string;
  name: string;
  forceName: string;
  county: string;
  postcode: string;
  address: string;
  isCustodyStation: boolean;
  category: string;
  expected: { outcome: string; notes?: string; phone?: string };
}

const ROOT = process.cwd();
const live = process.argv.includes('--live');
const limitArg = process.argv.find((a) => a.startsWith('--limit='));
const limit = limitArg ? Number(limitArg.split('=')[1]) : 50;

function phonesMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  return normalizePhoneDigits(a) === normalizePhoneDigits(b);
}

async function main() {
  const raw = JSON.parse(
    readFileSync(join(ROOT, 'data/evaluation/station-phone-eval-set.json'), 'utf8'),
  ) as { stations: EvalStation[]; labelledAt?: string };

  const stations = raw.stations.slice(0, limit);
  const rows: Array<Record<string, unknown>> = [];

  let anyCandidate = 0;
  let custodyContextCandidate = 0;
  let scoredCandidate = 0;
  let hallucinated = 0;
  let genericOr101 = 0;
  let queryCount = 0;
  let goldPhoneStations = 0;
  let goldPhoneHits = 0;
  let goldPhoneMisses = 0;
  let incorrect101AsDirect = 0;
  let switchboardOnlyCorrect = 0;
  let switchboardOnlyTotal = 0;

  for (const s of stations) {
    const station: PoliceStation = {
      id: s.id,
      slug: s.slug,
      name: s.name,
      address: s.address,
      postcode: s.postcode,
      county: s.county,
      forceName: s.forceName,
      isCustodyStation: s.isCustodyStation,
      status: 'active',
    };
    const suite = stationToCustodySuite(station);
    const ranked = buildRankedSearchQueries(suite);
    queryCount += ranked.length;

    let organicCount = 0;
    let extracted = 0;
    let bestScore = 0;
    let bestPhone: string | null = null;
    let custodyNear = false;
    let sources: string[] = [];
    let evidenceBlob = '';
    let sawExpectedInEvidence = false;
    let sawGenericAsBest = false;

    if (live) {
      const outcome = await searchForSuite(suite, undefined, 6);
      if (isSearchQueryError(outcome)) {
        rows.push({
          id: s.id,
          name: s.name,
          force: s.forceName,
          error: outcome.reason,
          expectedOutcome: s.expected.outcome,
        });
        continue;
      }
      const results = isSuiteSearchOutcome(outcome) ? outcome.results : outcome;
      organicCount = results.length;
      sources = results.slice(0, 5).map((r) => r.url);

      for (const hit of results.slice(0, 8)) {
        const pageText = await fetchPageTextFromUrl(hit.url);
        const text = `${hit.title} ${hit.snippet} ${pageText ?? ''}`;
        evidenceBlob += `\n${text}`;
        const phones = listScoredCustodyCandidatePhones(text, {
          forceName: suite.forceName,
          suiteNames: [suite.custodySuiteName, suite.policeStationName],
        });
        extracted += extractPhonesFromText(text, 120, suite.forceName).length;
        for (const p of phones) {
          if (p.score > bestScore) {
            bestScore = p.score;
            bestPhone = p.display;
            custodyNear = hasCustodyWordingNear(p.context);
          }
          if (
            isGenericCustodyNumber(p.display, suite.forceName) ||
            isNonStationSpecificNumber(p.normalized)
          ) {
            genericOr101++;
          }
        }
      }

      if (s.expected.phone) {
        sawExpectedInEvidence = evidenceBlob.includes(normalizePhoneDigits(s.expected.phone))
          || evidenceBlob.includes(s.expected.phone.replace(/\s+/g, ''))
          || new RegExp(s.expected.phone.replace(/\s+/g, '\\s*'), 'i').test(evidenceBlob);
      }
    }

    if (bestPhone) {
      anyCandidate++;
      if (bestScore >= 10) scoredCandidate++;
      if (custodyNear) custodyContextCandidate++;
      if (
        isGenericCustodyNumber(bestPhone, suite.forceName) ||
        normalizePhoneDigits(bestPhone) === '101'
      ) {
        sawGenericAsBest = true;
        if (
          s.expected.outcome === 'direct_custody' ||
          s.expected.outcome === 'direct_station' ||
          s.expected.outcome === 'public_enquiry'
        ) {
          incorrect101AsDirect++;
        }
      }
    }

    // Hallucination: pipeline selected a number that never appeared in fetched evidence
    if (live && bestPhone && evidenceBlob) {
      const digits = normalizePhoneDigits(bestPhone);
      if (digits && !evidenceBlob.replace(/\D/g, '').includes(digits)) {
        hallucinated++;
      }
    }

    if (s.expected.phone) {
      goldPhoneStations++;
      if (phonesMatch(bestPhone, s.expected.phone)) goldPhoneHits++;
      else goldPhoneMisses++;
    }

    if (s.expected.outcome === 'force_switchboard_only') {
      switchboardOnlyTotal++;
      // Correct if we did not invent a station-specific direct number as best,
      // or best is generic/101.
      if (!bestPhone || sawGenericAsBest) switchboardOnlyCorrect++;
    }

    rows.push({
      id: s.id,
      name: s.name,
      force: s.forceName,
      category: s.category,
      queryVariants: ranked.length,
      strategies: [...new Set(ranked.map((q) => q.strategy))],
      organicCount,
      extracted,
      bestPhone,
      bestScore,
      custodyNear,
      sources,
      expectedOutcome: s.expected.outcome,
      expectedPhone: s.expected.phone ?? null,
      matchedExpectedPhone: phonesMatch(bestPhone, s.expected.phone),
      sawExpectedInEvidence: live ? sawExpectedInEvidence : null,
    });
  }

  const labelled = stations.filter((s) => s.expected.outcome !== 'unknown').length;
  const report = {
    generatedAt: new Date().toISOString(),
    mode: live ? 'live' : 'dry',
    labelledAt: raw.labelledAt ?? null,
    stationsEvaluated: stations.length,
    labelledStations: labelled,
    metrics: {
      queryVariantsPerStationAvg: Number((queryCount / Math.max(1, stations.length)).toFixed(1)),
      anyCandidateRate: live ? anyCandidate / stations.length : null,
      scoredCandidateRate: live ? scoredCandidate / stations.length : null,
      custodyContextCandidateRate: live ? custodyContextCandidate / stations.length : null,
      genericOr101Hits: genericOr101,
      hallucinatedResults: hallucinated,
      goldPhonePrecision:
        live && goldPhoneStations > 0
          ? Number((goldPhoneHits / goldPhoneStations).toFixed(3))
          : null,
      goldPhoneHitRate:
        live && goldPhoneStations > 0
          ? Number((goldPhoneHits / goldPhoneStations).toFixed(3))
          : null,
      goldPhoneStations,
      goldPhoneHits,
      goldPhoneMisses,
      incorrect101AsDirect,
      switchboardOnlyCorrectRate:
        live && switchboardOnlyTotal > 0
          ? Number((switchboardOnlyCorrect / switchboardOnlyTotal).toFixed(3))
          : null,
      note: live
        ? 'Yield + gold-label precision. Hallucination = best phone digits absent from fetched evidence.'
        : 'Dry run validates multi-strategy query generation only. Re-run with --live and SERPER_API_KEY.',
    },
    rows,
  };

  const outDir = join(ROOT, 'data/reports');
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, `station-phone-eval-${report.generatedAt.slice(0, 10)}.json`);
  writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ ok: true, outPath, metrics: report.metrics }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
