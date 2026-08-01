#!/usr/bin/env bash
# Sync robertcashman-bit/Policestationrepuk master to droid master (Lead engine #88).
# Requires push access to robertcashman-bit (this agent does not have it).
set -euo pipefail

DROID_REMOTE="${DROID_REMOTE:-https://github.com/robertdavidcashman-droid/Policestationrepuk.git}"
BIT_REMOTE="${BIT_REMOTE:-https://github.com/robertcashman-bit/Policestationrepuk.git}"
WORKDIR="${WORKDIR:-/tmp/psr-bit-sync-$$}"

cleanup() { rm -rf "$WORKDIR"; }
trap cleanup EXIT

git clone --depth 1 "$BIT_REMOTE" "$WORKDIR"
cd "$WORKDIR"
git fetch --depth 1 "$DROID_REMOTE" master:droid-master
git checkout -B master droid-master
echo "Pushing droid master → bit master (Lead engine WRONGTYPE fix)..."
git push --force-with-lease origin master
echo "Done. Dispatch Lead engine on bit:"
echo "  gh workflow run 'Lead engine automation' --repo robertcashman-bit/Policestationrepuk --ref master"
