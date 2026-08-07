#!/usr/bin/env bash
# Push portfolio security-hardening branches across both GitHub accounts.
#
# Why this exists:
#   Cursor Cloud Agents are often installed on only one repo
#   (robertcashman-bit/Policestationrepuk). Sibling products on
#   robertcashman-bit and robertdavidcashman-droid then return 403 for
#   cursor[bot]. Run THIS script with YOUR credentials to finish the job.
#
# Usage:
#   export GH_TOKEN=ghp_...   # PAT with repo write on BOTH accounts
#   ./scripts/push-portfolio-security-hardening.sh
#
# Optional:
#   WORKDIR=/tmp/psr-hardening-push ./scripts/push-portfolio-security-hardening.sh
#   SKIP_PR=1 ./scripts/push-portfolio-security-hardening.sh
#
# Does NOT push Policestationrepuk to the droid mirror (production deploy rule).

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PATCH_DIR="${ROOT}/docs/sibling-hardening-patches"
WORKDIR="${WORKDIR:-/tmp/psr-portfolio-security-push}"
BRANCH="cursor/security-hardening-uplift-34ef"
SKIP_PR="${SKIP_PR:-0}"

if [[ -z "${GH_TOKEN:-${GITHUB_TOKEN:-}}" ]]; then
  if gh auth token >/dev/null 2>&1; then
    export GH_TOKEN
    GH_TOKEN="$(gh auth token)"
  else
    echo "ERROR: set GH_TOKEN (or GITHUB_TOKEN) to a PAT with write access to both accounts." >&2
    exit 1
  fi
else
  export GH_TOKEN="${GH_TOKEN:-$GITHUB_TOKEN}"
fi

AUTH="x-access-token:${GH_TOKEN}"

# Warn early when the token is the Cloud Agent installation (cursor[bot]),
# which can only push Policestationrepuk in this environment.
TOKEN_LOGIN="$(curl -sS -H "Authorization: token ${GH_TOKEN}" -H "Accept: application/vnd.github+json" \
  https://api.github.com/user 2>/dev/null | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d.get("login") or d.get("message") or "")' 2>/dev/null || true)"
if [[ "${TOKEN_LOGIN}" == *"cursor"* ]] || [[ "${TOKEN_LOGIN}" == *"Resource not accessible"* ]]; then
  echo "NOTE: Active token looks like a Cursor Cloud Agent / installation token (${TOKEN_LOGIN})." >&2
  echo "      Sibling pushes will 403 unless you export GH_TOKEN to a personal PAT with write on" >&2
  echo "      robertcashman-bit AND robertdavidcashman-droid. See docs/MULTI_REPO_PUSH_STATUS.md" >&2
  echo >&2
fi

# Canonical remotes (bit for PSA + custody-note-app; droid for train + website)
declare -a TARGETS=(
  "robertcashman-bit/policestationagent|policestationagent-security-hardening.patch|Security hardening uplift (Police Station Agent)"
  "robertcashman-bit/custody-note-app|custody-note-app-security-hardening.patch|Security hardening uplift (Custody Note app)"
  "robertdavidcashman-droid/psrtrain|psrtrain-security-hardening.patch|Security hardening uplift (PSR Train)"
  "robertdavidcashman-droid/custody-note-website|custody-note-website-security-hardening.patch|Security hardening uplift (Custody Note website)"
)

mkdir -p "$WORKDIR"
echo "Workdir: $WORKDIR"
echo "Branch:  $BRANCH"
echo

status_lines=()

push_target() {
  local dest="$1" patch_name="$2" title="$3"
  local name="${dest##*/}"
  local dir="${WORKDIR}/${name}"
  local patch="${PATCH_DIR}/${patch_name}"
  local url="https://${AUTH}@github.com/${dest}.git"

  echo "======== ${dest} ========"
  if [[ ! -f "$patch" ]]; then
    echo "MISSING patch: $patch"
    status_lines+=("| \`${dest}\` | FAIL | missing patch |")
    return 1
  fi

  if [[ -d "${dir}/.git" ]]; then
    git -C "$dir" remote set-url origin "$url"
    git -C "$dir" fetch origin --prune
  else
    rm -rf "$dir"
    git clone --depth 50 "$url" "$dir"
  fi

  local default_branch
  default_branch="$(gh api "repos/${dest}" --jq .default_branch 2>/dev/null || echo master)"

  git -C "$dir" checkout "$default_branch"
  git -C "$dir" pull --ff-only origin "$default_branch" || true

  # Recreate branch from default, then apply patch (idempotent-ish)
  git -C "$dir" branch -D "$BRANCH" 2>/dev/null || true
  git -C "$dir" checkout -b "$BRANCH"

  if git -C "$dir" am --3way "$patch"; then
    echo "Applied $patch_name"
  else
    echo "git am failed — trying abort and check if commit already present"
    git -C "$dir" am --abort 2>/dev/null || true
    # If patch subject already on branch tip from a previous run, continue
    if git -C "$dir" log --oneline -20 | grep -qi 'security hardening'; then
      echo "Existing security hardening commit detected; continuing"
    else
      status_lines+=("| \`${dest}\` | FAIL | patch apply failed |")
      return 1
    fi
  fi

  if git -C "$dir" push -u origin "$BRANCH"; then
    echo "PUSH_OK ${dest}"
    local pr_url="(skipped)"
    if [[ "$SKIP_PR" != "1" ]]; then
      pr_url="$(
        gh pr create --repo "$dest" \
          --base "$default_branch" \
          --head "$BRANCH" \
          --title "$title" \
          --body "$(cat <<EOF
## Summary

Defensive security hardening uplift for this product.

See \`docs/security-hardening-report.md\` on this branch for findings, fixes, tests, and manual follow-ups.

This PR was opened by \`scripts/push-portfolio-security-hardening.sh\` from the PoliceStationRepUK portfolio hardening effort.
EOF
)" \
          --draft 2>&1 || true
      )"
      # If PR already exists, print its URL
      if [[ "$pr_url" != http* ]]; then
        pr_url="$(gh pr view "$BRANCH" --repo "$dest" --json url -q .url 2>/dev/null || echo 'PR create skipped/exists')"
      fi
    fi
    status_lines+=("| \`${dest}\` | OK | ${pr_url} |")
  else
    echo "PUSH_FAIL ${dest}"
    status_lines+=("| \`${dest}\` | FAIL | push denied — check PAT scopes/account access |")
    return 1
  fi
}

fail=0
for entry in "${TARGETS[@]}"; do
  IFS='|' read -r dest patch title <<<"$entry"
  if ! push_target "$dest" "$patch" "$title"; then
    fail=1
  fi
  echo
done

echo "## Results"
echo
echo "| Repo | Status | Detail |"
echo "|------|--------|--------|"
for line in "${status_lines[@]}"; do
  echo "$line"
done
echo
echo "PoliceStationRepUK is already handled via the Cloud Agent PR on robertcashman-bit (do not push that hardening to the droid mirror for production)."

exit "$fail"
