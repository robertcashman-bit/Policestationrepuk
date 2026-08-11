# One-shot Windows helper: clone/update PSRUK branch, prompt for PAT, push all siblings.
# Run in PowerShell (right-click → Run with PowerShell, or paste into PowerShell).

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=== Portfolio security hardening push (Windows) ===" -ForegroundColor Cyan
Write-Host "This will push hardened branches to:"
Write-Host "  - robertcashman-bit/policestationagent"
Write-Host "  - robertcashman-bit/custody-note-app"
Write-Host "  - robertdavidcashman-droid/psrtrain"
Write-Host "  - robertdavidcashman-droid/custody-note-website"
Write-Host ""

# Ensure git exists
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  Write-Host "Git not found. Install from https://git-scm.com/download/win then re-run." -ForegroundColor Red
  exit 1
}

$RepoDir = Join-Path $HOME "Documents\Policestationrepuk"
$Branch = "cursor/security-hardening-uplift-34ef"

if (-not (Test-Path (Join-Path $RepoDir ".git"))) {
  Write-Host "Cloning Policestationrepuk..."
  New-Item -ItemType Directory -Force -Path (Split-Path $RepoDir) | Out-Null
  git clone https://github.com/robertcashman-bit/Policestationrepuk.git $RepoDir
}

Set-Location $RepoDir
git fetch origin $Branch
git checkout $Branch
git pull --ff-only origin $Branch

Write-Host ""
Write-Host "Open this page to create a token (repo scope):" -ForegroundColor Yellow
Write-Host "https://github.com/settings/tokens/new?scopes=repo&description=portfolio-security-push"
try { Start-Process "https://github.com/settings/tokens/new?scopes=repo&description=portfolio-security-push" } catch {}

Write-Host ""
$secure = Read-Host "Paste GitHub PAT (ghp_...) — input hidden" -AsSecureString
$BSTR = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try {
  $env:GH_TOKEN = [Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR) | Out-Null
}

if (-not $env:GH_TOKEN -or $env:GH_TOKEN -notmatch '^gh[pousr]_') {
  Write-Host "Token looks invalid. It should start with ghp_ (classic) or github_pat_." -ForegroundColor Red
  exit 1
}

$script = Join-Path $RepoDir "scripts\push-portfolio-security-hardening.ps1"
& $script
$code = $LASTEXITCODE

# Clear token from env when done
Remove-Item Env:GH_TOKEN -ErrorAction SilentlyContinue
Remove-Item Env:GITHUB_TOKEN -ErrorAction SilentlyContinue

if ($code -eq 0) {
  Write-Host ""
  Write-Host "DONE — all sibling pushes succeeded." -ForegroundColor Green
} else {
  Write-Host ""
  Write-Host "Finished with errors. Scroll up for which repos failed." -ForegroundColor Yellow
}
exit $code
