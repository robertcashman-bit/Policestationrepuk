# Sibling portfolio security hardening

This folder contains security-hardening patches and reports for every sibling product.

## Push status (this agent)

| Account | Repo | Local SHA | Push |
|---------|------|-----------|------|
| `robertcashman-bit` | `Policestationrepuk` | `d970f0a` | **OK** (PR open) |
| `robertcashman-bit` | `policestationagent` | `69d5d28` | **403** — Cursor GitHub App not installed / no write |
| `robertcashman-bit` | `custody-note-app` | `afdba2a` | **403** |
| `robertdavidcashman-droid` | `psrtrain` | `739c9ed` | **403** |
| `robertdavidcashman-droid` | `custody-note-website` | `bd28774` | **403** |
| `robertdavidcashman-droid` | `custody-note-app` | `afdba2a` | **403** |

This Cloud Agent token is scoped to the **single** installed repo (`Policestationrepuk` on `robertcashman-bit`).  
It cannot push to your second account or other repos until you grant access.

## How to unlock pushes on both GitHub accounts

### Option A — Install Cursor GitHub App (recommended)

1. Open [Cursor Dashboard → Integrations / GitHub](https://cursor.com/dashboard) (or GitHub → Settings → Applications → Cursor).
2. On account **`robertcashman-bit`**, grant the Cursor app access to:
   - `policestationagent`
   - `custody-note-app`
3. Switch to / sign in as **`robertdavidcashman-droid`** and grant access to:
   - `psrtrain`
   - `custody-note-website`
   - `custody-note-app` (mirror)
4. Reply here with “access granted” — I will push all branches and open PRs.

### Option B — Apply patches yourself

```bash
# Police Station Agent (bit)
git clone https://github.com/robertcashman-bit/policestationagent.git
cd policestationagent && git checkout -b cursor/security-hardening-uplift-34ef
git am /path/to/policestationagent-security-hardening.patch
git push -u origin cursor/security-hardening-uplift-34ef

# Custody Note Electron (bit or droid)
git clone https://github.com/robertcashman-bit/custody-note-app.git
cd custody-note-app && git checkout -b cursor/security-hardening-uplift-34ef
git am /path/to/custody-note-app-security-hardening.patch
git push -u origin cursor/security-hardening-uplift-34ef

# PSR Train (droid)
git clone https://github.com/robertdavidcashman-droid/psrtrain.git
cd psrtrain && git checkout -b cursor/security-hardening-uplift-34ef
git am /path/to/psrtrain-security-hardening.patch
git push -u origin cursor/security-hardening-uplift-34ef

# Custody Note website (droid)
git clone https://github.com/robertdavidcashman-droid/custody-note-website.git
cd custody-note-website && git checkout -b cursor/security-hardening-uplift-34ef
git am /path/to/custody-note-website-security-hardening.patch
git push -u origin cursor/security-hardening-uplift-34ef
```

## Patches in this folder

- `policestationagent-security-hardening.patch` + `policestationagent-report.md`
- `custody-note-app-security-hardening.patch` + `custody-note-app-report.md`
- `psrtrain-security-hardening.patch` + `psrtrain-report.md`
- `custody-note-website-security-hardening.patch` + `custody-note-website-report.md`
