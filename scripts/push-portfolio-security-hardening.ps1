# Push portfolio security-hardening branches across both GitHub accounts (Windows).
#
# Usage (PowerShell):
#   $env:GH_TOKEN = "ghp_..."
#   .\scripts\push-portfolio-security-hardening.ps1
#
# Or double-click / run:
#   .\scripts\windows-push-hardening.ps1
#
# Does NOT push Policestationrepuk to the droid mirror.

$ErrorActionPreference = "Stop"

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$PatchDir = Join-Path $Root "docs\sibling-hardening-patches"
$WorkDir = if ($env:WORKDIR) { $env:WORKDIR } else { Join-Path $env:TEMP "psr-portfolio-security-push" }
$Branch = "cursor/security-hardening-uplift-34ef"
$SkipPr = ($env:SKIP_PR -eq "1")

function Get-GitHubToken {
  if ($env:GH_TOKEN) { return $env:GH_TOKEN }
  if ($env:GITHUB_TOKEN) { return $env:GITHUB_TOKEN }
  try {
    $t = & gh auth token 2>$null
    if ($LASTEXITCODE -eq 0 -and $t) { return $t.Trim() }
  } catch {}
  Write-Host "ERROR: set GH_TOKEN to a PAT with write access on both GitHub accounts." -ForegroundColor Red
  Write-Host "Create one at: https://github.com/settings/tokens/new?scopes=repo&description=portfolio-security-push"
  exit 1
}

$Token = Get-GitHubToken
$env:GH_TOKEN = $Token
$env:GITHUB_TOKEN = $Token

$Targets = @(
  @{ Dest = "robertcashman-bit/policestationagent"; Patch = "policestationagent-security-hardening.patch"; Title = "Security hardening uplift (Police Station Agent)" },
  @{ Dest = "robertcashman-bit/custody-note-app"; Patch = "custody-note-app-security-hardening.patch"; Title = "Security hardening uplift (Custody Note app)" },
  @{ Dest = "robertdavidcashman-droid/psrtrain"; Patch = "psrtrain-security-hardening.patch"; Title = "Security hardening uplift (PSR Train)" },
  @{ Dest = "robertdavidcashman-droid/custody-note-website"; Patch = "custody-note-website-security-hardening.patch"; Title = "Security hardening uplift (Custody Note website)" }
)

New-Item -ItemType Directory -Force -Path $WorkDir | Out-Null
Write-Host "Workdir: $WorkDir"
Write-Host "Branch:  $Branch"
Write-Host ""

$Results = @()
$Fail = $false

foreach ($t in $Targets) {
  $dest = $t.Dest
  $name = ($dest -split "/")[-1]
  $dir = Join-Path $WorkDir $name
  $patch = Join-Path $PatchDir $t.Patch
  $url = "https://x-access-token:${Token}@github.com/${dest}.git"

  Write-Host "======== $dest ========"

  if (-not (Test-Path $patch)) {
    Write-Host "MISSING patch: $patch" -ForegroundColor Red
    $Results += "| ``$dest`` | FAIL | missing patch |"
    $Fail = $true
    continue
  }

  if (Test-Path (Join-Path $dir ".git")) {
    git -C $dir remote set-url origin $url
    git -C $dir fetch origin --prune
  } else {
    if (Test-Path $dir) { Remove-Item -Recurse -Force $dir }
    git clone --depth 50 $url $dir
  }

  $defaultBranch = "master"
  try {
    $defaultBranch = (& gh api "repos/$dest" --jq .default_branch 2>$null)
    if (-not $defaultBranch) { $defaultBranch = "master" }
  } catch {
    $defaultBranch = "master"
  }

  git -C $dir checkout $defaultBranch
  git -C $dir pull --ff-only origin $defaultBranch 2>$null

  git -C $dir branch -D $Branch 2>$null | Out-Null
  git -C $dir checkout -b $Branch

  git -C $dir am --3way $patch
  if ($LASTEXITCODE -ne 0) {
    git -C $dir am --abort 2>$null | Out-Null
    $log = git -C $dir log --oneline -20
    if ($log -match "[Ss]ecurity hardening") {
      Write-Host "Existing security hardening commit detected; continuing"
    } else {
      Write-Host "Patch apply failed" -ForegroundColor Red
      $Results += "| ``$dest`` | FAIL | patch apply failed |"
      $Fail = $true
      continue
    }
  } else {
    Write-Host "Applied $($t.Patch)"
  }

  git -C $dir push -u origin $Branch
  if ($LASTEXITCODE -ne 0) {
    Write-Host "PUSH_FAIL $dest" -ForegroundColor Red
    $Results += "| ``$dest`` | FAIL | push denied — check PAT scopes/account access |"
    $Fail = $true
    continue
  }

  Write-Host "PUSH_OK $dest" -ForegroundColor Green
  $prUrl = "(skipped)"
  if (-not $SkipPr) {
    $body = @"
## Summary

Defensive security hardening uplift for this product.

See ``docs/security-hardening-report.md`` on this branch for findings, fixes, tests, and manual follow-ups.

This PR was opened by ``scripts/push-portfolio-security-hardening.ps1`` from the PoliceStationRepUK portfolio hardening effort.
"@
    $prOut = & gh pr create --repo $dest --base $defaultBranch --head $Branch --title $t.Title --body $body --draft 2>&1
    if ($prOut -match "https://github.com/") {
      $prUrl = ($prOut | Select-String -Pattern "https://github.com/\S+" -AllMatches).Matches[0].Value
    } else {
      try {
        $prUrl = & gh pr view $Branch --repo $dest --json url -q .url 2>$null
        if (-not $prUrl) { $prUrl = "PR create skipped/exists" }
      } catch {
        $prUrl = "PR create skipped/exists"
      }
    }
  }
  $Results += "| ``$dest`` | OK | $prUrl |"
  Write-Host ""
}

Write-Host "## Results"
Write-Host ""
Write-Host "| Repo | Status | Detail |"
Write-Host "|------|--------|--------|"
$Results | ForEach-Object { Write-Host $_ }
Write-Host ""
Write-Host "PoliceStationRepUK is already on robertcashman-bit (do not push that hardening to the droid mirror for production)."

if ($Fail) {
  Write-Host ""
  Write-Host "If pushes failed with 403, create a classic PAT with repo scope that can write both accounts, then re-run." -ForegroundColor Yellow
  exit 1
}
exit 0
