# Multi-repo security hardening push status

**Last agent retry:** 2026-08-07 (this Cloud Agent environment)

## Constraint

Cloud Agent installation token can write only:

- `robertcashman-bit/Policestationrepuk` (PR [#2](https://github.com/robertcashman-bit/Policestationrepuk/pull/2) on `cursor/security-hardening-uplift-34ef`)

Sibling targets remain **403 for `cursor[bot]`**. Patches **apply cleanly** locally; only remote push is blocked.

## Latest retry results

| Canonical target | Patch apply | Agent push | Detail |
|------------------|-------------|------------|--------|
| `robertcashman-bit/Policestationrepuk` | n/a (native branch) | **OK** | Already on origin |
| `robertcashman-bit/policestationagent` | OK | **FAIL 403** | Needs operator PAT / App install |
| `robertcashman-bit/custody-note-app` | OK | **FAIL 403** | Needs operator PAT / App install |
| `robertdavidcashman-droid/psrtrain` | OK | **FAIL 403** | Needs operator PAT / App install |
| `robertdavidcashman-droid/custody-note-website` | OK | **FAIL 403** | Needs operator PAT / App install |

Do **not** push Policestationrepuk hardening to the `robertdavidcashman-droid` mirror for production (see `docs/deploy.md`).

## Immediate fix (operator)

### Windows (recommended one-shot)

In PowerShell:

```powershell
cd $HOME\Documents
git clone https://github.com/robertcashman-bit/Policestationrepuk.git
cd Policestationrepuk
git fetch origin cursor/security-hardening-uplift-34ef
git checkout cursor/security-hardening-uplift-34ef

# Opens token page + prompts for PAT, then pushes all siblings:
.\scripts\windows-push-hardening.ps1
```

Or with a token already set:

```powershell
$env:GH_TOKEN = "ghp_..."
.\scripts\push-portfolio-security-hardening.ps1
```

### macOS / Linux / Git Bash

```bash
export GH_TOKEN=ghp_...   # repo scope on robertcashman-bit + robertdavidcashman-droid
./scripts/push-portfolio-security-hardening.sh
```

Scripts:
- [`scripts/windows-push-hardening.ps1`](../scripts/windows-push-hardening.ps1)
- [`scripts/push-portfolio-security-hardening.ps1`](../scripts/push-portfolio-security-hardening.ps1)
- [`scripts/push-portfolio-security-hardening.sh`](../scripts/push-portfolio-security-hardening.sh)

Patches: [`docs/sibling-hardening-patches/`](sibling-hardening-patches/)

## Durable fix (future Cloud Agents)

1. Install [Cursor GitHub App](https://github.com/apps/cursor) on **both** accounts with write access to all portfolio repos above.
2. Add those repos to the Cloud Agent environment `repos` list (today: Policestationrepuk only).
3. New agents can then push sibling branches without the operator script.
