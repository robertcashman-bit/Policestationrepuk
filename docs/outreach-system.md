# Firm outreach email system

Dependable production path for professional outreach to criminal defence firms / solicitors / duty solicitors / accredited reps.

## Architecture

- **Storage:** Upstash Redis/KV (prospects, suppressions, send log, durable email jobs)
- **Provider:** Resend (domains: `policestationrepuk.org`, `policestationagent.com`)
- **Orchestration:** Vercel Cron → `/api/cron/firm-outreach-*` (Node runtime, `CRON_SECRET`)
- **Lead factory:** Python `lead_engine` (GitHub Actions) → CSV → `firm-outreach:import-lead-engine`
- **Admin:** `/admin/firm-outreach` (authenticated)

### Campaigns

| Campaign ID | Brand | Purpose |
|-------------|-------|---------|
| `whatsapp_invite_v1` | PoliceStationRepUK | WhatsApp group + directory |
| `agent_cover_kent_v1` | Police Station Agent | Kent custody cover offer (nationwide recipients) |

Selection is explicit per prospect `campaignId` — never random dual-send to the same person for both brands unless they exist as separate campaign rows.

### State machine (jobs)

`pending` → `claimed` → `processing` → `accepted` → (`delivered` via webhook)  
Failures: `retry_scheduled` / `permanently_failed` / `bounced` / `complained` / `suppressed`

**Accepted by Resend ≠ delivered.** Only mark `accepted` after provider message ID is returned. Webhooks update delivery/bounce/complaint.

## Cron schedule (UTC)

See `vercel.json`. Self-healing defaults:

| Time | Route |
|------|-------|
| 03:00 | maintain (discover/requalify) |
| 07:00 / 14:00 | enrich |
| 09:15 | bootstrap |
| 09:30 | full (send or approval email) |
| every 15 min | send worker (job-first drain) |
| :05/:20/:35/:50 | autoheal / reconciliation |
| 06:00 + 07:00 | consolidated daily report (sends only in 07:00 Europe/London hour) |
| 17:00 | approval reminder only (legacy digest disabled) |

All require `Authorization: Bearer $CRON_SECRET`.

### Administrator email policy

Exactly **one** routine outreach email per day at **07:00 Europe/London**:

`Daily Outreach Report — PoliceStationAgent + PoliceStationRepUK — {{date}}`

Recipient: `OUTREACH_ADMIN_EMAIL` (fallback `FIRM_OUTREACH_DIGEST_EMAIL`).  
“Sent” in the report means **provider accepted** (Resend message ID stored).  
Zero-accept days must include a precise `ZERO_REASON_*` explanation — never bare “0 emails sent”.

## Environment (Production)

Required:

- `RESEND_API_KEY`
- `RESEND_WEBHOOK_SECRET`
- `CRON_SECRET`
- `KV_REST_API_URL` + `KV_REST_API_TOKEN` (or Upstash aliases)
- `ADMIN_DECISION_TOKEN_SECRET` (or fall back to `CRON_SECRET`)

Recommended:

- `FIRM_OUTREACH_FROM_EMAIL`
- `FIRM_OUTREACH_PSA_FROM_EMAIL`
- `FIRM_OUTREACH_DIGEST_EMAIL`
- `FIRM_OUTREACH_DAILY_CAP` (e.g. `90` under free-tier budget)
- `SERPER_API_KEY` / `HUNTER_API_KEY` for enrich

Kill switches:

- `FIRM_OUTREACH_PAUSED=true` or admin pause in KV
- `FIRM_OUTREACH_SEND_ENABLED=false`
- `FIRM_OUTREACH_ENABLED=false`
- `FIRM_OUTREACH_DRY_RUN=1` (never live-send)

## Operator commands

```bash
npm run outreach:doctor
npm run outreach:dry-run
npm run outreach:test-send                 # operator probe only
npm run outreach:process -- --limit=5      # bounded live batch
npm run outreach:recover-stale
npm run test:outreach
npm run firm-outreach:configure-resend
npm run firm-outreach:ensure-psa-domain
```

### Pause all sending immediately

1. Vercel → Project → Settings → Environment Variables → set `FIRM_OUTREACH_PAUSED=true` (Production) **or**
2. Admin dashboard → Pause outreach **or**
3. `FIRM_OUTREACH_SEND_ENABLED=false`

### Inspect recent failures

```bash
npm run outreach:doctor -- --url=https://policestationrepuk.org
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://policestationrepuk.org/api/cron/firm-outreach-status
```

### Manual suppression

Admin `/admin/firm-outreach` → Suppress, or write KV key via ops script. Unsubscribe links also suppress.

### Rotate Resend API key

1. Resend dashboard → API Keys → create new
2. Vercel Production env `RESEND_API_KEY` → update
3. Redeploy / wait for env propagation
4. `npm run outreach:test-send`

### Confirm sender domain verified

```bash
npm run firm-outreach:verify
# or status endpoint → verifiedResendDomains / campaignSendHealth
```

## Lead engine scheduling

GitHub Actions: `.github/workflows/lead-engine.yml` (schedule + `workflow_dispatch`).  
Keeps `LEAD_ENGINE_DRY_RUN=true` for Python mailer; import into KV only. Do not enable Python live sends alongside KV sends.

## Deploy source

Production must track **`robertcashman-bit/Policestationrepuk` `master`** (`npm run deploy`).  
The `droid` remote is read-only for this workflow. Source guard: `.github/workflows/ops-production-source-guard.yml`.

## Incident recovery

1. `npm run outreach:doctor` — env/KV/jobs
2. `npm run outreach:recover-stale` — abandoned leases
3. Fix blockers (domain, pause, dry-run, quota)
4. `npm run outreach:test-send`
5. `npm run outreach:process -- --limit=5` — confirm `jobsClaimed` and Resend IDs
6. Only then raise batch size / rely on cron

See also: `docs/outreach-system-diagnosis.md`, `docs/firm-outreach-ops.md`.
