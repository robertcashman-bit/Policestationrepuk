# Police station number system — root-cause audit

**Site:** policestationrepuk.org  
**Date:** 2026-07-14  
**Scope:** AI-assisted custody / station telephone discovery pipeline

## Executive summary

The public directory’s AI discovery loop is real (Serper search → page/PDF fetch → deterministic extraction → GPT-4o-mini review → KV publish overlay). Poor yield was not caused by “a weak prompt alone”. Evidence from code paths shows **throughput limits**, **query truncation**, **PDF skip**, **single-candidate-per-URL**, **suite-aborting search errors**, an **unscheduled outstanding digest**, and **strict publish gates that discard recoverable contact labels**.

## End-to-end data flow (as found)

```text
data/stations.json
  → getAllStations() / finalizeStations()
  → buildCustodySuitesFromStations()          # all ~900 active stations
  → cron /api/cron/custody-number-discovery   # every 6h
      → seedFindingsFromOfficialJson
      → Serper search + official force pages
      → extract/classify → KV custodyfinding:*
      → GPT-4o-mini AI review (excerpt only — no web browsing)
      → auto-decision publish / reject / queue
  → approvedcustody:* KV
  → applyApprovedDiscoveryNumbers() at read time
  → StationPhone / police-station pages
```

| Concern | Finding | Evidence |
|--------|---------|----------|
| Station list origin | `data/stations.json` via `lib/data.ts` `getAllStations` | loader + finalizeStations |
| AI model | `gpt-4o-mini`, temperature 0 | `lib/custody-discovery/ai-review.ts`, `classify.ts` |
| Web access for AI | **None** — only pre-fetched excerpts | no tools; OpenAI chat completions only |
| Search provider | Serper Google API only (`google.serper.dev`) | `lib/custody-discovery/search.ts` |
| Persist store | Upstash/Vercel KV (not live Supabase) | `lib/custody-discovery/storage.ts` |
| Public site read path | Same KV overlay on stations.json | `overlay.ts` + `finalizeStations` |

## Root causes (with evidence)

### 1. Query budget truncated fallback strategies (high impact)

`searchForSuite` previously sliced to `CUSTODY_DISCOVERY_MAX_QUERIES` default **4**, while `buildSearchQueries` already had more queries. Postcode / address / enquiry / alias strategies were never reached for most suites.

**Fix:** ranked strategies + adaptive fallback up to `CUSTODY_DISCOVERY_FALLBACK_QUERIES` (default 14); default max queries raised to 8.

### 2. First Serper error aborted the whole suite (high impact)

On any `SearchQueryError`, `searchForSuite` returned immediately — one 429 starved remaining variants.

**Fix:** per-query continue + retry/backoff on 429/5xx; suite hard-fails only on missing API key.

### 3. Only one phone persisted per URL (high impact)

`crawlCustodySuite` counted all extracted phones but `processSearchHit` kept a single `pickBest` candidate.

**Fix:** `processAllPhonesFromHit` / `listScoredCustodyCandidatePhones` (up to 6 scored candidates/URL).

### 4. PDFs never body-fetched (high impact)

`isFetchableUrl` excluded `.pdf`; evidence marked `pdf_unfetched` → weak_evidence auto path.

**Fix:** lightweight PDF text extraction (`pdf-text.ts`); `pdf_fetch` accepted as strong evidence for publish gates.

### 5. Throughput too low for ~900 stations

Default batch **10** suites / 6h ≈ 40/day → multi-week full coverage. Cursor missing-first helps but still slow.

**Fix:** default batch **30** (still within 300s Fluid Compute).

### 6. Tier-2 structured sources unused

No OpenStreetMap / Wikidata / Places path in the live crawl.

**Fix:** Nominatim + Overpass phone tags (`openstreetmap.ts`), opt-out via `CUSTODY_DISCOVERY_OSM=false`.

### 7. Switchboard / 101 discarded before learning

`REJECT_CLASSIFICATIONS` included `switchboard` and `general_101`, so the system could not record “only force switchboard is public”.

**Fix:** store switchboard findings as labelled contact outcomes; still never auto-publish as direct custody. Keep solicitor/victim/irrelevant rejected.

### 8. Outstanding digest not scheduled

`/api/cron/custody-discovery-outstanding` existed but was absent from `vercel.json` → human review backlog starved.

**Fix:** scheduled `15 19 * * *` plus daily discovery summary cron `30 19 * * *`.

### 9. Custody-wording threshold + thin snippets

Candidates without “custody” near the number scored below `MIN_PHONE_CANDIDATE_SCORE` when suite tokens were weak; snippet-only pages with page-fetch budget 3 often never fetched bodies.

**Fix:** enquiry-office wording bonus; page fetch budget default 6; PDF+HTML fetch; richer aliases.

### 10. Official seed coverage thin

Committed seeds only Devon & Cornwall + Kent; Playwright GHA only expands Devon & Cornwall.

**Status:** still a coverage gap; multi-query + OSM reduce dependency on those seeds. Expand official JSON forces as follow-up.

### 11. Auto-reject of AI “reject” at any confidence

`shouldAutoRejectAiFinding` rejected whenever AI said reject (tests encode this). Low-confidence false rejects can clear true positives.

