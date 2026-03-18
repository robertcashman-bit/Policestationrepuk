# Agent task brief

Use this doc when directing an agent (or yourself) on the Police Station Rep Directory project.

---

## Project

- **Name:** Police Station Rep Directory  
- **Target site:** https://www.policestationrepuk.com  
- **Stack:** Next.js (App Router), Tailwind CSS, `data/reps.json` (+ optional Supabase)

See [project-context.md](./project-context.md) for purpose, core features, and codebase map.

---

## Reference docs

| Doc | Purpose |
|-----|--------|
| [project-context.md](./project-context.md) | Purpose, features, tech stack, key file locations |
| [crawl-map.json](./crawl-map.json) | Full list of live URLs and primary nav (from crawl) |
| [route-comparison.md](./route-comparison.md) | How Next.js routes map to live URLs; single vs multi-segment |
| [build-status.md](./build-status.md) | Current routes, components, data, forms/API, gaps, next steps |

---

## Common agent tasks

1. **Add or change a page**  
   - Static page: add `app/YourPage/page.tsx` (and optional layout).  
   - Dynamic: use `app/[slug]/page.tsx` (single segment) or `app/[...slug]/page.tsx` (multi-segment); content from `lib/mirror-data` / `lib/crawl-data` or `data/pages.json`.

2. **Update navigation**  
   - Header: `components/Header.tsx` — `DEFAULT_NAV` or `navLinks` from mirror.  
   - Footer: `components/Footer.tsx` — link list.

3. **Directory behaviour**  
   - Data: `data/reps.json`, `lib/data.ts` (`searchRepresentatives`, `getAllCounties`, `getAllStations`).  
   - UI: `app/directory/page.tsx`, `components/DirectorySearch`, `DirectoryFilters`, `RepCard`.

4. **Forms and API**  
   - Contact: `app/Contact/page.tsx` + `ContactForm.tsx`, `POST /api/contact`.  
   - Register: `app/register/page.tsx` + `RegisterForm.tsx`, `POST /api/register`.  
   - Extend API routes to send email or write to DB as needed.

5. **CustodyNote**  
   - Page: `app/CustodyNote/page.tsx`.  
   - Update discount code placeholder and copy as needed.

6. **Crawl / mirror**  
   - Run `npm run crawl:ts` (Playwright) to refresh `content/crawl/` and `data/pages.json`.  
   - Paths to crawl: `lib/sitemap-paths.ts` (`SITEMAP_PATHS`).

7. **Styling**  
   - Globals and variables: `app/globals.css`.  
   - Use Tailwind and existing CSS variables (`--primary`, `--accent`, `--muted`, etc.); keep a professional legal look.

---

## Rules

- Do not overwrite working components unnecessarily; extend or refactor when needed.
- Prefer reusable components (header, footer, cards, forms) over duplicated layout.
- Keep parity with the live site structure and routes; use `docs/crawl-map.json` and `docs/route-comparison.md` to check coverage.
- After changes, run `npm run build` and update `docs/build-status.md` if routes or features change.
- **Route parity:** Achieved (358 URLs from crawl map served by this project). Maintain parity when adding or changing routes.

---

## Commands

```bash
npm run dev      # Dev server (often http://localhost:3000 or next free port)
npm run build    # Production build
npm run start    # Run production server
npm run crawl:ts # Crawl live site (requires Playwright)
```
