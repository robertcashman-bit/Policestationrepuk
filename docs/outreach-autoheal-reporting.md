# Outreach autoheal + consolidated daily reporting

## One source of truth

Provider-accepted (= Resend message ID stored on the send/job) is the only figure reported as **Sent / Accepted**.

Statuses used by durable jobs:

`pending → claimed → processing → accepted → delivered`  
Failures: `temporary_failure` / `retry_scheduled` / `permanently_failed` / `bounced` / `complained` / `suppressed` / `cancelled` / `manual_reconciliation_required`

## Capacity API

`getOutreachCapacity(workspace)` in `lib/firm-outreach/capacity.ts` returns eligible, pending, provider/configured/hourly limits, effective capacity, limiting factor, and next reset. Vague “email limit reached” strings are forbidden — reports must name the limit, usage, remaining, and reset.

Workspaces:

| Workspace | URL | Campaign |
|-----------|-----|----------|
| `psa` | policestationagent.com | `agent_cover_kent_v1` |
| `repuk` | policestationrepuk.org | `whatsapp_invite_v1` |

## Schedulers

| Job | Cron (UTC) | Route |
|-----|------------|-------|
| Outreach worker | `*/15 * * * *` | `/api/cron/firm-outreach-send` |
| Autoheal | `5,20,35,50 * * * *` | `/api/cron/firm-outreach-autoheal` |
| Daily report | `0 6,7 * * *` | `/api/cron/firm-outreach-daily-report` |

Daily report handler gates on **07:00 Europe/London** (fires at 06:00 UTC in BST, 07:00 UTC in GMT). Idempotency key: `report_date + consolidated_0700_london`.

## Email policy

- **One** routine admin email/day (07:00 London), both workspaces, actual recipient list, precise zero-reason codes.
- Legacy pipeline digests and routine zero-send failure emails: **disabled**.
- Immediate alerts only for critical faults (auth, domain, dry-run left on, ambiguous duplicate/acceptance).

Recipient: `OUTREACH_ADMIN_EMAIL` → fallback `FIRM_OUTREACH_DIGEST_EMAIL`.

## Dashboard

Admin `/admin/firm-outreach` loads `?view=dual` for both workspaces: health, capacity, limiting factor, last acceptance, autoheal, last daily report.