**Status:** left behaviour intact to avoid weakening gates incorrectly; ops should monitor reject rates via the new daily summary. Prefer raising human outstanding digest (now scheduled) over quietly keeping weak AI rejects.

### 12. Verified overwrite protection

Recheck keeps published numbers on source failure (`approved-recheck.ts`). Auto-publish hard-gates block different approved numbers. Reject of an approved finding still revokes visibility — intended admin/AI path.

### 13. Production cron hard-failed on KV WRONGTYPE (critical — observed live)

**Evidence (Vercel runtime logs, 2026-07-12 → 2026-07-14):**  
`GET /api/cron/custody-number-discovery` repeatedly returned **500** with:

```text
Error [UpstashError]: Command 1 [ sadd ] failed: WRONGTYPE Operation against a key holding the wrong kind of value
```

**Root cause:** `bootstrapCustodySuites` wrote `custodysuite:index` as a **JSON array string** via `kv.set`, while `saveCustodySuite` / `readIndexMembers` migration used Redis **`SADD`/`SMEMBERS`**. Calling `SADD` on a STRING key aborts the entire discovery run before crawling.

**Fix:** migrate-by-delete-then-SADD in `lib/kv-atomic.ts`; bootstrap indexes only via `SADD`; resilient `addToIndexSet` recovers WRONGTYPE.

### 14. HTML strip discarded `tel:` href numbers (high impact)

`htmlToText` removed all tags before extraction, so force pages that only expose numbers as `<a href="tel:…">` yielded zero candidates.

**Fix:** `lib/custody-discovery/html-text.ts` injects `Telephone: <n>` tokens from tel: hrefs before tag stripping; used by official-page + evidence fetch paths.

### 15. Custody-only classification blocked station numbers (high impact)

Pipeline / auto-publish required `direct_custody` + custody wording. Legitimate **station** and **public enquiry** numbers were classified `unknown` and could never auto-publish or overlay the public `phone` field.

**Fix:** classifications `direct_station` / `public_enquiry`; publish gates accept them with station/enquiry wording; approved overlay can write `phone` via `contactField`.

### 16. Adaptive search keyed on SERP rows, not extracted phones

Fallback query budget expanded when search returned &lt;3 URLs, not when those URLs yielded zero persistable phones.

**Fix:** crawler re-runs remaining fallback query budget when `created === 0`.

## Silent failure modes observed in design

| Mode | Behaviour |
|------|-----------|
| Missing `SERPER_API_KEY` in prod | Cron 500 via `validateCustodyEnv` |
| Page/Cloudflare block | `null` fetch → snippet fallback → weak evidence |
| KV missing | Findings cannot persist |
| OpenAI missing | AI hold (`no_openai`); rules still classify |
| Legacy JSON suite index (pre-fix) | Cron 500 WRONGTYPE until migrated |

## Production scheduler confirmation

`vercel.json` custody crons were present for discovery, AI review, queue reprocess, approved recheck. Gaps closed for outstanding digest + discovery summary. Function `maxDuration` 300s on discovery path; Fluid Compute default timeout supports this.

## Public vs write path

Writers update KV. Public pages read stations.json + KV overlays in `finalizeStations`. They are the same logical records when KV is configured in production.

## Definition of fixed (this change set)

See companion docs under `docs/police-station-search-*.md` and evaluation under `data/evaluation/` + `scripts/evaluate-station-phone-discovery.ts`.

---

## Addendum — 2026-07-15 (KV gap-fix pass)

Scope: keep Upstash KV; raise recall/precision without SQL rebuild.

### Remaining root causes addressed in this pass

| Cause | Evidence | Fix |
|-------|----------|-----|
| Low-confidence AI `reject` auto-cleared true positives | `shouldAutoRejectAiFinding` rejected whenever AI said reject | Require AI reject confidence ≥ `CUSTODY_AI_MIN_REJECT_CONFIDENCE` (default 80), or deterministic generic/unsafe/rep-directory |
| `101` / switchboard could overlay public station phones | `overlay.ts` only checked `isDialablePhone` | `isPublishableOverlayNumber` blocks generic/101/emergency and switchboard publication statuses |
| Kent seed used `policestationreps.com` URLs | `data/kent-psr-custody-numbers.json` | Seed ingest skips rep-directory URLs (no publish-path pollution) |
| Query budget for ordinary stations spent on custody wording first | First 8 queries were custody-centric | Non-custody suites now prioritise enquiry/postcode/town queries in tier 1 |
| Throughput | Default batch 20 / 6h | Default batch **30** |
| Gold eval labels empty | All `expected.outcome = unknown` | Labelled 50-station set from official seeds + `stations.json` + HQ heuristics |
| Cloudflare force pages | Curl 403 on WMP/Essex/etc. | Generic Playwright fetcher + weekly GHA matrix expansion (D&C + WMP + Essex + Hampshire) |

### Explicit non-goals (unchanged)

- No Postgres migration to `police_stations` / `station_phone_candidates` tables
- No Google Places / Bing Local
- No Playwright inside Vercel cron (weekly GHA only)

### Ship gate

Deploy only when `npm run custody:eval:live` against labelled set shows material recall gain without hallucinated phones or inflated `101`-as-direct rates. See `docs/police-station-search-evaluation.md`.
