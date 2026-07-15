# Police station search operations

## Cron jobs (UTC)

| Schedule | Path | Purpose |
|----------|------|---------|
| `0 */6 * * *` | `/api/cron/custody-number-discovery` | Crawl + seed + AI new findings |
| `0 */2 * * *` | `/api/cron/custody-psr-verify` | PSR candidates → official/2-source verify → publish or queue |
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
| `CUSTODY_PSR_VERIFY` | on | Set `false` to pause PSR verify cron |
| `CUSTODY_PSR_VERIFY_BATCH_LIMIT` | `50` | Backfill batch size (~2-day pass) |
| `CUSTODY_PSR_VERIFY_STEADY_BATCH` | `20` | Steady-mode batch size |
| `CUSTODY_DESK_RECHECK_DAYS` | `35` | Desk recheck TTL (also drives approved-recheck when set) |
| `CUSTODY_PSR_SERPER_DAILY_CAP` | `400` | Daily Serper queries for PSR verify |
| `CUSTODY_AI_MIN_REJECT_CONFIDENCE` | `80` | AI-only auto-reject floor (self-directory/generic always reject) |
| `CUSTODY_DISCOVERY_MAX_QUERIES` | `8` | Initial query budget |
| `CUSTODY_DISCOVERY_FALLBACK_QUERIES` | `14` | Expanded when empty/sparse |
| `CUSTODY_DISCOVERY_PAGE_FETCH_LIMIT` | `6` | HTML/PDF fetches per suite |
| `CUSTODY_DISCOVERY_OSM` | on | Set `false` to disable OSM |
| `CUSTODY_AI_*` | see ops | Auto publish/reject thresholds |

## PSR verify (checked candidates, not blind copy)

1. Harvest labelled PSR custody phones (`npm run custody:psr-harvest` or GHA `psr-custody-harvest`).
2. Cron `/api/cron/custody-psr-verify` every 2h: fetch PSR → official page and/or 2-source corroboration → publish `verified` / `probable`, else queue.
3. **Never** publish from `policestationreps.com` alone. Self-sites (`policestationrepuk.org`, `policestationagent.com`) are blocked corroborators.
4. Modes: KV `custody:psr-crawl:mode` = `backfill` (force packing, large batches) → `steady` when priority queue empty (owner email on flip).
5. Admin: **Force PSR recheck** on `/admin/custody-number-review` (`action: force_psr_recheck`).

## Admin tools

| Path | Use |
|------|-----|
| `/admin/custody-number-review` | Approve / reject / evidence |
| `/admin/station-contacts` | Contact hub / health |
| `GET /api/admin/station-search-attempts?stationId=` | Attempt history + shared clusters |

## Manual commands

```bash
npm run custody:discover
npm run custody:psr-harvest       # candidate JSON only
npm run custody:psr-verify        # local verify batch
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
