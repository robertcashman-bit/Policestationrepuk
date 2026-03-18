# Route comparison: Live site vs Next.js project

**Target:** https://www.policestationrepuk.com  
**Live site map:** [docs/live-site-map.json](./live-site-map.json) (358 URLs)  
**Crawl map:** [docs/crawl-map.json](./crawl-map.json)  
**Generated:** 2026-03-08  

## Route classification (do not overwrite EXISTS)

| Classification | Meaning | Action |
|----------------|--------|--------|
| **EXISTS** | Route exists and serves content (mirror or dedicated page). | Do not regenerate. |
| **PARTIAL** | Route exists but content is placeholder or thin. | Enhance content only; do not replace layout. |
| **MISSING** | No route for this URL. | Generate only for URLs with no matching pattern. |

**Current state:** All route *patterns* exist (/, /directory, /register, /Contact, /CustodyNote, [slug], [...slug], /rep/[slug], /county/[county], /police-station/[station]). Content for 110 URLs is in `data/pages.json` (mirror). The remaining 248 URLs from the live site map are **MISSING content** (not missing routes): add them by re-crawling and merging into `data/pages.json`, or add dedicated pages only where needed. Do not delete or overwrite existing working pages.

---

## Next.js routes (current)

| Route pattern | File | Serves |
|---------------|------|--------|
| `/` | `app/page.tsx` | Homepage |
| `/directory` | `app/directory/page.tsx` | Rep directory (search) |
| `/register` | `app/register/page.tsx` | Rep registration info |
| `/[slug]` | `app/[slug]/page.tsx` | **Single-segment** paths (e.g. `/About`, `/Directory`, `/Contact`, `/CustodyNote`) |
| `/[...slug]` | `app/[...slug]/page.tsx` | **Multi-segment** paths (e.g. `/blog/post-slug`, `/functions/sitemap`) |
| `/rep/[slug]` | `app/rep/[slug]/page.tsx` | Individual rep profile pages |
| `/county/[county]` | `app/county/[county]/page.tsx` | County listing pages |
| `/police-station/[station]` | `app/police-station/[station]/page.tsx` | Police station pages |

**Data for `[slug]:**  
- If `data/pages.json` exists: all paths from that file (including multi-segment) are in `getMirrorPaths()`, but **only the first segment** is matched by `[slug]`. So `/blog` is served; `/blog/domestic-allegations-police-station-stage` is **not** (would 404 or be interpreted as slug with slash).
- If no mirror data: `SITEMAP_PATHS` (116 single-segment paths) are pre-rendered.

---

## Coverage summary

| Category | Live URLs (examples) | Project coverage |
|----------|----------------------|------------------|
| Homepage | `/`, `/Home` | ✅ `/` (home); `/Home` via `[slug]` if in mirror/sitemap |
| Directory | `/Directory` | ✅ `/directory` (dedicated); `/Directory` via `[slug]` when in paths |
| Registration | `/Register` | ✅ `/register` (dedicated); `/Register` via `[slug]` |
| Promotional | `/CustodyNote` | ✅ Via `[slug]` (when in mirror/sitemap) |
| Informational | `/About`, `/Contact`, `/FAQ`, `/Resources`, etc. | ✅ Via `[slug]` (single segment) |
| Blog index | `/Blog`, `/blog` | ✅ Via `[slug]` |
| **Blog posts** | `/blog/domestic-allegations-police-station-stage`, etc. | ✅ Via `app/[...slug]/page.tsx` (catch-all) |
| Other multi-segment | `/regulatory-information`, `/faq`, `/contact` (lowercase) | ✅ If single segment; some live paths are lowercase single-segment |
| Rep profiles | (per-rep URLs on live site) | ✅ `/rep/[slug]` |
| County / station | (per-county, per-station) | ✅ `/county/[county]`, `/police-station/[station]` |

---

## Gaps (live URLs with no equivalent route)

1. ~~**Multi-segment paths (e.g. blog posts)**~~ **Fixed.**  
   - `app/[...slug]/page.tsx` now serves all multi-segment mirror paths (blog posts, `/functions/sitemap`, etc.).  
   - `app/[slug]/page.tsx` only generates params for single-segment paths.

2. **Case and path alignment**  
   - Live uses both PascalCase (`/Directory`, `/Register`) and lowercase (`/blog`, `/contact`).  
   - Project has `/directory`, `/register` (lowercase). So `/Directory` is served by `[slug]` (slug=Directory) when in static params; `/directory` is the directory page. Both can coexist.

3. **Feeds / functions**  
   - Live has `/functions/sitemap`, `/functions/rss`, `/feed`, `/feed.xml`, `/cookies`.  
   - Optional: add API routes or pages for sitemap/rss if we want parity; otherwise document as out of scope.

---

## Recommended next steps

1. ~~**Add catch-all route**~~ **Done.** `app/[...slug]/page.tsx` is in place and build generates 81 multi-segment paths.

2. **Ensure primary nav** (Directory, Register, CustodyNote, Contact) works: header/footer links should point to the same paths as the live site (e.g. `/Directory`, `/Register`, `/CustodyNote`, `/Contact`). Current `components/Header.tsx` and `Footer` use mirror or fallback links.

3. **Optional:** Add dedicated pages for key URLs (e.g. `/CustodyNote`, `/contact`) with custom layout/CTAs while still allowing mirror content to drive other slugs.
