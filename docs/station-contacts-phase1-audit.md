# Phase 1 audit — station contact system (summary)

**Date:** 2026-07-20  
**Principle:** Missing number > invented number. No FOI workflows.

## What exists today

The repo already ships a **custody-desk discovery pipeline** (Serper → official force pages → GPT review → auto-decision → KV overlay → admin review → publish gate). See [`docs/custody-discovery-ops.md`](custody-discovery-ops.md).

Station directory data lives in `data/stations.json` (~896 stations) with verification sidecars in `data/station-verification.json`. Admin review hubs cover custody numbers, community corrections, and station updates.

## Baseline snapshot (static files)

| Metric | Count |
|--------|------:|
| Stations | 896 |
| Dialable main `phone` | 773 |
| Verified main phones (with source) | 256 |
| Unverified main phones | 616 |
| Custody stations | 95 |
| Dialable `custodyPhone` in JSON | 22 |

## Gap vs full contact coverage

Custody discovery is mature; **main-line / front-counter / hours research** is not yet continuous. Phase 4–7 adds a flagged, dry-run station-research loop that reuses custody patterns without writing `stations.json` or auto-publishing main lines.

## Next steps

- Ops: [`docs/station-research-ops.md`](station-research-ops.md)
- Comparison report: `data/reports/station-research-phase47-2026-07-20.json`
- Keep `STATION_RESEARCH_*` flags off and dry-run on until admin review of candidates
