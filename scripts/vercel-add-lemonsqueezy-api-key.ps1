# Add LEMONSQUEEZY_API_KEY to all Vercel envs. Usage (from repo root, after `npx vercel link` if needed):
#   .\scripts\vercel-add-lemonsqueezy-api-key.ps1 "your_jwt_key_from_lemonsqueezy"
param(
  [Parameter(Mandatory, Position = 0)]
  [string] $Key
)
$ErrorActionPreference = 'Stop'
if ([string]::IsNullOrWhiteSpace($Key)) { throw 'Key is required.' }
foreach ($env in @('production', 'preview', 'development')) {
  $Key | npx vercel env add LEMONSQUEEZY_API_KEY $env --sensitive --force
}
Write-Host 'Done. Redeploy or run: npx vercel --prod --yes' -ForegroundColor Green
