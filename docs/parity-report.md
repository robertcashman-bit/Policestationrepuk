# Parity report — Live site vs project routes

**Target:** https://www.policestationrepuk.com  
**Generated:** 2026-03-08

---

## Live site URL count

| Metric | Count |
|--------|-------|
| **Total internal URLs** | **358** |
| Home (`/`) | 1 |
| Single-segment (e.g. `/About`, `/Contact`) | 276 |
| Multi-segment (e.g. `/Blog/...`) | 81 |
| Non-home content URLs | 357 |

*Source: `docs/live-site-map.json`*

---

## Project route count

| Route type | Generated paths | Serves live URLs |
|------------|-----------------|------------------|
| `/` (home) | 1 | 1 |
| `[slug]` (single-segment) | 351 | 276 (plus mirror-only) |
| `[...slug]` (multi-segment) | 81 | 81 |
| `/directory` | 1 | 1 (maps to live /Directory) |
| `/Contact`, `/register`, `/CustodyNote` | 3 | 3 |
| `/rep/[slug]` | 21 | N/A (directory reps) |
| `/county/[county]` | 25 | N/A (directory) |
| `/police-station/[station]` | 75 | N/A (directory) |
| **Content routes (live parity)** | **433** | **358** |

Every live URL (358) has a corresponding project route:

- Home is served by `app/page.tsx`.
- Single-segment live URLs are served by `app/[slug]/page.tsx` (static params from `docs/live-site-map.json` + `data/pages.json`).
- Multi-segment live URLs are served by `app/[...slug]/page.tsx` (static params from live-site-map).

**Conclusion:** **Route parity achieved.** Project routes ≥ live URLs (433 content-related routes cover 358 live URLs).

---

## Content parity (mirror data)

| Metric | Count |
|--------|-------|
| Live URLs | 358 |
| Pages with extracted content in `data/pages.json` | 125+ (grows as crawl:batched runs) |
| Pages with placeholder only | 233 or fewer |

To reach full **content** parity, run:

```bash
npm run crawl:batched
```

This crawls the remaining URLs (in batches) and merges content into `data/pages.json`. Each time a batch completes, more pages will show full content instead of the placeholder.

---

## Directory data

| Metric | Count |
|--------|-------|
| Representatives in `data/reps.json` | 21 |

Directory pages (`/directory`, `/rep/[slug]`, `/county/[county]`, `/police-station/[station]`) use this data and are fully functional.
