# Site mirror – policestationrepuk.com

This project replicates the existing website so it can later replace the live site without losing SEO. **No redesign; URLs and structure match the current site.**

## Commands

**Crawler (discover all internal links, capture content):**
```bash
npm install
npx playwright install chromium
node scripts/crawl-site.js
```
Or in one go: `npm run crawl`

**Run the mirrored site locally:**
```bash
npm install
npm run dev
```
Then open http://localhost:3000

## What the crawler does

1. **Starts at** https://policestationrepuk.com
2. **Discovers** all internal links from each page and crawls them (BFS until no new pages).
3. **Captures** per page:
   - URL and path
   - Page title
   - Headings (h1–h6)
   - Visible main content text
   - Images (src + alt)
   - Internal links
4. **Saves** to `data/pages.json`.
5. **Optionally** extracts directory-style data into `data/reps.json`, `data/stations.json`, `data/counties.json` when detected.
6. **Generates** `public/sitemap.xml` and `public/robots.txt` from crawled URLs.

## How the mirror is built

- **Home:** `app/page.tsx` – renders content from `data/pages.json` for path `/` when present.
- **All other URLs:** `app/[slug]/page.tsx` – one dynamic route for every path (e.g. `/Directory`, `/PoliceStationRepsSurrey`, `/About`). Content comes from `data/pages.json`; no URL changes.
- **Navigation:** Header and footer use internal links captured from the crawl (homepage links). If no crawl data exists, fallback links are used.
- **SEO:** Each mirrored page uses the original title, headings, and a meta description from content. Canonical URLs point to the same path. Sitemap and robots are written to `public/` by the crawler; the app also serves `/sitemap.xml` and `/robots.txt` with the same policy.

## Performance (no layout change)

- Pages are statically generated from `data/pages.json`.
- Images in mirrored content use `loading="lazy"` and `decoding="async"`.
- Minimal client JavaScript; mirror content is server-rendered.

## After crawling

- With `data/pages.json` present, the app uses it for all mirror pages and navigation.
- Without it, the app still runs and shows fallback structure and links so the site is usable before the first crawl.
