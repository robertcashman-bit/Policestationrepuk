# Crawl output

This folder is populated by the site crawler. Each page is stored as a JSON file.

## Run the crawler

```bash
npm run crawl
```

This installs Playwright Chromium (if needed) and crawls all URLs from the sitemap. Output is written here.

## JSON structure (per page)

| Field     | Type     | Description |
|----------|----------|-------------|
| `url`    | string   | Full page URL |
| `path`   | string   | Pathname (e.g. `/About`) |
| `title`  | string   | Document title |
| `headings` | array  | `{ level: 1–6, text: string }[]` |
| `content`| string   | Main body text (from main/article/body) |
| `links` | array    | `{ href: pathname, text: string }[]` (internal only) |
| `crawledAt` | string | ISO timestamp |
| `error`  | string?  | Set if the crawl failed |

## Manifest

`manifest.json` lists all crawled pages and their filenames so the static generator can iterate without reading the sitemap again.

## Using in the Next.js app

Use the helpers in `lib/crawl-data.ts`:

```ts
import { getCrawlPage, getCrawlManifest, hasCrawlData } from '@/lib/crawl-data';

// In a page or getStaticProps:
const data = getCrawlPage('/About');  // or getCrawlPage('About')
if (data) {
  // data.title, data.headings, data.content, data.links
}

const manifest = getCrawlManifest();
if (hasCrawlData()) {
  // Crawl output exists; you can render from it
}
```

Then in `app/[slug]/page.tsx` you can branch: if `getCrawlPage(slug)` exists, render title/headings/content from it; otherwise use the placeholder.
