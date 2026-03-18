# Build status — PoliceStationRepUK rebuild

**Target:** https://www.policestationrepuk.com  
**Last build:** 2026-03-08  
**Status:** Route parity achieved. All 358 crawl-map URLs have a working route.

---

## Routes implemented

| Route | Type | Description |
|-------|------|-------------|
| `/` | Static | Homepage (mirror or fallback) |
| `/directory` | Dynamic | Rep directory with search, filters, RepCard grid |
| `/register` | Static | Rep registration form + API |
| `/Contact` | Static | Contact form + API |
| `/CustodyNote` | Static | CustodyNote promotional page (CTA, link to custodynote.com, discount) |
| `/[slug]` | SSG | Single-segment content (About, Resources, FAQ, etc.) — 276 paths |
| `/[...slug]` | SSG | Multi-segment (blog posts, functions) — 81 paths |
| `/rep/[slug]` | SSG | Rep profile pages (21 reps) |
| `/county/[county]` | SSG | County pages (25 counties) |
| `/police-station/[station]` | SSG | Station pages (76 stations) |
| `/api/contact` | API | POST contact form submission |
| `/api/register` | API | POST rep registration submission |
| `/robots.txt`, `/sitemap.xml` | Static | SEO |

**Total static/SSG pages:** 238+ (homepage, [slug], [...slug], directory, register, Contact, CustodyNote, rep, county, police-station, etc.). Every URL in `docs/crawl-map.json` (358) is served by `/`, `/[slug]`, or `/[...slug]` from `data/pages.json`.

---

## Components

| Component | Purpose |
|-----------|---------|
| `Header` | Main nav: Find a Rep, CustodyNote, Register (CTA), Contact, About, Resources |
| `Footer` | Links: Find a Rep, CustodyNote, Register, Contact, About, Reps by County, Stations, Privacy, Terms |
| `RepCard` | Directory listing: name, accreditation, counties, availability, phone, link to profile |
| `DirectorySearch` | Filters + results grid (uses `DirectoryFilters`, `RepCard`) |
| `DirectoryFilters` | County, station, availability, accreditation, query |
| `ContactForm` | Contact page form (client) |
| `RegisterForm` | Register page form (client) |
| `Breadcrumbs`, `JsonLd` | SEO / structure |

---

## Data

- **Directory:** `data/reps.json` (mock reps), `data/counties.json`, `data/stations.json` — loaded via `lib/data.ts`.
- **Mirror/crawl:** `data/pages.json` (358 pages from crawl) — used by `[slug]` and `[...slug]` via `lib/mirror-data.ts`.
- **Crawl map:** `docs/crawl-map.json` — full URL list + primary nav.

---

## Forms and API

- **Contact:** `POST /api/contact` — expects `name`, `email`, `message`; optional `subject`. Logs only; can be wired to email/DB later.
- **Register:** `POST /api/register` — expects `name`, `email`; optional `phone`, `accreditation`, `counties`, `stations`, `availability`, `message`. Logs only; can be wired to Supabase/DB later.

---

## Styling

- **Tailwind** + CSS variables in `app/globals.css`: `--background`, `--foreground`, `--primary`, `--accent`, `--muted`, `--border`.
- Professional legal look: white/light background, navy primary, gold accent for CTAs.
- Header: “PoliceStationRepUK” branding; Register as primary CTA.
- Responsive: flex-wrap nav, grid directory, mobile-friendly forms.

---

## Gaps and next steps

1. **Email/DB for forms** — Connect `/api/contact` and `/api/register` to Resend/SendGrid or Supabase.
2. **CustodyNote discount code** — Replace placeholder `PSRUK` in `app/CustodyNote/page.tsx` with real code if provided.
3. **Redirects** — Optional: redirect `/Directory` → `/directory`, `/Register` → `/register` so one canonical URL per feature.
4. **Blog index** — `/Blog` is mirror content; could add a dedicated blog index page that lists posts from crawl/mirror.
5. **Performance** — Consider ISR or on-demand revalidation for directory if data becomes dynamic.

---

## How to run

- **Dev:** `npm run dev`
- **Build:** `npm run build`
- **Start (prod):** `npm run start`

**Route parity:** Every URL in `docs/crawl-map.json` (358) is served: homepage `/`, single-segment via `/[slug]`, multi-segment via `/[...slug]` (mirror data from `data/pages.json`). Dedicated pages for directory, register, Contact, CustodyNote. Build passes.
