# Local CI verification

Reproduce GitHub Actions **CI — Next.js build** before pushing to `master`.

## Quick check (day-to-day)

```bash
npm run build && npm test
```

## Full CI mirror

Same ordered steps as [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) (after install):

```bash
npm run test:ci
```

Runs typecheck, lint, build, full vitest, reliability/automation/firm-outreach/buffer/custody gates, directory search self-test, Lighthouse, blog SEO/orphan/cross-domain/UTM/schema checks, Playwright smoke, and the live sitemap crawl sample (`CRAWL_MAX_URLS=800`).

## Autofix + verify

Runs `eslint --fix`, then the full CI mirror:

```bash
npm run ci:fix
npm run ci:fix -- --retry 3
```

Use the full gate before merging outreach or CI-touching changes.

**What autofix can do:** ESLint auto-fixable style issues.

**What still needs a code/test edit:** TypeScript errors, Vitest assertion mismatches when defaults change (e.g. `dailySendCap` / `cronEnrichBatchSize` / `paidDailyCap` in `__tests__/firm-outreach-duplicate.test.ts`), and audit/content failures (blog SEO, sitemap, Lighthouse).

## Site audit (separate workflow)

Playwright site audit (~25 min) is not included in `test:ci`:

```bash
npm run test:ci:audit
# or: npm run audit:site
```

## Environment

Scripts set:

- `LEGACY_REPS_PUBLIC=1`
- `NODE_OPTIONS=--max-old-space-size=8192`
- `CRON_SECRET=ci-smoke-placeholder-not-for-production` (satisfies production `validateEnv` during smoke/`next start`)

to match CI.
