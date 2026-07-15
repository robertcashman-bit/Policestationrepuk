#!/usr/bin/env bash
# ESLint autofix, then run full local CI mirror. Repeats up to --retry N times.
#
# Local:  npm run ci:fix
#         npm run ci:fix -- --retry 3
#         npm run ci:fix -- --lint-only   # eslint --fix + tsc + lint (matches GH quick verify)
#
# GitHub: .github/workflows/ci-autofix.yml runs the same eslint --fix on master
# CI failure and pushes a [ci-autofix] commit when tsc+lint pass afterwards.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

RETRIES=1
LINT_ONLY=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --retry)
      RETRIES="${2:-1}"
      if ! [[ "$RETRIES" =~ ^[1-9][0-9]*$ ]]; then
        echo "ci-autofix: --retry requires a positive integer" >&2
        exit 2
      fi
      shift 2
      ;;
    --lint-only)
      LINT_ONLY=1
      shift
      ;;
    -h|--help)
      echo "Usage: $0 [--retry N] [--lint-only]"
      echo "  1) npm run lint -- --fix"
      echo "  2) npm run test:ci (full CI mirror), or tsc+lint when --lint-only"
      echo "  Repeat up to N times (default 1) when lint autofix may unblock later steps."
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      echo "Usage: $0 [--retry N] [--lint-only]" >&2
      exit 2
      ;;
  esac
done

attempt=1
while [[ "$attempt" -le "$RETRIES" ]]; do
  echo ""
  echo "=== ci-autofix attempt $attempt / $RETRIES ==="

  echo "==> eslint --fix"
  # Lint may still exit non-zero for non-fixable errors; continue to surface them via verify.
  npm run lint -- --fix || true

  if [[ "$LINT_ONLY" -eq 1 ]]; then
    echo "==> typecheck + lint (lint-only gate)"
    if npx tsc --noEmit && npm run lint; then
      echo ""
      echo "ci-autofix: lint-only gate passed on attempt $attempt"
      exit 0
    fi
  elif bash scripts/ci-local.sh; then
    echo ""
    echo "ci-autofix: passed on attempt $attempt"
    exit 0
  fi

  echo "" >&2
  echo "ci-autofix: attempt $attempt failed (see 'FAILED at step' above)." >&2
  echo "Autofix cannot repair TypeScript, Vitest mismatches, or audit/content failures — edit code/tests then re-run." >&2
  attempt=$((attempt + 1))
done

echo "ci-autofix: failed after $RETRIES attempt(s)" >&2
exit 1
