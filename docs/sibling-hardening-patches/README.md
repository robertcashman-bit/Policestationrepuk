# Sibling portfolio security hardening

This folder contains security-hardening patches and reports for sibling products.
The Cursor bot could **not push** to those repositories (GitHub 403).

## Apply patches manually

### Police Station Agent

```bash
git clone https://github.com/robertcashman-bit/policestationagent.git
cd policestationagent
git checkout -b cursor/security-hardening-uplift-34ef
git am /path/to/docs/sibling-hardening-patches/policestationagent-security-hardening.patch
git push -u origin cursor/security-hardening-uplift-34ef
```

Local commit already prepared at SHA `69d5d283` on that branch in the agent workspace.

### Custody Note (Electron)

```bash
git clone https://github.com/robertcashman-bit/custody-note-app.git
cd custody-note-app
git checkout -b cursor/security-hardening-uplift-34ef
git am /path/to/custody-note-app-security-hardening.patch
git push -u origin cursor/security-hardening-uplift-34ef
```

Local commit SHA `afdba2a0`.

## Not found

- `custodynote.com` website repo (`custody-note-website`) — not under `robertcashman-bit`
- `psrtrain.com` — no separate GitHub repository in this account

See also the per-product reports in this folder.
