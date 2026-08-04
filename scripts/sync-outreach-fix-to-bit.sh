#!/usr/bin/env bash
# Push the current outreach fix branch tip onto robertcashman-bit/Policestationrepuk.
# Requires write access to bit (this cloud agent normally does not have it).
#
# Usage:
#   ./scripts/sync-outreach-fix-to-bit.sh              # push current HEAD → bit master
#   ./scripts/sync-outreach-fix-to-bit.sh --dry-run    # show plan only
#   ./scripts/sync-outreach-fix-to-bit.sh <branch>
set -euo pipefail

BIT_REMOTE="${BIT_REMOTE:-https://github.com/robertcashman-bit/Policestationrepuk.git}"
DRY_RUN=0
BRANCH="$(git rev-parse --abbrev-ref HEAD)"

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    *) BRANCH="$arg" ;;
  esac
done

SHA="$(git rev-parse HEAD)"
SHORT="${SHA:0:7}"

echo "Plan: sync ${BRANCH} (${SHORT}) → bit master"
echo "  remote: ${BIT_REMOTE}"

git fetch "$BIT_REMOTE" master:refs/remotes/bit/master 2>/dev/null || {
  echo "WARN: could not fetch bit master (auth/network). Continuing with push attempt."
}

if git rev-parse --verify refs/remotes/bit/master >/dev/null 2>&1; then
  BIT_SHA="$(git rev-parse refs/remotes/bit/master)"
  echo "  bit master tip: ${BIT_SHA:0:7}"
  if [ "$BIT_SHA" = "$SHA" ]; then
    echo "Already in sync — nothing to push."
    exit 0
  fi
  echo "  commits ahead of bit (sample):"
  git log --oneline "${BIT_SHA}..${SHA}" | head -20 || true
fi

if [ "$DRY_RUN" = "1" ]; then
  echo "Dry run — not pushing. Re-run without --dry-run when bit credentials are available."
  exit 0
fi

echo "Pushing HEAD → bit master…"
if ! git push "$BIT_REMOTE" "HEAD:refs/heads/master"; then
  echo "ERROR: push to bit failed (need write access to robertcashman-bit/Policestationrepuk)."
  exit 1
fi

echo "Dispatch bit production deploy + kick (manual confirm still required on some workflows):"
echo "  gh workflow run 'Deploy to Vercel (production)' --repo robertcashman-bit/Policestationrepuk -f sha=${SHA} -f confirm_production=PRODUCTION"
echo "  gh workflow run 'Ops — firm outreach send now' --repo robertcashman-bit/Policestationrepuk -f confirm=SEND -f limit=8"
echo ""
echo "After bit has the tip, disable or delete bit's 'Ops — production source guard' to end the promote war."
