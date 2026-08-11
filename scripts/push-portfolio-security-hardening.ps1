# Push portfolio security-hardening branches across both GitHub accounts (Windows).
# ASCII-only: Windows PowerShell 5.1 mis-parses UTF-8 em-dashes without BOM.
#
# Usage:
#   Prefer: .\scripts\windows-push-hardening.ps1  (prompts securely)
#   Or set GH_TOKEN in the current session, then:
#     .\scripts\push-portfolio-security-hardening.ps1
#
# Does NOT push Policestationrepuk to the droid mirror.

# Do not use Stop: git stderr becomes terminating errors under Stop + 2>&1.
$ErrorActionPreference = "Continue"

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$PatchDir = Join-Path $Root "docs\sibling-hardening-patches"
$WorkDir = if ($env:WORKDIR) { $env:WORKDIR } else { Join-Path $env:TEMP "psr-portfolio-security-push" }
$Branch = "cursor/security-hardening-uplift-34ef"
$SkipPr = ($env:SKIP_PR -eq "1")
$HasGh = [bool](Get-Command gh -ErrorAction SilentlyContinue)

function Get-GitHubToken {
  if ($env:GH_TOKEN) { return $env:GH_TOKEN.Trim() }
  if ($env:GITHUB_TOKEN) { return $env:GITHUB_TOKEN.Trim() }
  if ($HasGh) {
    try {
      $t = & gh auth token 2>$null
      if ($LASTEXITCODE -eq 0 -and $t) { return $t.Trim() }
    } catch {}
  }
  Write-Host "ERROR: set GH_TOKEN via windows-push-hardening.ps1 (secure prompt)." -ForegroundColor Red
  Write-Host "Create a classic PAT (repo scope) at:"
  Write-Host "https://github.com/settings/tokens/new?scopes=repo&description=portfolio-security-push"
  exit 1
}

function Get-GitAuthArgs {
  param([string]$TokenValue)
  # Per-invocation auth header only - never write the PAT into .git/config or argv URLs.
  $basic = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("x-access-token:${TokenValue}"))
  return @("-c", "http.extraHeader=Authorization: Basic $basic")
}

function Escape-CmdArg([string]$Value) {
  if ($Value -match '[\s"&<>|^]') {
    return '"' + ($Value.Replace('"', '""')) + '"'
  }
  return $Value
}

function Invoke-Git {
  param(
    [string]$RepoPath = "",
    [switch]$Auth,
    [Parameter(Mandatory = $true)][string[]]$GitArgs
  )
  # Build a cmd.exe command line so PS 5.1 cannot turn git stderr into terminating errors.
  $all = @()
  if ($Auth) { $all += (Get-GitAuthArgs -TokenValue $Token) }
  if ($RepoPath) { $all += @("-C", $RepoPath) }
  $all += $GitArgs

  $argLine = [string]::Join(' ', ($all | ForEach-Object { Escape-CmdArg ([string]$_) }))
  cmd.exe /c "git $argLine 2>&1"
  $script:LastGitExit = $LASTEXITCODE
  return $script:LastGitExit
}

function Get-PatchSubject {
  param([string]$PatchPath)
  $line = Select-String -Path $PatchPath -Pattern '^Subject:\s*(?:\[PATCH\]\s*)?(.+)$' | Select-Object -First 1
  if (-not $line) { return $null }
  return $line.Matches[0].Groups[1].Value.Trim()
}

$Token = Get-GitHubToken
$env:GH_TOKEN = $Token
$env:GITHUB_TOKEN = $Token

if (-not $HasGh) {
  $SkipPr = $true
}

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

