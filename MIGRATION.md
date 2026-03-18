# Base44 → Next.js migration (policestationrepuk.com)

## Status

- **Next.js app:** Built and deployable (Vercel: policestationrepuk-new).
- **URLs:** Existing sitemap URLs preserved via `app/[slug]`; county/rep/station use static routes and rewrites.
- **Directory:** Searchable filters (county, station, availability, accreditation, text search).
- **Content:** Run `npm run crawl` to mirror live site into `content/crawl/`; `[slug]` pages use it when present.

## Project structure

```
app/
├── layout.tsx                 # Root layout, Header, Footer, metadata
├── page.tsx                   # Homepage (PSR Connect)
├── globals.css                # Tailwind + CSS variables
├── sitemap.ts                 # Dynamic sitemap (all pages)
├── robots.ts                  # robots.txt
├── [slug]/page.tsx            # All legacy PascalCase URLs (About, Directory, etc.); uses crawl data when available
├── county/[county]/page.tsx   # County pages (SSG); served at /police-station-representatives-{county}
├── rep/[slug]/page.tsx        # Representative profiles (SSG)
├── police-station/[station]/page.tsx  # Police station pages (SSG)
├── directory/page.tsx         # Searchable directory (dynamic, filters)
└── register/page.tsx          # Rep registration CTA

components/
├── Header.tsx
├── Footer.tsx
├── Breadcrumbs.tsx
├── RepCard.tsx
├── StationCard.tsx
├── DirectoryFilters.tsx      # Client component: county, station, availability, accreditation, q
└── JsonLd.tsx                # JSON-LD script tag

lib/
├── data.ts                    # Data access (seed + Supabase when configured)
├── types.ts                   # Representative, PoliceStation, County, etc.
├── sitemap-paths.ts           # All legacy URLs from live sitemap
├── counties-content.ts       # SEO copy for county pages (Kent, London, Essex + generic)
├── crawl-data.ts              # getCrawlPage(), getCrawlManifest(), hasCrawlData()
├── crawl-types.ts             # CrawlPage, CrawlManifest
├── seo.ts                     # Re-exports from seo-layer
└── seo-layer/
    ├── config.ts              # SITE_URL, SITE_NAME (NEXT_PUBLIC_SITE_URL)
    ├── metadata.ts            # buildMetadata()
    ├── schemas.ts             # Organization, WebSite, LegalService, Person, Place, Breadcrumb, etc.
    └── index.ts

content/
└── crawl/                     # Output of npm run crawl (one JSON per page + manifest.json)

supabase/
└── schema.sql                 # DB schema for Phase 2+

scripts/
├── crawl-site.ts              # Playwright crawler → content/crawl/*.json
└── seed.ts                    # Optional DB seed
```

## URL map

| Live URL | Next.js route | Notes |
|----------|----------------|-------|
| `/` | `app/page.tsx` | Homepage |
| `/About`, `/Contact`, … | `app/[slug]/page.tsx` | Static; uses crawl JSON when present |
| `/Directory`, `/FindYourRep`, `/Register` | Rewrite → `/directory` or `/register` | next.config rewrites |
| `/police-station-representatives-{county}` | Rewrite → `/county/[county]` | County SSG |
| `/rep/{slug}` | `app/rep/[slug]/page.tsx` | Rep profile SSG |
| `/police-station/{station}` | `app/police-station/[station]/page.tsx` | Station SSG |
| `/directory` | `app/directory/page.tsx` | Directory with filters |

## Outstanding / optional

1. **Crawl content:** Run `npm run crawl` (or `CRAWL_LIMIT=5 npm run crawl` to test) so `[slug]` pages show real titles/headings/content from the live site.
2. **Subdomain DNS:** If using new.policestationrepuk.com, add A record `new` → `76.76.21.21` (see DEPLOY-SUBDOMAIN.md).
3. **Env:** Set `NEXT_PUBLIC_SITE_URL` in production to the final domain (or leave default policestationrepuk.com).
4. **Supabase (Phase 2):** Run `supabase/schema.sql`, set `NEXT_PUBLIC_SUPABASE_*`, then data layer uses DB instead of seed.

Nothing blocking; build passes and the app is ready to deploy.
