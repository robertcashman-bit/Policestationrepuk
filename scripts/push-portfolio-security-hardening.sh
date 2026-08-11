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

# Per-invocation auth only - never embed the PAT in remote URLs / .git/config.
BASIC_AUTH="$(printf 'x-access-token:%s' "${GH_TOKEN}" | base64 | tr -d '\n')"
git_auth() {
  git -c "http.extraHeader=Authorization: Basic ${BASIC_AUTH}" "$@"
}

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

cleanup_remotes() {
  local d name guess
  for d in "${WORKDIR}"/*/; do
    [[ -d "${d}/.git" ]] || continue
    name="$(basename "$d")"
    guess=""
    case "$name" in
      policestationagent) guess="https://github.com/robertcashman-bit/policestationagent.git" ;;
      custody-note-app) guess="https://github.com/robertcashman-bit/custody-note-app.git" ;;
      psrtrain) guess="https://github.com/robertdavidcashman-droid/psrtrain.git" ;;
      custody-note-website) guess="https://github.com/robertdavidcashman-droid/custody-note-website.git" ;;
    esac
    if [[ -n "$guess" ]]; then
      git -C "$d" remote set-url origin "$guess" >/dev/null 2>&1 || true
    fi
  done
}
trap cleanup_remotes EXIT

push_target() {
  local dest="$1" patch_name="$2" title="$3"
  local name="${dest##*/}"
  local dir="${WORKDIR}/${name}"
  local patch="${PATCH_DIR}/${patch_name}"
  local public_url="https://github.com/${dest}.git"
  local subject=""

  echo "======== ${dest} ========"
  if [[ ! -f "$patch" ]]; then
    echo "MISSING patch: $patch"
    status_lines+=("| \`${dest}\` | FAIL | missing patch |")
    return 1
  fi

  if [[ -d "${dir}/.git" ]]; then
    git -C "$dir" remote set-url origin "$public_url"
    if ! git_auth -C "$dir" fetch origin --prune; then
      echo "FETCH_FAIL ${dest}"
      status_lines+=("| \`${dest}\` | FAIL | fetch denied - check PAT scopes/account access |")
      return 1
    fi
  else
    rm -rf "$dir"
    if ! git_auth clone --depth 50 "$public_url" "$dir"; then
      echo "CLONE_FAIL ${dest}"
      status_lines+=("| \`${dest}\` | FAIL | clone denied - check PAT scopes/account access |")
      return 1
    fi
    git -C "$dir" remote set-url origin "$public_url"
  fi

  local default_branch
  default_branch="$(gh api "repos/${dest}" --jq .default_branch 2>/dev/null || echo master)"

  if ! git -C "$dir" checkout "$default_branch"; then
    if ! git_auth -C "$dir" checkout -B "$default_branch" "origin/${default_branch}"; then
      echo "CHECKOUT_FAIL ${dest} (${default_branch})"
      status_lines+=("| \`${dest}\` | FAIL | checkout ${default_branch} failed |")
      return 1
    fi
  fi

  if ! git_auth -C "$dir" pull --ff-only origin "$default_branch"; then
    echo "PULL_FAIL ${dest}"
    status_lines+=("| \`${dest}\` | FAIL | pull ${default_branch} failed |")
    return 1
  fi

  if ! git -C "$dir" checkout -B "$BRANCH"; then
    echo "BRANCH_FAIL ${dest}"
    status_lines+=("| \`${dest}\` | FAIL | could not create branch ${BRANCH} |")
    return 1
  fi

  if git -C "$dir" am --3way "$patch"; then
    echo "Applied $patch_name"
  else
    echo "git am failed - aborting and checking for exact patch subject"
    git -C "$dir" am --abort 2>/dev/null || true
    subject="$(sed -n 's/^Subject: \(\[PATCH\] \)*//p' "$patch" | head -n1 | sed 's/[[:space:]]*$//')"
    if [[ -n "$subject" ]] && git -C "$dir" log --format=%s -20 | grep -Fxq "$subject"; then
      echo "Patch subject already present on tip history; continuing"
    else
      status_lines+=("| \`${dest}\` | FAIL | patch apply failed |")
      return 1
    fi
  fi

  if git_auth -C "$dir" push -u origin "$BRANCH"; then
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
      if [[ "$pr_url" != http* ]]; then
        pr_url="$(gh pr view "$BRANCH" --repo "$dest" --json url -q .url 2>/dev/null || echo 'PR create skipped/exists')"
      fi
    fi
    status_lines+=("| \`${dest}\` | OK | ${pr_url} |")
  else
    echo "PUSH_FAIL ${dest}"
    status_lines+=("| \`${dest}\` | FAIL | push denied - check PAT scopes/account access |")
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
