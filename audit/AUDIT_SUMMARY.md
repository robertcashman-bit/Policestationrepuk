# Audit summary

**Generated:** 2026-04-03T11:17:18.440Z  
**Framework:** Next.js 15 App Router  
**Static app routes:** 94  
**Internal `href` occurrences scanned:** 294  
**Defects (missing route):** 0

## Phase 1 — Discovery

- **CRAWL_MAP / ROUTE_MATRIX:** `audit/CRAWL_MAP.json`, `audit/ROUTE_MATRIX.json`
- **LINK_REGISTRY:** `audit/LINK_REGISTRY.json`
- **SEARCH_COMPONENT_LIST:** `audit/SEARCH_COMPONENT_LIST.md`
- **Dynamic data:** `data/*.json` (reps, stations, counties, wiki-articles, firms, blog, legal updates)

## Phase 2 — Internal link crawl

- Static scan of `app/`, `components/`, `lib/` for string literals `href="/..."`
- Validates against filesystem routes + wiki slugs + county slugs + rewrite aliases in this script
- Template/dynamic `href={`...`}` not exhaustively verified here

## Phase 3 — Search

- See `DEFECT_LOG.json → searchAudit` and `SEARCH_COMPONENT_LIST.md`

## External URLs

GOV.UK/Judiciary URLs not HTTP-verified here (many block bots). Spot-check in browser after deploy.

## Verdict

**PASS** — no missing internal routes detected by static scan.
