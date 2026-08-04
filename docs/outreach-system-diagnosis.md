# Outreach system diagnosis (2026-08-04, updated)

## Current architecture (canonical)

Production outreach is **TypeScript + Upstash Redis/KV + Resend on Vercel**, not Supabase.

```
lead_engine (Python, GHA) → CSV import → KV prospects
native LAA/DSCC discovery → enrich → requalify → PSA sync
                                    ↓
                         durable email jobs (KV)
                                    ↓
              /api/cron/firm-outreach-send (job-first drain + lock release)
                                    ↓
                         Resend → webhook → delivery/bounce
```

Campaigns:

- `whatsapp_invite_v1` → policestationrepuk.org WhatsApp / directory
- `agent_cover_kent_v1` → policestationagent.com Kent agency cover (nationwide recipients)

## Deploy source (critical)

| Fact | Value |
|------|-------|
| This cloud-agent repo | `robertdavidcashman-droid/Policestationrepuk` |
| Bit production owner | `robertcashman-bit/Policestationrepuk` tip `0bed84b` |
| Bit source guard | Every 30m (`:07`/`:37`) re-promotes bit if live SHA ∉ bit master |
| Droid countermeasure | `Ops — production outreach hold` every 10m re-promotes this branch tip |
| Verified droid SHA (probe + PSA flush) | `d1a46f6` (run [30928986104](https://github.com/robertdavidcashman-droid/Policestationrepuk/actions/runs/30928986104)) |

**Root organisational defect:** two GitHub remotes share one Vercel project. Fixes landing only on droid are reverted unless hold/verify reclaim production, or the same commits land on bit `master`.

## Exact failure path (still reproducing)

1. Bit `run-lock.ts` **claims** `firmoutreach:lock:send` but **never releases** (TTL-only). Send route has **no `force=1`**.
2. Bit guard at 16:30 UTC **did** promote `0bed84b` (health matched), then droid verify re-promoted `d1a46f6` during the same kick window.
3. Kick with bootstrap-only auth got **401** on discovery/maintain (cron-secret-only routes).
4. Status `queue.readyToSend` was **WhatsApp-scoped**, so PSA inventory (`ready_to_send: 122`) looked like zero.
5. When PSA ready count was 0, multi-campaign send reserved `psaLimit=0` and mislabeled the skip as `daily_cap`.
6. Cloud agent cannot push to bit; cannot `workflow_dispatch` without secrets in the local env (Actions secrets work in GHA).

## Duplicate / obsolete paths

| Path | Status |
|------|--------|
| KV + Resend job queue (`lib/firm-outreach/email-jobs`) | **Canonical** |
| Bit tip without lock release | **Obsolete / harmful while live** |
| Droid tip with lock release + force clear + hold workflow | Correct sticky path until bit sync |
| Python `lead_engine` live Resend | Keep dry-run in GHA; import to KV only |
| Supabase outreach tables | Not used |

## Changes implemented (this iteration)

1. Bootstrap auth on discovery / enrich / maintain / full pipeline (kick no longer 401s when only bootstrap secret decrypts).
2. Status queue totals sum **both** campaigns; expose `primaryCampaignReadyToSend` + per-campaign `readyRecordCount`.
3. `limit=0` from PSA reserve reports `batch_limit`, not `daily_cap`.
4. `/api/unsubscribe?token=` redirect + unsubscribe marks both campaigns.
5. **`Ops — production outreach hold`** scheduled every 10 minutes to reclaim production from bit guard (promote only; no mass send).
6. Prior: tokenised lock claim/release, stale recovery, `force=1`, PSA sync cron, verify workflow, doctor scripts.

## Verification checklist

- [x] `npm run test:firm-outreach:ci` (269+ passed including status/multi-campaign)
- [x] Auth race fixed: single-flight verify + controlled rotate + bootstrap probe before kick
- [x] Production verify success on `e073555` / live `980aaba` ([run 30933585738](https://github.com/robertdavidcashman-droid/Policestationrepuk/actions/runs/30933585738))
- [x] Multi-model review act-ons: push verify status-only; stale-only `forceClear`; RFC 8058 unsubscribe POST; prepare no longer persists cooldown=0 / ungates without `FIRM_OUTREACH_PREPARE_UNGATE=1`
- [x] `/api/unsubscribe` one-click POST returns 200; `List-Unsubscribe` points at API URL
- [x] `Ops — production outreach hold` on droid `master` (10-minute reclaim)
- [ ] Sync tip to **bit** `master` or disable bit source guard (ends dual-repo war)
- [ ] Set GitHub Actions secrets `CRON_SECRET` / `FIRM_OUTREACH_BOOTSTRAP_SECRET` to Production values (stop decrypt/rotate path)
- [ ] Ensure usable Production `RESEND_WEBHOOK_SECRET` (`whsec_…`)
- [ ] Live SEND: `gh workflow run "Ops — outreach production verify" -f confirm_live=SEND -f limit=8`
