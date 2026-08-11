# One-shot Windows helper: clone/update PSRUK, prompt for PAT, push sibling hardening.
# ASCII-only on purpose: Windows PowerShell 5.1 breaks on UTF-8 em-dashes without BOM.
#
# If you still see: ERROR: From https://github.com/...
# the old script is still on disk. Reset FIRST (do not run this script yet):
#   cd $env:USERPROFILE\Documents\Policestationrepuk
#   git fetch origin cursor/security-hardening-uplift-34ef
#   git checkout -B cursor/security-hardening-uplift-34ef origin/cursor/security-hardening-uplift-34ef
#   git reset --hard origin/cursor/security-hardening-uplift-34ef
# Then run:
#   .\scripts\windows-push-hardening.ps1

$ErrorActionPreference = "Continue"
$PSNativeCommandUseErrorActionPreference = $false

function Write-Err([string]$Message) {
  Write-Host "ERROR: $Message" -ForegroundColor Red
}

function Invoke-Git {
  param([Parameter(Mandatory = $true)][string[]]$GitArgs)
  # Route through cmd.exe so PowerShell never turns git stderr into terminating errors.
  # (PS 5.1 does that with 2>$null / 2>&1 under Stop, and some hosts still do with Continue.)
  $parts = foreach ($a in $GitArgs) {
    if ($null -eq $a) { continue }
    $s = [string]$a
    if ($s -match '[\s"&<>|^]') {
      '"' + ($s.Replace('"', '""')) + '"'
    } else {
      $s
    }
  }
  $argLine = [string]::Join(' ', $parts)
  cmd.exe /c "git $argLine 2>&1"
  return $LASTEXITCODE
}

Write-Host ""
Write-Host "=== Portfolio security hardening push (Windows) ===" -ForegroundColor Cyan
Write-Host ("Script version: {0}" -f (Get-Date -Format 'yyyy-MM-dd')) 
Write-Host "This will push hardened branches to:"
Write-Host "  - robertcashman-bit/policestationagent"
Write-Host "  - robertcashman-bit/custody-note-app"
Write-Host "  - robertdavidcashman-droid/psrtrain"
Write-Host "  - robertdavidcashman-droid/custody-note-website"
Write-Host ""

# Prove this is the fixed script (old broken ones had try/catch + Stop).
if (-not (Get-Content -LiteralPath $PSCommandPath -Raw).Contains('cmd.exe /c "git')) {
  Write-Err "This copy of windows-push-hardening.ps1 is outdated."
  Write-Host "Run these commands, then try again:"
  Write-Host '  git fetch origin cursor/security-hardening-uplift-34ef'
  Write-Host '  git reset --hard origin/cursor/security-hardening-uplift-34ef'
  Read-Host "Press Enter to close"
  exit 1
}

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  Write-Err "Git not found. Install from https://git-scm.com/download/win then re-run."
  Write-Host "Or: winget install --id Git.Git -e"
  Read-Host "Press Enter to close"
  exit 1
}

$HomeDir = if ($env:USERPROFILE) { $env:USERPROFILE } else { [string]$HOME }
$RepoDir = Join-Path $HomeDir "Documents\Policestationrepuk"
$PreferredBranches = @(
  "cursor/security-hardening-uplift-34ef",
  "cursor/windows-push-hardening-fix-34ef",
  "master"
)

if (-not (Test-Path (Join-Path $RepoDir ".git"))) {
  Write-Host "Cloning Policestationrepuk..."
  New-Item -ItemType Directory -Force -Path (Split-Path $RepoDir) | Out-Null
  $cloneCode = Invoke-Git -GitArgs @("clone", "https://github.com/robertcashman-bit/Policestationrepuk.git", $RepoDir)
  if ($cloneCode -ne 0) {
    Write-Err "git clone failed"
    Read-Host "Press Enter to close"
    exit 1
  }
}

Set-Location $RepoDir

$selected = $null
foreach ($candidate in $PreferredBranches) {
  Write-Host "Trying branch: $candidate"
  $fetchCode = Invoke-Git -GitArgs @("fetch", "origin", $candidate)
  if ($fetchCode -ne 0) { continue }
  $coCode = Invoke-Git -GitArgs @("checkout", "-B", $candidate, "origin/$candidate")
  if ($coCode -ne 0) {
    $coCode = Invoke-Git -GitArgs @("checkout", $candidate)
  }
  if ($coCode -ne 0) { continue }
  Invoke-Git -GitArgs @("pull", "--ff-only", "origin", $candidate) | Out-Null
  $selected = $candidate
  break
}

if (-not $selected) {
  Write-Err "Could not checkout a branch that contains the push scripts"
  Read-Host "Press Enter to close"
  exit 1
}

Write-Host "Using branch: $selected" -ForegroundColor Green

$script = Join-Path $RepoDir "scripts\push-portfolio-security-hardening.ps1"
if (-not (Test-Path $script)) {
  Write-Err "push script missing: $script"
  Write-Host "Run: git fetch origin cursor/security-hardening-uplift-34ef"
  Write-Host "     git reset --hard origin/cursor/security-hardening-uplift-34ef"
  Read-Host "Press Enter to close"
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
  Write-Err "Token looks invalid. It should start with ghp_ (classic) or github_pat_ (fine-grained)."
  Read-Host "Press Enter to close"
  exit 1
}

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

Write-Host ""
Read-Host "Press Enter to close"
exit $code
