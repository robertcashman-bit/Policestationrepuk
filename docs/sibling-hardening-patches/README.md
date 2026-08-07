# Sibling portfolio security hardening

Patches + reports for every portfolio product outside the primary
`robertcashman-bit/Policestationrepuk` Cloud Agent install.

Live push status after the latest agent retry: see
[`docs/MULTI_REPO_PUSH_STATUS.md`](../MULTI_REPO_PUSH_STATUS.md).

## One-command fix (recommended)

From this repo, with a GitHub PAT that can write to **both** accounts
(`robertcashman-bit` and `robertdavidcashman-droid`):

```bash
export GH_TOKEN=ghp_your_pat_with_repo_scope_on_both_accounts
chmod +x scripts/push-portfolio-security-hardening.sh
./scripts/push-portfolio-security-hardening.sh
```

That script will, for each sibling product:

1. Clone / update the canonical repo
2. Create branch `cursor/security-hardening-uplift-34ef`
3. Apply the matching patch from this folder
4. Push the branch
5. Open a draft PR

Skip PR creation with `SKIP_PR=1`.

### Canonical remotes used by the script

| Product | Push target |
|---------|-------------|
| Police Station Agent | `robertcashman-bit/policestationagent` |
| Custody Note (Electron) | `robertcashman-bit/custody-note-app` |
| PSR Train | `robertdavidcashman-droid/psrtrain` |
| Custody Note website | `robertdavidcashman-droid/custody-note-website` |

PoliceStationRepUK production stays on **`robertcashman-bit` only**.  
Do **not** push that hardening to the `robertdavidcashman-droid` mirror for production deploys.

## Cloud Agent push status (this environment)

| Account | Repo | Local SHA | Agent push |
|---------|------|-----------|------------|
| `robertcashman-bit` | `Policestationrepuk` | on remote PR | **OK** |
| `robertcashman-bit` | `policestationagent` | `69d5d28` | **403** |
| `robertcashman-bit` | `custody-note-app` | `afdba2a` | **403** |
| `robertdavidcashman-droid` | `psrtrain` | `739c9ed` | **403** |
| `robertdavidcashman-droid` | `custody-note-website` | `bd28774` | **403** |

This Cloud Agent token is scoped to Policestationrepuk only.

## Durable fix for future Cloud Agents

1. Install the **Cursor GitHub App** on **both** GitHub accounts.
2. Grant it write access to every portfolio repo listed above.
3. Add those repos to the Cloud Agent **environment** `repos` list (today it only lists Policestationrepuk).
4. New agents can then push sibling branches without this script.

## Patches in this folder

- `policestationagent-security-hardening.patch` + `policestationagent-report.md`
- `custody-note-app-security-hardening.patch` + `custody-note-app-report.md`
- `psrtrain-security-hardening.patch` + `psrtrain-report.md`
- `custody-note-website-security-hardening.patch` + `custody-note-website-report.md`
