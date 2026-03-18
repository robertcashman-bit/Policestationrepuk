# Current project analysis

**Target:** https://www.policestationrepuk.com  
**Analysis date:** 2026-03-08  
**Rule:** Do not overwrite or delete anything that already works. Extend only.

---

## 1. Existing routes

| Route | File | Status | Notes |
|-------|------|--------|------|
| `/` | `app/page.tsx` | **EXISTS** | Homepage; mirror or HeroSection fallback |
| `/directory` | `app/directory/page.tsx` | **EXISTS** | Rep directory with search, filters, RepCard grid |
| `/register` | `app/register/page.tsx` | **EXISTS** | Registration form + RegisterForm.tsx |
| `/Contact` | `app/Contact/page.tsx` | **EXISTS** | Contact form + ContactForm.tsx |
| `/CustodyNote` | `app/CustodyNote/page.tsx` | **EXISTS** | CustodyNote promo, CTAs, discount |
| `/[slug]` | `app/[slug]/page.tsx` | **EXISTS** | Single-segment content; mirror or crawl or SITEMAP_PATHS |
| `/[...slug]` | `app/[...slug]/page.tsx` | **EXISTS** | Multi-segment (blog, etc.); mirror data |
| `/rep/[slug]` | `app/rep/[slug]/page.tsx` | **EXISTS** | Rep profile pages (data/reps.json) |
| `/county/[county]` | `app/county/[county]/page.tsx` | **EXISTS** | County pages |
| `/police-station/[station]` | `app/police-station/[station]/page.tsx` | **EXISTS** | Station pages |
| `/api/contact` | `app/api/contact/route.ts` | **EXISTS** | POST contact form |
| `/api/register` | `app/api/register/route.ts` | **EXISTS** | POST rep registration |
| `robots.txt` | `app/robots.ts` | **EXISTS** | SEO |
| `sitemap.xml` | `app/sitemap.ts` | **EXISTS** | SEO |

---

## 2. Route data sources

- **Mirror (content):** `data/pages.json` — 110 pages. Drives `[slug]` and `[...slug]` when present.
- **Fallback (no mirror):** `lib/sitemap-paths.ts` — SITEMAP_PATHS (116 single-segment slugs) for `[slug]` static params.
- **Directory:** `data/reps.json` (21 reps), `data/counties.json`, `data/stations.json` — directory and rep/county/station pages.
- **Crawl map (reference):** `docs/crawl-map.json` — 358 URLs from an earlier full crawl.

---

## 3. Reusable components

| Component | File | Status | Purpose |
|-----------|------|--------|---------|
| Header | `components/Header.tsx` | **EXISTS** | Sticky nav, logo, links, Register CTA |
| Footer | `components/Footer.tsx` | **EXISTS** | Copyright, Find a Rep, Contact, Register, About, Privacy, Terms |
| Navigation | `components/Navigation.tsx` | **EXISTS** | Reusable nav list with optional primary CTA |
| HeroSection | `components/HeroSection.tsx` | **EXISTS** | Hero with title, subtitle, primary/secondary CTAs |
| PageSection | `components/PageSection.tsx` | **EXISTS** | Section wrapper with optional title (use as ContentSection) |
| ContentBlock | `components/ContentBlock.tsx` | **EXISTS** | Rounded card for prose content |
| DirectoryCard | `components/DirectoryCard.tsx` | **EXISTS** | Wraps RepCard for directory |
| RepCard | `components/RepCard.tsx` | **EXISTS** | Single rep card (name, accreditation, counties, phone, link) |
| RepListing | `components/RepListing.tsx` | **EXISTS** | Rep row/card with optional compact mode |
| CallToAction | `components/CallToAction.tsx` | **EXISTS** | CTA block with title, description, buttons |
| DirectorySearch | `components/DirectorySearch.tsx` | **EXISTS** | Filters + results grid |
| DirectoryFilters | `components/DirectoryFilters.tsx` | **EXISTS** | County, station, availability, accreditation, query |
| Breadcrumbs | `components/Breadcrumbs.tsx` | **EXISTS** | Breadcrumb trail |
| JsonLd | `components/JsonLd.tsx` | **EXISTS** | JSON-LD for SEO |
| StationCard | `components/StationCard.tsx` | **EXISTS** | Police station card |

**PageLayout:** Provided by `app/layout.tsx` (root layout with Header, main, Footer). No separate PageLayout component; layout is the single source.

---

## 4. Working layouts

- **Root layout:** `app/layout.tsx` — Inter font, Header, main, Footer, globals.css. **Do not replace.**
- **Page-level:** Pages use `mx-auto max-w-* px-6 py-*` containers. Consistent and working.

---

## 5. Existing styling

- **File:** `app/globals.css`
- **Variables:** `--background`, `--foreground`, `--primary`, `--accent`, `--muted`, `--border`
- **Theme:** Tailwind @theme inline; `--font-sans` uses Inter (`--font-inter` from layout).
- **Design:** Clean professional legal; Stripe/Linear/Vercel-style. Documented in `docs/design-direction.md`.
- **Enhancements:** Apply only safe improvements (spacing, hover, transitions). Do not change working colour or layout.

---

## 6. Classification summary

- **EXISTS:** All listed routes and components above. Do not regenerate or overwrite.
- **PARTIAL:** None identified; mirror pages show content when data exists, fallback when not.
- **MISSING:** Live URLs that are not in current `data/pages.json` (358 in crawl map vs 110 in mirror). Those URLs are only missing in the sense of mirror content; the route patterns `[slug]` and `[...slug]` would serve them if their path were added to the mirror. To add them: re-crawl and merge into `data/pages.json`, or add specific pages only where needed.

---

## 7. Safe next steps

1. Create `docs/live-site-map.json` from `docs/crawl-map.json` (or crawl) — no overwrite of app code.
2. Update `docs/route-comparison.md` — compare live URLs to project route coverage.
3. Ensure `data/page-content.json` and `data/reps.json` are populated — already done; extend only if new crawl run.
4. Add only **missing** routes (e.g. a dedicated page for a URL that must not use [slug]); do not replace existing pages.
5. Design polish: tweak spacing, hover, or typography in existing components only where it does not break layout.
