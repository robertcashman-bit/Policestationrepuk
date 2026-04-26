param(
    [switch]$DryRun
)

# Re-write the Lemon Squeezy env vars on Vercel so the stored values have no
# trailing whitespace / CR / LF. Reads cleaned values from .env.local.
# Usage:
#   pwsh ./scripts/fix-vercel-lemonsqueezy-envs.ps1            # apply
#   pwsh ./scripts/fix-vercel-lemonsqueezy-envs.ps1 -DryRun    # show only

$ErrorActionPreference = 'Stop'

$envFile = Join-Path (Get-Location) '.env.local'
if (-not (Test-Path $envFile)) {
    Write-Error ".env.local not found. Run: vercel env pull .env.local --environment=development --yes"
    exit 2
}

$names = @(
    'LEMONSQUEEZY_API_KEY',
    'LEMONSQUEEZY_STORE_ID',
    'LEMONSQUEEZY_WEBHOOK_SECRET',
    'LEMONSQUEEZY_VARIANT_MONTHLY',
    'LEMONSQUEEZY_VARIANT_3MONTH',
    'LEMONSQUEEZY_VARIANT_6MONTH',
    'LEMONSQUEEZY_VARIANT_YEARLY'
)

$envs = @('production', 'preview', 'development')

# Parse .env.local manually (Vercel writes "value" with \r\n escapes inside quotes)
$values = @{}
Get-Content -LiteralPath $envFile -Raw | ForEach-Object {
    $_ -split "`r?`n"
} | ForEach-Object {
    if ($_ -match '^\s*([A-Z0-9_]+)\s*=\s*(.*)$') {
        $key = $Matches[1]
        $val = $Matches[2]
        if ($val.StartsWith('"') -and $val.EndsWith('"')) {
            $val = $val.Substring(1, $val.Length - 2)
            $val = $val -replace '\\n', "`n"
            $val = $val -replace '\\r', "`r"
        }
        $values[$key] = $val.Trim()
    }
}

foreach ($name in $names) {
    if (-not $values.ContainsKey($name) -or [string]::IsNullOrEmpty($values[$name])) {
        Write-Warning "Skipping $name (not present or empty in .env.local)"
        continue
    }
    $cleaned = $values[$name]
    Write-Host ("[fix] {0}  ({1} chars cleaned)" -f $name, $cleaned.Length)

    foreach ($scope in $envs) {
        if ($DryRun) {
            Write-Host "  - would: vercel env rm $name $scope --yes"
            Write-Host "  - would: vercel env add $name $scope <stdin>"
            continue
        }
        # Remove existing
        & npx --yes vercel env rm $name $scope --yes 2>&1 | Out-Null
        # Add cleaned value via stdin
        $cleaned | & npx --yes vercel env add $name $scope | Out-Host
    }
}

Write-Host ""
Write-Host "Done. Trigger a production redeploy so the new values apply."
