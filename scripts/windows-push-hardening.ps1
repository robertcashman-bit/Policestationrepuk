# One-shot Windows helper: clone/update PSRUK, prompt for PAT, push sibling hardening.
# ASCII-only on purpose: Windows PowerShell 5.1 breaks on UTF-8 em-dashes without BOM.
#
# Run in PowerShell:
#   Set-ExecutionPolicy -Scope Process Bypass -Force
#   cd $env:USERPROFILE\Documents\Policestationrepuk
#   .\scripts\windows-push-hardening.ps1

$ErrorActionPreference = "Stop"

try {
  Write-Host ""
  Write-Host "=== Portfolio security hardening push (Windows) ===" -ForegroundColor Cyan
  Write-Host "This will push hardened branches to:"
  Write-Host "  - robertcashman-bit/policestationagent"
  Write-Host "  - robertcashman-bit/custody-note-app"
  Write-Host "  - robertdavidcashman-droid/psrtrain"
  Write-Host "  - robertdavidcashman-droid/custody-note-website"
  Write-Host ""

  if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "Git not found. Install from https://git-scm.com/download/win then re-run." -ForegroundColor Red
    Write-Host "Or: winget install --id Git.Git -e"
    exit 1
  }

  $HomeDir = if ($env:USERPROFILE) { $env:USERPROFILE } else { [string]$HOME }
  $RepoDir = Join-Path $HomeDir "Documents\Policestationrepuk"
  # Branch that contains sibling patches + these scripts (until merged to master).
  $SourceBranch = "cursor/windows-push-hardening-fix-34ef"

  if (-not (Test-Path (Join-Path $RepoDir ".git"))) {
    Write-Host "Cloning Policestationrepuk..."
    New-Item -ItemType Directory -Force -Path (Split-Path $RepoDir) | Out-Null
    git clone https://github.com/robertcashman-bit/Policestationrepuk.git $RepoDir
    if ($LASTEXITCODE -ne 0) { throw "git clone failed" }
  }

  Set-Location $RepoDir

  # Prefer the fix branch; fall back to security branch, then master.
  $fetched = $false
  foreach ($candidate in @($SourceBranch, "cursor/security-hardening-uplift-34ef", "master")) {
    git fetch origin $candidate 2>$null
    if ($LASTEXITCODE -eq 0) {
      git checkout $candidate
      if ($LASTEXITCODE -eq 0) {
        git pull --ff-only origin $candidate 2>$null
        $SourceBranch = $candidate
        $fetched = $true
        break
      }
    }
  }
  if (-not $fetched) { throw "Could not checkout a branch that contains the push scripts" }

  $script = Join-Path $RepoDir "scripts\push-portfolio-security-hardening.ps1"
  if (-not (Test-Path $script)) {
    Write-Host "ERROR: push script missing: $script" -ForegroundColor Red
    Write-Host "Run: git fetch origin cursor/windows-push-hardening-fix-34ef; git checkout cursor/windows-push-hardening-fix-34ef"
    exit 1
  }

  Write-Host ""
  Write-Host "Open this page to create a token (repo scope):" -ForegroundColor Yellow
  Write-Host "https://github.com/settings/tokens/new?scopes=repo&description=portfolio-security-push"
  try { Start-Process "https://github.com/settings/tokens/new?scopes=repo&description=portfolio-security-push" } catch {}

  Write-Host ""
  Write-Host "Paste your GitHub PAT below (starts with ghp_ or github_pat_)." -ForegroundColor Yellow
  Write-Host "Characters may be hidden while typing/pasting." -ForegroundColor Yellow
  $secure = Read-Host "PAT" -AsSecureString
  $BSTR = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try {
    $env:GH_TOKEN = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($BSTR).Trim()
  } finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR) | Out-Null
  }

  $tokenOk = $false
  if ($env:GH_TOKEN) {
    if ($env:GH_TOKEN.StartsWith("ghp_") -or $env:GH_TOKEN.StartsWith("github_pat_") -or $env:GH_TOKEN.StartsWith("gho_")) {
      $tokenOk = $true
    }
  }
  if (-not $tokenOk) {
    Write-Host "Token looks invalid. It should start with ghp_ (classic) or github_pat_ (fine-grained)." -ForegroundColor Red
    exit 1
  }

  # Skip PR creation if GitHub CLI is missing (pushes still work).
  if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    $env:SKIP_PR = "1"
    Write-Host "GitHub CLI (gh) not found - will push branches only (no PR create)." -ForegroundColor Yellow
  }

  & $script
  $code = $LASTEXITCODE
  if ($null -eq $code) { $code = 0 }

  Remove-Item Env:GH_TOKEN -ErrorAction SilentlyContinue
  Remove-Item Env:GITHUB_TOKEN -ErrorAction SilentlyContinue

  if ($code -eq 0) {
    Write-Host ""
    Write-Host "DONE - all sibling pushes succeeded." -ForegroundColor Green
  } else {
    Write-Host ""
    Write-Host "Finished with errors. Scroll up for which repos failed." -ForegroundColor Yellow
  }
  exit $code
}
catch {
  Write-Host ""
  Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
  Write-Host $_.ScriptStackTrace -ForegroundColor DarkGray
  exit 1
}
finally {
  Write-Host ""
  Read-Host "Press Enter to close"
}
