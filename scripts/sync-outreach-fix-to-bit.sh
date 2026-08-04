#!/usr/bin/env bash
# Push the current outreach fix branch tip onto robertcashman-bit/Policestationrepuk.
# Requires write access to bit (this cloud agent normally does not have it).
set -euo pipefail

BIT_REMOTE="${BIT_REMOTE:-https://github.com/robertcashman-bit/Policestationrepuk.git}"
BRANCH="${1:-$(git rev-parse --abbrev-ref HEAD)}"
SHA="$(git rev-parse HEAD)"

echo "Syncing ${BRANCH} (${SHA:0:7}) → bit master"
git fetch "$BIT_REMOTE" master:refs/remotes/bit/master
git push "$BIT_REMOTE" "HEAD:refs/heads/master"

echo "Dispatch bit production deploy + kick (manual confirm still required on some workflows):"
echo "  gh workflow run 'Deploy to Vercel (production)' --repo robertcashman-bit/Policestationrepuk -f sha=${SHA} -f confirm_production=PRODUCTION"
echo "  gh workflow run 'Ops — firm outreach send now' --repo robertcashman-bit/Policestationrepuk -f confirm=SEND -f limit=8"
