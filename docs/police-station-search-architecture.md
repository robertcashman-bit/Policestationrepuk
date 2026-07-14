# Police station search architecture

## Goals

1. Find materially more legitimate station / custody telephone numbers.
2. Never invent numbers — every published value needs sourced evidence.
3. Label switchboards, enquiry lines, custody desks, and 101 correctly.
4. Preserve verified published numbers when later searches fail.
5. Remain reliable on Vercel Fluid Compute (cron + KV).

## Pipeline stages

### A — Station resolution

`stationToCustodySuite` / `resolveStationSearchIdentity` attach:

- canonical name, aliases, force, town, county, postcode, address, lat/lng, custody vs station flags.

Aliases are generated automatically (`station-aliases.ts`).

### B — Targeted search (Tier 1 → 3)

`buildRankedSearchQueries` emits ordered strategies:

| Tier | Examples |
|------|----------|
| 1 | force domain, police.uk, gov.uk, PDF custody queries, enquiry office |
| 2 | postcode, address, town, aliases, force directories |
| 3 | broader `"telephone"` / `"custody"` corroboration |

`searchForSuite`:

- runs Serper with UK locale;
- retries 429/5xx;
- continues after non-fatal per-query errors;
- expands to fallback budget when results are empty/sparse;
- records attempts in KV (`search-attempts.ts`).

Official force pages (`official-pages.ts`) and OpenStreetMap phone tags (`openstreetmap.ts`) merge ahead of / alongside organic results.

### C — Page / PDF retrieval

- HTML via `fetchCachedPageHtml` (12s timeout, KV cache).
- PDF via `fetchPdfText` (lightweight stream string extraction).
- Budget: `CUSTODY_DISCOVERY_PAGE_FETCH_LIMIT` (default 6), priority to `.police.uk` / gov.uk / PDFs.

### D — Deterministic extraction

`extractPhonesFromText` + `libphonenumber-js` E.164 via `toE164Uk`.

Reject 999/112/911 and force generic lists (`generic-numbers.ts`).

### E — Classification

Rule-based + optional GPT-4o-mini (`classify.ts`):

`direct_custody | switchboard | general_101 | solicitor_office | victim_witness | irrelevant | unknown`

Switchboard findings may be stored (labelled). Solicitor/victim/irrelevant are dropped.

### F — Confidence

`scoreConfidence` uses source authority, corroboration counts, custody wording, archive age, conflicts.

### G — AI review (structured, no memory)

GPT-4o-mini receives **only** the evidence excerpt. System prompt forbids invention and ignores webpage instructions. Output validated (`ai-review-validator.ts`).

### H — Publication decision

Auto-publish only when hard gates pass (`auto-decision.ts`):

- publishable number range;
- `direct_custody`;
- strong evidence (`page_fetch` or `pdf_fetch`);
- custody wording + phone in excerpt;
- official path or multi-domain corroboration;
- never overwrite a different approved number.

Statuses remain review-queue oriented in KV; admin UI at `/admin/custody-number-review`.

## Storage

| Store | Role |
|-------|------|
| KV `custodyfinding:*` / `approvedcustody:*` | Live findings & publish |
| KV `custodysearchattempt:*` | Search telemetry |
| `data/stations.json` | Directory identity |
| Supabase migration `20260714_station_phone_pipeline.sql` | Optional SQL mirror schema |

## Concurrency / idempotency

- Suite cursor rotation (`cursor.ts`).
- Finding hash dedupe (`hashOfSourceEvidence`).
- Approve lock in storage.
- Cron auth via `CRON_SECRET`.
