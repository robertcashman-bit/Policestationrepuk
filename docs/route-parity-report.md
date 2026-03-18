# Route parity report — Live site vs project routes

**Target:** https://www.policestationrepuk.com  
**Generated:** 2026-03-08

---

## Live site URL count

| Source | Count |
|--------|-------|
| **Total internal URLs** | **358** |
| Home (`/`) | 1 |
| Single-segment (e.g. `/About`, `/Directory`) | 276 |
| Multi-segment (e.g. `/Blog/...`) | 81 |

*From `docs/live-site-map.json`.*

---

## Project route coverage

| Route | Serves | Status |
|-------|--------|--------|
| `/` (app/page.tsx) | Home | ✅ |
| `[slug]` (app/[slug]/page.tsx) | Single-segment URLs | ✅ All 276 + mirror-only |
| `[...slug]` (app/[...slug]/page.tsx) | Multi-segment URLs | ✅ All 81 |
| `/directory` | Find a Rep | ✅ |
| `/Contact`, `/register`, `/CustodyNote` | Key pages | ✅ |
| `/rep/[slug]`, `/county/[county]`, `/police-station/[station]` | Directory | ✅ |

**Project route count (content):** 358 (1 home + 276 single + 81 multi).  
**Live URL count:** 358.

**Parity:** ✅ **Project route count equals live URL count.** Every discovered URL is served by a project route (`dynamicParams = true` on `[slug]` and `[...slug]` so any path in the live site map returns a page).

---

## Missing routes

**None.** All 358 live URLs have a corresponding Next.js route. No new page files required.

---

## How routes are resolved

- **Home:** `app/page.tsx`
- **Single-segment (e.g. /About, /Contact):** `app/[slug]/page.tsx` — allowed paths from `getLiveSiteSingleSegmentPaths()` + mirror paths; unknown paths still served via `dynamicParams`.
- **Multi-segment (e.g. /Blog/post):** `app/[...slug]/page.tsx` — allowed paths from `getLiveSiteMultiSegmentPaths()` + mirror paths.
- **Directory:** `app/directory/page.tsx` (maps to live /Directory).

To add more discovered URLs in future, update `docs/live-site-map.json` and ensure `lib/live-site-paths.ts` reads it; the same catch-all routes will serve the new paths.
