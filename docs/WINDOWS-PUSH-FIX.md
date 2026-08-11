# Windows PowerShell push - common errors

## What caused the recent errors

1. `Unexpected token '}'` - Unicode em-dash (`—`) in the script. Fixed (ASCII-only).
2. `ERROR: From https://github.com/...` - `$ErrorActionPreference = Stop` made PowerShell
   treat normal `git fetch` stderr as a fatal error. Fixed (`Continue` + safe git wrapper).

## Copy-paste this whole block into PowerShell

```powershell
Set-ExecutionPolicy -Scope Process Bypass -Force

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  winget install --id Git.Git -e --accept-package-agreements --accept-source-agreements
  $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
}

cd $env:USERPROFILE\Documents
if (-not (Test-Path .\Policestationrepuk\.git)) {
  git clone https://github.com/robertcashman-bit/Policestationrepuk.git
}
cd .\Policestationrepuk
git fetch origin cursor/windows-push-hardening-fix-34ef
git checkout cursor/windows-push-hardening-fix-34ef
git pull --ff-only origin cursor/windows-push-hardening-fix-34ef

# Create token in browser (repo scope), then paste when asked:
# https://github.com/settings/tokens/new?scopes=repo&description=portfolio-security-push
.\scripts\windows-push-hardening.ps1
```

## Common errors

| Error | Fix |
|-------|-----|
| `Unexpected token '}'` | Old script with Unicode dashes - pull the fix branch above |
| `running scripts is disabled` / `ExecutionPolicy` | `Set-ExecutionPolicy -Scope Process Bypass -Force` |
| `git is not recognized` | `winget install --id Git.Git -e` then reopen PowerShell |
| `windows-push-hardening.ps1` not found | Checkout `cursor/windows-push-hardening-fix-34ef` first |
| `Token looks invalid` | Use a classic PAT starting `ghp_` with **repo** scope |
| `Permission denied` / `403` on push | Token must write **both** GitHub accounts (bit + droid) |
| `gh is not recognized` | Optional; script sets `SKIP_PR=1` automatically |

## Manual fallback

```powershell
cd $env:USERPROFILE\Documents\Policestationrepuk
git checkout cursor/windows-push-hardening-fix-34ef
$env:GH_TOKEN = "ghp_YOUR_TOKEN_HERE"
$env:SKIP_PR = "1"
.\scripts\push-portfolio-security-hardening.ps1
```
