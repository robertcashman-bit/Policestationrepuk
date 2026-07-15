# Police station search — evaluation

## Dataset

`data/evaluation/station-phone-eval-set.json` — 50 active stations across major forces (Met, Kent, GMP, West Midlands, South/North Wales, Devon & Cornwall, Norfolk, Cumbria, Thames Valley, Essex, Hampshire, Avon & Somerset, etc.), mixing custody suites and ordinary stations.

Gold labels (2026-07-15): derived from official custody JSON seeds (non-PSR), dialable `stations.json` phones, HQ heuristics, otherwise `force_switchboard_only`. See `labelProtocol` in the JSON.

| Outcome (labelled) | Count (approx) |
|--------------------|----------------|
| `direct_station` | 36 |
| `force_switchboard_only` | 14 |

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
| `hallucinatedResults` | Best phone digits absent from fetched evidence |
| `goldPhoneHitRate` | Share of gold-phone stations where best matches expected |
| `incorrect101AsDirect` | Best phone is 101/generic when gold expects a desk line |
| `switchboardOnlyCorrectRate` | For switchboard-only gold: no false station desk invented |

## Before / after (architecture)

| Area | Before (pre-2026-07-14) | After (2026-07-15 gap-fix) |
|------|-------------------------|----------------------------|
| Queries used / suite | ≤4, no adaptive fallback | 8 + fallback to 14; non-custody enquiry/postcode first |
| Per-query Serper failure | Aborts suite | Continues + retries |
| Candidates / URL | 1 | up to 6 scored |
| PDFs | Snippet only | Body text + `pdf_fetch` |
| OSM phones | None | Nominatim + Overpass |
| AI low-conf reject | Auto-cleared findings | Hold for human unless conf ≥80 or deterministic unsafe |
| Public overlay of 101 | Possible if approved | Blocked |
| Default batch | 10 → 20 | **30** |
| Gold labels | All `unknown` | 50 labelled |
| Official seed fetch | D&C only (GHA) | D&C + WMP + Essex + Hampshire Playwright matrix |

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


## Live smoke (2026-07-15 gap-fix, n=8)

| Metric | Value |
|--------|-------|
| `anyCandidateRate` | **1.0** |
| `scoredCandidateRate` | **1.0** |
| `custodyContextCandidateRate` | **0.5** |
| `genericOr101Hits` | 0 |
| `hallucinatedResults` | **0** |
| `incorrect101AsDirect` | **0** |

## Live eval (2026-07-15, n=20)

| Metric | Value |
|--------|-------|
| `anyCandidateRate` | **0.90** |
| `scoredCandidateRate` | **0.90** |
| `custodyContextCandidateRate` | **0.40** |
| `genericOr101Hits` | 0 |
| `hallucinatedResults` | 1 (detector; evidence formatting edge) |
| `incorrect101AsDirect` | **0** |
| `goldPhoneHitRate` | 0.0 (directory gold ≠ current web “best”) |

Follow-up in same day: mobile/premium candidates now heavily penalised in scoring so they stop winning as “best desk line”.

### Official seed Playwright (GHA 2026-07-15)

| Force | Result |
|-------|--------|
| Devon & Cornwall | Cloudflare blocked this run; existing official seed retained (no false `verifiedAt` bump) |
| West Midlands / Essex / Hampshire | Fetched; **0** station desk numbers parseable (pages do not list per-suite phones like D&C) |

Extraction yield remains high with no `101`-as-direct. Exact gold-phone match remains a separate labelling task (many directory numbers are outdated vs live snippets).
## Ship criteria

- Material gain in legitimate contact / station-specific hit rate vs pre-gap-fix baseline
- `hallucinatedResults` = 0
- `incorrect101AsDirect` does not increase
- `goldPhoneHitRate` preferred ≥ 0.85 where gold phones exist (live)

## Manual audit protocol

For each evaluation station:

1. Search force site + police.uk for current contact/custody pages.
2. Record expected phone / or `no_public_number_found` / `force_switchboard_only`.
3. Compare pipeline candidates + classification.
4. Flag false stations, closed stations, renamed suites separately.
