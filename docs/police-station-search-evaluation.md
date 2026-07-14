# Police station search — evaluation

## Dataset

`data/evaluation/station-phone-eval-set.json` — 50 active stations across major forces (Met, Kent, GMP, West Midlands, South/North Wales, Devon & Cornwall, Norfolk, Cumbria, Thames Valley, Essex, Hampshire, Avon & Somerset, etc.), mixing custody suites and ordinary stations.

`expected.outcome` starts as `unknown` until each row is hand-audited against current public sources. Fill `expected.phone` when a verified public number is known.

## Harness

```bash
npm run custody:eval                 # dry — query strategy coverage
npm run custody:eval:live            # Serper + fetch (quota)
npm run custody:eval:live -- --limit=10
```

Writes `data/reports/station-phone-eval-YYYY-MM-DD.json`.

## Metrics tracked

| Metric | Meaning |
|--------|---------|
| `queryVariantsPerStationAvg` | Alias / strategy expansion health |
| `anyCandidateRate` | Share of stations with ≥1 extracted candidate (live) |
| `scoredCandidateRate` | Candidates above score floor |
| `custodyContextCandidateRate` | Candidates with custody wording |
| `genericOr101Hits` | Count of non-station-specific detections |
| `hallucinatedResults` | Requires curated `expected.phone` (manual) |

## Before / after (architecture)

| Area | Before | After |
|------|--------|-------|
| Queries used / suite | ≤4, no adaptive fallback | 8 + fallback to 14 |
| Per-query Serper failure | Aborts suite | Continues + retries |
| Candidates / URL | 1 | up to 6 scored |
| PDFs | Snippet only | Body text + `pdf_fetch` |
| OSM phones | None | Nominatim + Overpass |
| Search telemetry | None | KV attempts |
| Outstanding digest | Unscheduled | Daily 19:15 UTC |
| Default batch | 10 | 20 |

Dry-run expectation: `queryVariantsPerStationAvg` ≥ 12.  
Observed dry (2026-07-14): **31** variants/station average.

Live smoke (2026-07-14, `n=8`, OSM off, Serper + page/PDF fetch):

| Metric | Value |
|--------|-------|
| `anyCandidateRate` | **1.0** |
| `scoredCandidateRate` | **1.0** |
| `custodyContextCandidateRate` | **1.0** |
| `genericOr101Hits` | 0 |
| `hallucinatedResults` | 0 |

These rates measure extraction yield before AI publish gates. Full 50-station precision scoring still needs curated `expected.phone` labels.

## Manual audit protocol

For each evaluation station:

1. Search force site + police.uk for current contact/custody pages.
2. Record expected phone / or `no_public_number_found` / `force_switchboard_only`.
3. Compare pipeline candidates + classification.
4. Flag false stations, closed stations, renamed suites separately.
