# Buffer reliability report

**Date:** 2026-06-14  
**Site:** policestationrepuk.org (production Buffer engine)

---

## 1. Architecture discovered

```
Vercel cron 05:05 UTC
  → /api/cron/buffer-blog-posts
  → runRepukBufferScheduler()
  → @robertcashman/buffer-engine runSiteBufferScheduler
  → GraphQL createPost → Buffer
  → KV run record + recent-slugs + attempt logs

Supporting crons: buffer-verify (gap-fill), buffer-selftest, buffer-daily-report,
buffer-cross-site-report, buffer-health (weekly GBP), buffer-weekly-report.
```

Manual `npm run buffer:schedule` now uses the **same engine path** as production. Legacy multi-feed is `buffer:schedule-legacy`.

Full failure inventory: [`BUFFER_FAILURE_INVENTORY.md`](BUFFER_FAILURE_INVENTORY.md)

---

## 2. Root causes found

| Cause | Impact |
|-------|--------|
| Engine aborted entire day if any selected post lacked a Buffer-compatible image | Incomplete batches |
| `npm run buffer:schedule` used legacy multi-feed while cron used engine | Ops / environment drift |
| `buffer-health` not in `vercel.json` | Weekly GBP alerts never ran |
| No durable attempt records | Expected vs accepted unobservable |
| Bulk API rate limits | Temporary incomplete seo-growth queues |
| Dual silence on partial failure | Harder to see under-quota days |

---

## 3. Files changed

- `packages/buffer-engine/src/scheduler.ts` — skip posts without images; continue batch
- `lib/buffer/errors.ts` — error classification + backoff
- `lib/buffer/attempts.ts` — durable attempt records
- `lib/buffer/attachment-validation.ts` — attachment validation helper
- `app/api/cron/buffer-blog-posts/route.ts` — log attempts after schedule
- `app/admin/buffer/page.tsx` + `BufferDiagnosticsPanel` — admin diagnostics
- `components/admin/AdminShell.tsx` — nav link
- `scripts/run-buffer-blog-scheduler.ts` — engine path
- `scripts/run-buffer-blog-scheduler-legacy.ts` — legacy path
- `scripts/reconcile-buffer-history.ts` — dry-run historical reconciliation
- `vercel.json` — register `buffer-health` weekly
- `docs/buffer-ops.md` — schedule vs legacy, reconcile
- `__tests__/buffer-reliability.test.ts`
- `seo-growth/buffer/BUFFER_FAILURE_INVENTORY.md`

---

## 4. Database migrations

None. Uses existing Upstash KV keys (`buffer-engine:*`, new `buffer-attempts:{site}:{date}`).

---

## 5. Tests added / run

| Test | Expected | Actual | Pass |
|------|----------|--------|------|
| buffer-reliability (classification, retry, summarise, URL normalise) | 6+ assertions | Passed | Yes |
| buffer-cron-route | 10 | Passed | Yes |
| buffer-engine package suite | 32 | Passed | Yes |

---

## 6–8. Historical failures

- Run: `npm run buffer:reconcile-history -- --days=N`
- Output: `seo-growth/buffer/buffer-reconciliation-report.json`
- **Does not auto-publish stale past-due content** — marks `review_required` / under-quota for human decision
- Seo-growth sentinel IDs flagged as `kv_missing_buffer_id`

---

## 9. Monitoring added

- Attempt records in KV + structured logs
- Admin page `/admin/buffer` (cron heartbeats, today’s run, attempt summary)
- Weekly `buffer-health` cron restored

---

## 10. Scheduled jobs changed

| Path | Schedule | Change |
|------|----------|--------|
| `/api/cron/buffer-health` | `0 6 * * 1` | **Added** to vercel.json |

---

## 11. Environment variables required

Unchanged for production:

- `BUFFER_API_KEY`
- `BUFFER_ORGANIZATION_ID`
- `BUFFER_CHANNEL_TWITTER_ID` / `LINKEDIN_ID` / `GOOGLEBUSINESS_ID`
- `CRON_SECRET`
- `UPSTASH_REDIS_REST_URL` / `TOKEN` (attempt + run records)
- `RESEND_API_KEY` (emails)

---

## 12. Deployment verification checklist

1. Deploy with vercel.json including buffer-health
2. Open `/admin/buffer` after next cron
3. `npm run buffer:schedule -- --dry-run` (no live posts)
4. Confirm KV run after next 05:05 UTC cron
5. Spot-check Gap-fill via 05:35 verify if under quota

---

## 13. Remaining risks

- Buffer API rate limits under heavy bulk tools
- Sister-site draft URLs until those CMS publishes land
- Attempt logging currently records at cron completion (engine-internal failures before cron return are captured via `result.errors`)

---

## 14. Administrator steps

1. Deploy this branch
2. Visit `/admin/buffer` after the next scheduler run
3. Run `npm run buffer:reconcile-history -- --days=14` and review the JSON report
4. For GBP image issues: `npm run buffer:verify-scheduled-gbp` then `npm run buffer:repair-gbp`
5. Do not force-repost aged content without editorial review

---

## 15. Expected vs actual posting

Production day quota is enforced by the engine (`ok` requires `created.length >= targetCount` unless the blog pool itself is smaller). Verify cron gap-fills under-quota days. Admin diagnostics and attempt summaries compare **expected vs accepted**.
