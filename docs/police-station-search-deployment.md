# Police station search — deployment & rollback

## Pre-deploy checklist

1. `npm run lint` (or project lint script)
2. `npm run test:custody-discovery:ci`
3. `npx vitest run __tests__/station-aliases-search.test.ts`
4. `npm run custody:eval` (dry)
5. Optional: `npm run custody:eval:live -- --limit=10` with Serper key
6. `npm run build`
7. Confirm production env: `SERPER_API_KEY`, `OPENAI_API_KEY`, KV, `CRON_SECRET`
8. Apply optional SQL migration only if using Supabase mirror: `supabase/migrations/20260714_station_phone_pipeline.sql` (backup first)
9. Deploy preview → smoke cron with `CRON_SECRET` on preview URL if configured
10. Promote production

## Deploy

```bash
npm run deploy:vercel
# or: npx vercel deploy --prod --yes
```

After deploy, trigger a controlled discovery batch:

```bash
curl -sS -H "Authorization: Bearer $CRON_SECRET" \
  "https://policestationrepuk.org/api/cron/custody-number-discovery?limit=5"
```

Confirm JSON includes `ok: true`, non-zero `searchesRun` / suite scans, and no `custody_env_invalid`.

## Post-deploy smoke

- Admin review UI loads findings.
- `/api/admin/station-search-attempts?stationId=…` returns attempts after a crawl.
- Public station pages still show previously approved numbers.
- Daily summary cron returns `{ ok: true, summary: … }`.
- No spike in 401/403 Serper errors in logs.

## Rollback

1. Redeploy previous Vercel deployment (instant alias rollback).
2. KV findings persist — rollback of code does not delete approved numbers.
3. To pause discovery: remove/comment discovery cron or set invalid, or set `CUSTODY_DISCOVERY_BATCH_LIMIT=0` is not supported — use Vercel cron disable or return early via temporary env kill-switch if added later.
4. Auto-publish off: `CUSTODY_AI_AUTO_PUBLISH=false` (keeps crawl, stops auto publish).

## Data safety

- Never commit API keys.
- Discovery does not rewrite `data/stations.json` in cron.
- Approved numbers are not deleted by failed rechecks.
