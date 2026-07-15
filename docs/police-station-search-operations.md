# Police station search operations

## Cron jobs (UTC)

| Schedule | Path | Purpose |
|----------|------|---------|
| `0 */6 * * *` | `/api/cron/custody-number-discovery` | Crawl + seed + AI new findings |
| `30 3,9,15 * * *` | `/api/cron/custody-discovery-ai-review` | AI backlog |
| `0 4,12,20 * * *` | `/api/cron/custody-discovery-queue-reprocess` | Weak evidence / conflict auto-resolve |
| `45 2 * * *` | `/api/cron/custody-approved-recheck` | Re-verify published |
| `0 19 * * *` | `/api/cron/custody-discovery-digest` | New findings / auto-approve digest |
| `15 19 * * *` | `/api/cron/custody-discovery-outstanding` | Full open-queue digest |
| `30 19 * * *` | `/api/cron/station-phone-discovery-summary` | Yield + alert flags |
| `0 4 * * 1` | `/api/cron/station-contact-health` | Weekly health snapshot |

Auth: `Authorization: Bearer $CRON_SECRET` or `x-cron-secret`.

## Key environment variables

| Variable | Default | Notes |
|----------|---------|-------|
| `SERPER_API_KEY` | — | Required in production |
| `OPENAI_API_KEY` | — | AI review/classify |
| `KV_REST_API_*` / `UPSTASH_*` | — | Findings + attempts |
| `CUSTODY_DISCOVERY_BATCH_LIMIT` | `30` | Suites per discovery run |
| `CUSTODY_AI_MIN_REJECT_CONFIDENCE` | `80` | AI-only auto-reject floor (rep/generic always reject) |
| `CUSTODY_DISCOVERY_MAX_QUERIES` | `8` | Initial query budget |
| `CUSTODY_DISCOVERY_FALLBACK_QUERIES` | `14` | Expanded when empty/sparse |
| `CUSTODY_DISCOVERY_PAGE_FETCH_LIMIT` | `6` | HTML/PDF fetches per suite |
| `CUSTODY_DISCOVERY_OSM` | on | Set `false` to disable OSM |
| `CUSTODY_AI_*` | see ops | Auto publish/reject thresholds |

## Admin tools

| Path | Use |
|------|-----|
| `/admin/custody-number-review` | Approve / reject / evidence |
| `/admin/station-contacts` | Contact hub / health |
| `GET /api/admin/station-search-attempts?stationId=` | Attempt history + shared clusters |

## Manual commands

```bash
npm run custody:discover
npm run custody:eval              # dry query-coverage eval
npm run custody:eval:live         # Serper live eval (costs API quota)
```

## Alerts (daily summary)

Flags logged when:

- zero new findings with large backlog;
- >75% drop vs previous day;
- unusually many open 101 classifications;
- large shared-number clusters.

Inspect cron run logs: KV key `cron-run:latest:station-phone-discovery-summary`.
