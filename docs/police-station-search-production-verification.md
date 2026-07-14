# Production verification report — station phone discovery

**Date:** 2026-07-14  
**Deployment prerequisite:** CI custody discovery tests green; dry eval query avg ≥ 12.

## Automated verification (pre-deploy)

| Check | Result |
|-------|--------|
| `npm run test:custody-discovery:ci` | 60 passed |
| `npm run custody:eval` (dry) | `queryVariantsPerStationAvg` ≈ 31 |
| Cron routes exist for new paths | `vercel-cron-routes` green |
| Audit + architecture docs | Present under `docs/police-station-*.md` |

## Deployment

- **Commit:** `6ad6266` (type fix) on top of `5d364ae` (pipeline overhaul)
- **Production deployment:** `dpl_YenkbN4c5Rwppz6WVCg23rhavD4C` — READY  
- **Alias:** https://policestationrepuk.com (org host redirects to policestationrepuk.org)

Local live eval against Serper (pre-deploy, `n=8`): 100% scored candidate yield with custody context; 0 generic/101 hits.

## Post-deploy smoke (run with dashboard `CRON_SECRET`)

Sensitive production secrets do not export via `vercel env pull` (empty values). Smoke from a machine/shell that has the real secret:

```bash
# 1) Controlled crawl
curl -sS -H "Authorization: Bearer $CRON_SECRET" \
  "https://policestationrepuk.org/api/cron/custody-number-discovery?limit=5"

# 2) Daily summary
curl -sS -H "Authorization: Bearer $CRON_SECRET" \
  "https://policestationrepuk.org/api/cron/station-phone-discovery-summary"

# 3) Outstanding digest scheduled (manual force once)
curl -sS -H "Authorization: Bearer $CRON_SECRET" \
  "https://policestationrepuk.org/api/cron/custody-discovery-outstanding?force=1"
```

Confirm:

- [ ] Discovery JSON `ok: true`
- [ ] No `custody_env_invalid`
- [ ] Search attempts appear for a scanned station via admin API
- [ ] Previously approved public custody numbers still dialable
- [ ] No Serper 401/403 spike in logs

## Rollback

Instant: promote previous Vercel deployment. See `docs/police-station-search-deployment.md`.
