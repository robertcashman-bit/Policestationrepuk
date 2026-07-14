#!/usr/bin/env bash
# Mirror .github/workflows/ci.yml locally (fail-fast).
# Usage: npm run test:ci
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=8192}"
export LEGACY_REPS_PUBLIC="${LEGACY_REPS_PUBLIC:-1}"
export CRON_SECRET="${CRON_SECRET:-ci-smoke-placeholder-not-for-production}"

CURRENT_STEP="(starting)"

on_err() {
  echo "" >&2
  echo "ci-local: FAILED at step: ${CURRENT_STEP}" >&2
  echo "Re-run that step alone, fix, then: npm run ci:fix" >&2
}
trap on_err ERR

run_step() {
  CURRENT_STEP="$1"
  echo ""
  echo "==> $1"
  shift
  "$@"
}

# Order matches .github/workflows/ci.yml (after install).
run_step "npx tsc --noEmit" npx tsc --noEmit
run_step "npm run lint" npm run lint
run_step "npm run build" npm run build
run_step "Vitest unit tests (npm test)" npm test
run_step "Reliability gate tests" npm run test:reliability:ci
run_step "Repeat critical automation (20x)" npm run test:automation:repeat
run_step "Firm outreach approval + send tests" npm run test:firm-outreach:ci
run_step "Buffer scheduler unit tests and GBP image probe" npm run test:buffer:ci
run_step "Custody discovery tests" npm run test:custody-discovery:ci
run_step "Directory search engine self-test" npm run test:directory-search
run_step "Lighthouse CI (tier-1 URLs)" npx lhci autorun
run_step "Blog SEO content rules" npm run audit:blog-seo
run_step "Blog orphan link check" npm run audit:blog-orphans
run_step "Cross-domain partner link check" npm run audit:cross-domain-links
run_step "Partner UTM guard" node scripts/audit/partner-utm-guard.mjs
run_step "Blog partner UTM guard" node scripts/audit/blog-partner-utm.mjs
run_step "Blog JSON-LD shape check" npm run validate:schema
run_step "Playwright smoke (local prod build)" npm run test:ci:smoke

export CRAWL_MAX_URLS="${CRAWL_MAX_URLS:-800}"
export CRAWL_CONCURRENCY="${CRAWL_CONCURRENCY:-10}"
export CRAWL_FAIL_THRESHOLD="${CRAWL_FAIL_THRESHOLD:-25}"
run_step "Live sitemap crawl (sample)" node scripts/audit/sitemap-crawl.mjs

trap - ERR
echo ""
echo "ci-local: all steps passed"
