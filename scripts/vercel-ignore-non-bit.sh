#!/usr/bin/env bash
# Vercel Ignored Build Step for policestationrepuk-new.
#
# Exit 0 → skip build. Exit 1 → continue build.
#
# Production must only build from robertcashman-bit/Policestationrepuk.
# Droid-mirror (or any other Git link) production deploys are ignored so they
# cannot overwrite bit master on the production alias.
set -euo pipefail

OWNER="${VERCEL_GIT_REPO_OWNER:-}"
SLUG="${VERCEL_GIT_REPO_SLUG:-}"
REPO="${VERCEL_GIT_REPO_SLUG:-${VERCEL_GIT_REPO_OWNER:-}/${VERCEL_GIT_REPO_NAME:-}}"
ENV="${VERCEL_ENV:-}"

BIT_OWNER="robertcashman-bit"
BIT_REPO="Policestationrepuk"
BIT_SLUG="${BIT_OWNER}/${BIT_REPO}"

echo "[ignore-non-bit] env=${ENV} owner=${OWNER} slug=${SLUG} repo=${REPO}"

# Preview / development: skip (bit production is promoted via CI deploy hook).
if [ "$ENV" != "production" ]; then
  echo "[ignore-non-bit] skip non-production"
  exit 0
fi

# CLI / API deploys without git metadata: allow (ops promote path).
if [ -z "$OWNER" ] && [ -z "$SLUG" ] && [ -z "${VERCEL_GIT_COMMIT_SHA:-}" ]; then
  echo "[ignore-non-bit] allow production deploy without git metadata"
  exit 1
fi

if [ "$OWNER" = "$BIT_OWNER" ] || [ "$SLUG" = "$BIT_SLUG" ] || [ "$REPO" = "$BIT_SLUG" ]; then
  echo "[ignore-non-bit] allow bit production build"
  exit 1
fi

echo "[ignore-non-bit] IGNORE production build from non-bit git source (owner=${OWNER} slug=${SLUG})"
exit 0