try {
  foreach ($t in $Targets) {
    $dest = $t.Dest
    $name = ($dest -split "/")[-1]
    $dir = Join-Path $WorkDir $name
    $patch = Join-Path $PatchDir $t.Patch
    $publicUrl = "https://github.com/${dest}.git"

    Write-Host "======== $dest ========"

    if (-not (Test-Path $patch)) {
      Write-Host "MISSING patch: $patch" -ForegroundColor Red
      $Results += "| $dest | FAIL | missing patch |"
      $Fail = $true
      continue
    }

    if (Test-Path (Join-Path $dir ".git")) {
      # Ensure remotes never retain a token from older script versions.
      $setUrlCode = Invoke-Git -RepoPath $dir -GitArgs @("remote", "set-url", "origin", $publicUrl)
      if ($setUrlCode -ne 0) {
        Write-Host "REMOTE_FAIL $dest" -ForegroundColor Red
        $Results += "| $dest | FAIL | could not set clean origin URL |"
        $Fail = $true
        continue
      }
      $fetchCode = Invoke-Git -RepoPath $dir -Auth -GitArgs @("fetch", "origin", "--prune")
      if ($fetchCode -ne 0) {
        Write-Host "FETCH_FAIL $dest" -ForegroundColor Red
        $Results += "| $dest | FAIL | fetch denied - check PAT scopes/account access |"
        $Fail = $true
        continue
      }
    } else {
      if (Test-Path $dir) { Remove-Item -Recurse -Force $dir }
      $cloneCode = Invoke-Git -Auth -GitArgs @("clone", "--depth", "50", $publicUrl, $dir)
      if ($cloneCode -ne 0) {
        Write-Host "CLONE_FAIL $dest" -ForegroundColor Red
        $Results += "| $dest | FAIL | clone denied - check PAT scopes/account access |"
        $Fail = $true
        continue
      }
      Invoke-Git -RepoPath $dir -GitArgs @("remote", "set-url", "origin", $publicUrl) | Out-Null
    }

    # Avoid CRLF mangling mailbox patches on Windows.
    Invoke-Git -RepoPath $dir -GitArgs @("config", "core.autocrlf", "false") | Out-Null

    $defaultBranch = "master"
    if ($HasGh) {
      try {
        $apiBranch = & gh api "repos/$dest" --jq .default_branch 2>$null
        if ($apiBranch) { $defaultBranch = "$apiBranch".Trim() }
      } catch {}
    }

    $coCode = Invoke-Git -RepoPath $dir -GitArgs @("checkout", $defaultBranch)
    if ($coCode -ne 0) {
      # Shallow clone may not have local default branch yet.
      $coCode = Invoke-Git -RepoPath $dir -Auth -GitArgs @("checkout", "-B", $defaultBranch, "origin/$defaultBranch")
    }
    if ($coCode -ne 0) {
      Write-Host "CHECKOUT_FAIL $dest ($defaultBranch)" -ForegroundColor Red
      $Results += "| $dest | FAIL | checkout $defaultBranch failed |"
      $Fail = $true
      continue
    }

    $pullCode = Invoke-Git -RepoPath $dir -Auth -GitArgs @("pull", "--ff-only", "origin", $defaultBranch)
    if ($pullCode -ne 0) {
      Write-Host "PULL_FAIL $dest" -ForegroundColor Red
      $Results += "| $dest | FAIL | pull $defaultBranch failed |"
      $Fail = $true
      continue
    }

    # Create/reset feature branch from current default tip (handles re-runs).
    $brCode = Invoke-Git -RepoPath $dir -GitArgs @("checkout", "-B", $Branch)
    if ($brCode -ne 0) {
      Write-Host "BRANCH_FAIL $dest" -ForegroundColor Red
      $Results += "| $dest | FAIL | could not create branch $Branch |"
      $Fail = $true
      continue
    }

    $amCode = Invoke-Git -RepoPath $dir -GitArgs @("-c", "core.autocrlf=false", "am", "--3way", "--keep-cr", $patch)
    if ($amCode -ne 0) {
      Invoke-Git -RepoPath $dir -GitArgs @("am", "--abort") | Out-Null
      $subject = Get-PatchSubject -PatchPath $patch
      $already = $false
      if ($subject) {
        $logSubjects = @(& git -C $dir log --format=%s -20 2>$null)
        if ($logSubjects | Where-Object { "$_".Trim() -eq $subject }) {
          $already = $true
        }
      }
      if ($already) {
        Write-Host "Patch subject already present on tip history; continuing"
      } else {
        Write-Host "Patch apply failed" -ForegroundColor Red
        $Results += "| $dest | FAIL | patch apply failed |"
        $Fail = $true
        continue
      }
    } else {
      Write-Host "Applied $($t.Patch)"
    }

    $pushCode = Invoke-Git -RepoPath $dir -Auth -GitArgs @("push", "-u", "origin", $Branch)
    if ($pushCode -ne 0) {
      Write-Host "PUSH_FAIL $dest" -ForegroundColor Red
      $Results += "| $dest | FAIL | push denied - check PAT scopes/account access |"
      $Fail = $true
      continue
    }

    Write-Host "PUSH_OK $dest" -ForegroundColor Green
    $prUrl = "(skipped)"
    if (-not $SkipPr -and $HasGh) {
      $body = @"
## Summary

Defensive security hardening uplift for this product.

See docs/security-hardening-report.md on this branch for findings, fixes, tests, and manual follow-ups.

This PR was opened by scripts/push-portfolio-security-hardening.ps1 from the PoliceStationRepUK portfolio hardening effort.
"@
      $prOut = & gh pr create --repo $dest --base $defaultBranch --head $Branch --title $t.Title --body $body --draft 2>&1 | Out-String
      if ($prOut -match "https://github.com/") {
        $prUrl = ([regex]::Match($prOut, "https://github.com/\S+")).Value
      } else {
        try {
          $prUrl = & gh pr view $Branch --repo $dest --json url -q .url 2>$null
          if (-not $prUrl) { $prUrl = "PR create skipped/exists" }
        } catch {
          $prUrl = "PR create skipped/exists"
        }
      }
    }
    $Results += "| $dest | OK | $prUrl |"
    Write-Host ""
  }
}
finally {
  # Best-effort: scrub any legacy token URLs left in workdir remotes.
  Get-ChildItem -Path $WorkDir -Directory -ErrorAction SilentlyContinue | ForEach-Object {
    $gitDir = Join-Path $_.FullName ".git"
    if (Test-Path $gitDir) {
      $guess = $null
      switch -Regex ($_.Name) {
        '^policestationagent$' { $guess = "https://github.com/robertcashman-bit/policestationagent.git" }
        '^custody-note-app$' { $guess = "https://github.com/robertcashman-bit/custody-note-app.git" }
        '^psrtrain$' { $guess = "https://github.com/robertdavidcashman-droid/psrtrain.git" }
        '^custody-note-website$' { $guess = "https://github.com/robertdavidcashman-droid/custody-note-website.git" }
      }
      if ($guess) {
        & git -C $_.FullName remote set-url origin $guess 2>$null | Out-Null
      }
    }
  }
  Remove-Item Env:GH_TOKEN -ErrorAction SilentlyContinue
  Remove-Item Env:GITHUB_TOKEN -ErrorAction SilentlyContinue
  $Token = $null
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
