# Search indexing and Search Console

## Canonical host

- Production canonical URL is **https://policestationrepuk.org** (apex). `www` is redirected to apex in `middleware.ts`.
- In [Google Search Console](https://search.google.com/search-console), add the **URL-prefix** or **domain** property that matches how users reach the site. Prefer the **apex** property to align with `SITE_URL` and `robots.ts` `host` / sitemap URLs.

## Sitemap

- Submit **`https://policestationrepuk.org/sitemap.xml`** once per property (or rely on discovery via `robots.txt`).
- `app/robots.ts` allows `/`, disallows `/api/`, and references the sitemap on `SITE_URL`.

## Blog and static assets

- `/Blog` and blog posts are intended to be indexed. Hero images live under `/images/blog/raster/` as WebP.
- Do not set `noindex` on blog routes unless a page is intentionally excluded.

## After deploy

1. Confirm `robots.txt` and `sitemap.xml` over HTTPS on the apex host.
2. Submit the sitemap in GSC for the apex property.
3. Spot-check a blog URL in **URL Inspection** after major SEO changes.
