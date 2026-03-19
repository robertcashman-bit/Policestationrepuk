# Data Pipeline — PoliceStationRepUK

## Overview

This pipeline scrapes live representative data from `policestationrepuk.com`
using Puppeteer, outputs structured JSON, serves it via an Express API,
and renders it dynamically on the target site.

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Puppeteer      │     │   JSON Output     │     │   Express API    │
│   Scraper        │ ──> │   scraped-reps    │ <── │   /reps          │
│   scraper.js     │     │   .json           │     │   server.js      │
└──────────────────┘     └──────────────────┘     └──────────────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │   Frontend        │
                         │   directory-live  │
                         │   .html           │
                         └──────────────────┘
```

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Run the Scraper

```bash
npm run scrape
```

This will:
- Launch a headless Chromium browser
- Navigate to the directory page
- Click "Load More" until all reps are loaded
- Click "Show Contact Details" on every card
- Visit each rep's profile page for full station lists
- Output `data/scraped-reps.json`

### 3. Start the API Server

```bash
npm run api
```

Endpoints:
- `GET /reps` — all reps (with optional `?county=`, `?q=`, `?availability=` filters)
- `GET /reps/:slug` — single rep by slug
- `GET /counties` — county list with counts
- `GET /stats` — summary statistics
- `GET /health` — health check

### 4. Run Full Pipeline

```bash
npm run pipeline
```

Runs scraper then starts API server in sequence.

## Scraper Options

| Flag | Description | Default |
|------|-------------|---------|
| `--url <base>` | Source site URL | `https://policestationrepuk.com` |
| `--out <path>` | Output JSON path | `data/scraped-reps.json` |

Examples:

```bash
# Scrape from .org instead
npm run scrape:org

# Custom output
node scripts/scraper.js --out ./my-data/reps.json
```

## Output Format

`data/scraped-reps.json`:

```json
[
  {
    "name": "Robert Cashman",
    "phone": "07123456789",
    "email": "robert@example.com",
    "county": "Kent",
    "availability": "24/7",
    "accreditation": "Accredited",
    "featured": true,
    "stations": ["Medway", "Maidstone", "Tonbridge"],
    "bio": "Experienced representative covering all of Kent...",
    "slug": "robert-cashman",
    "websiteUrl": "https://example.com"
  }
]
```

## Automation (Scheduled Runs)

### Windows Task Scheduler

1. Open Task Scheduler
2. Create Basic Task → name: "PSR UK Scraper"
3. Trigger: Daily, repeat every 6 or 12 hours
4. Action: Start a Program
   - Program: `node`
   - Arguments: `scripts/scraper.js`
   - Start in: `C:\Users\rober\OneDrive\Desktop\workspaces\Policestationrepuk`
5. Save

### PowerShell (one-liner for testing)

```powershell
# Run scraper every 6 hours
$action = New-ScheduledTaskAction -Execute "node" -Argument "scripts/scraper.js" -WorkingDirectory "C:\Users\rober\OneDrive\Desktop\workspaces\Policestationrepuk"
$trigger = New-ScheduledTaskTrigger -Daily -At 6am
$trigger2 = New-ScheduledTaskTrigger -Daily -At 12pm
$trigger3 = New-ScheduledTaskTrigger -Daily -At 6pm
$trigger4 = New-ScheduledTaskTrigger -Daily -At 12am
Register-ScheduledTask -TaskName "PSR-Scraper" -Action $action -Trigger $trigger,$trigger2,$trigger3,$trigger4 -Description "Scrape PoliceStationRepUK directory data"
```

### Linux/Mac (cron)

```bash
# Every 6 hours
0 */6 * * * cd /path/to/project && node scripts/scraper.js >> /var/log/psr-scraper.log 2>&1
```

## Frontend Integration

### Next.js API Route (built-in)

The scraped data is served at `/api/scraped-reps` via the Next.js API route.
The existing directory page reads from `data/reps.json` at build time.

### Standalone HTML

`public/directory-live.html` is a self-contained page that:
- Fetches data from `/api/scraped-reps` (or falls back to JSON files)
- Renders rep cards dynamically
- Supports search, county filter, availability filter
- Responsive card layout
- No hardcoded data

Access at: `https://policestationrepuk.org/directory-live.html`

### Express API (standalone)

For external consumers or separate deployments:

```bash
npm run api
# → http://localhost:4000/reps
# → http://localhost:4000/counties
# → http://localhost:4000/stats
```

## Robustness

The scraper handles:
- **Slow loading**: `waitForSelector` with configurable timeouts
- **Missing elements**: Graceful fallbacks for empty fields
- **JS-rendered content**: Full Puppeteer browser, not just HTTP requests
- **Pagination**: Automatic "Load More" clicking until exhausted
- **Hidden data**: Toggles "Show Contact Details" on every card
- **Profile enrichment**: Visits each `/rep/:slug` page for full station lists
- **Retries**: Up to 3 attempts on failure
- **Deduplication**: Merges duplicate entries by slug
- **Data cleaning**: Trims whitespace, normalizes fields

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Puppeteer won't launch | Run `npx puppeteer browsers install chrome` |
| No reps found | Check if site is up: `curl https://policestationrepuk.com/directory` |
| Partial results | Increase `LOAD_MORE_DELAY` in scraper.js |
| API returns empty | Run `npm run scrape` first to generate data |
| CORS errors in browser | API server has CORS enabled; check port |
