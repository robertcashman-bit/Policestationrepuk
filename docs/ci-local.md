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

**What autofix can do:** ESLint auto-fixable style issues (e.g. `prefer-const`).

**What still needs a code/test edit:** TypeScript errors, Vitest assertion mismatches when defaults change (e.g. `dailySendCap` / `cronEnrichBatchSize` / `paidDailyCap` in `__tests__/firm-outreach-duplicate.test.ts`), and audit/content failures (blog SEO, sitemap, Lighthouse).

## GitHub autofix (master)

Workflow [`.github/workflows/ci-autofix.yml`](../.github/workflows/ci-autofix.yml) runs when **CI — Next.js build** fails on a `push` to `master`/`main`:

1. Checks out the failed SHA
2. Skips if the commit already contains `[ci-autofix]` (loop guard)
3. Runs `npm run lint -- --fix`
4. If files changed and `tsc` + `lint` pass → commits and **pushes to master** with `[ci-autofix]` in the message
5. If nothing is auto-fixable → step summary + optional Resend email (`RESEND_API_KEY` + `OWNER_EMAIL` / `CI_AUTOFIX_NOTIFY_EMAIL` secrets)

The follow-up push re-triggers full CI (and Vercel deploy on green). Autofix does **not** invent TypeScript or test changes.

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
