#!/usr/bin/env bash
# Install repo git hooks into .git/hooks (idempotent).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOOK_SRC="$ROOT/scripts/git-hooks/pre-push"
HOOK_DST="$ROOT/.git/hooks/pre-push"

if [ ! -d "$ROOT/.git" ]; then
  echo "install-git-hooks: not a git checkout — skip"
  exit 0
fi

if [ ! -f "$HOOK_SRC" ]; then
  echo "install-git-hooks: missing $HOOK_SRC" >&2
  exit 1
fi

mkdir -p "$ROOT/.git/hooks"
cp "$HOOK_SRC" "$HOOK_DST"
chmod +x "$HOOK_DST"
echo "install-git-hooks: installed pre-push → .git/hooks/pre-push"
