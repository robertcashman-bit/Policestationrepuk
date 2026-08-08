# Outreach system diagnosis (2026-08-02)

## Current architecture (canonical)

Production outreach is **TypeScript + Upstash Redis/KV + Resend on Vercel**, not Supabase.

```
lead_engine (Python, GHA) → CSV import → KV prospects
native LAA/DSCC discovery → enrich → requalify
                                    ↓
                         durable email jobs (KV)
                                    ↓
              /api/cron/firm-outreach-send (job-first drain)
                                    ↓
                         Resend → webhook → delivery/bounce
```

Campaigns:

- `whatsapp_invite_v1` → policestationrepuk.org WhatsApp / directory
- `agent_cover_kent_v1` → policestationagent.com Kent agency cover

## Exact failure path reproduced

1. Production was running **droid-mirror SHA** `78a21ed` while bit `origin/master` was at `a2bbcef` (deploy source drift).
2. Ops source guard failed because `gh api --jq --arg` is invalid (`accepts 1 arg(s), received 4`), so drift was never repaired.
3. Durable jobs existed (`pending≈56–58`) with Resend quota remaining (`90`), domains verified, approval off.
4. Send ticks reported `jobsClaimed: 0`, `sent: 0`, `partial: true`, `suppressed≈20`.
5. **Root cause:** Phase 1 (ready-queue scan + suppress demotion) consumed the dual-campaign elapsed budget (~120s). Phase 2 (claim/send jobs) never ran. Pending jobs sat idle indefinitely.
6. Secondary: PSA ready queue empty (Kent→PSA sync missing on droid tip). Polluted ready queue full of suppressed addresses slowed Phase 1 further.
7. Historical: Redis `WRONGTYPE` on legacy indexes; Resend webhook secret drift (recently repaired in Vercel); bootstrap timeouts at 300s.
8. **PSA still empty after job-first fix (2026-08-02):** maintain cron **HTTP 504 at 300s** before Kent→PSA sync ran (sync was after dual discovery). Sync also scanned the full prospect index with sequential GETs. PSA `sendableCandidates=0` while RepUK had ~80 ready. Fix: fast status-index sync, run sync before discovery and on send-only ticks, dedicated `/api/cron/firm-outreach-psa-sync` at 11:45/15:45 UTC.
9. **PSA inventory exhaustion / stuck exclusions:** After sync repair, KV showed ~3868 PSA rows but `ready_to_send=0`. Kent-tagged PSA emails are mostly already `sent` / suppressed / duplicate; soft-excluded `send_failed` + missing geo hid a few. Fix: `reviveAgentCoverKentReady` + broader Kent town/Medway matching. Verified `sendableCandidates=2`; send then skipped only on `resend_quota` (daily Resend budget 0).
10. **PSA audience policy (2026-08-02):** Recipients are **nationwide** (England & Wales criminal defence). Email copy still offers **Kent police-station cover**. Removed Kent geo-gate from sync/requalify/revive; discovery defaults to nationwide for `agent_cover_kent_v1`.

## Duplicate / obsolete paths

| Path | Status |
|------|--------|
| KV + Resend job queue (`lib/firm-outreach/email-jobs`) | **Canonical** |
| Direct send without jobs (older bit tip) | Superseded by job-first drain |
| Python `lead_engine` live Resend campaign | Secondary; keep dry-run in GHA |
| Supabase outreach tables | Not used |
| `/api/cron/firm-outreach-discovery` | Deprecated wrapper |

## Changes implemented

1. Port durable email-jobs architecture onto bit (`origin`) production source.
2. **Job-first drain** in `runFirmOutreach`: process pending jobs before enqueue; hard-cap enqueue time.
3. Restore Kent→PSA sync (`sync-kent-to-agent-cover`).
4. Plain-text email bodies alongside HTML.
5. Env alias normalisation (`RESEND_WEBHOOK_SECRET`, `ADMIN_DECISION_TOKEN_SECRET`).
6. Fix production source guard `jq` invocation.
7. Harden `claimKey` for `true | "OK"`.
8. Operator scripts: `outreach:doctor`, `outreach:dry-run`, `outreach:test-send`, `outreach:process`, `outreach:recover-stale`.
9. Docs: `docs/outreach-system.md` + this diagnosis.
10. **2026-08-08 rebuild:** `getOutreachCapacity`, 15-min outreach worker, staggered autoheal, consolidated 07:00 Europe/London dual-workspace daily report, dual dashboard, legacy digest/zero-send emails disabled. See `docs/outreach-autoheal-reporting.md`.

### Root causes of “0 emails sent” / vague limit reports (confirmed)

| Cause | Mechanism |
|-------|-----------|
| Phase-1 enqueue starved Phase-2 drain | Dual-campaign elapsed budget consumed before `jobsClaimed` |
| Sparse send cron (2–3×/day) | Pending jobs idle for hours; abandoned leases unrecovered |
| Soft Resend budget (~90/day) reported vaguely | `resend_quota` skip without naming limit/used/remaining/reset |
| Digest “sentToday” mixed UTC KV + London receipts | Stale/wrong zero figures in operator emails |
| Digest scoped to RepUK only | PSA activity invisible in routine reports |
| Routine failure/zero-send emails | Noise without authoritative dual-workspace truth |

## Verification checklist

- [ ] `npm run test:outreach`
- [ ] `npm run outreach:doctor`
- [ ] Deploy bit master → production health SHA on bit history
- [ ] `npm run outreach:test-send` → Resend message IDs
- [ ] `npm run outreach:process -- --limit=5` → `jobsClaimed > 0`, `sent > 0`
- [ ] Unsubscribe + webhook still 401 without signature / succeed with signature
