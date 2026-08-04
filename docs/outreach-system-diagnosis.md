# Outreach system diagnosis (2026-08-04)

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
| Live `/api/health` version (2026-08-04) | `0bed84b` |
| That SHA lives on | **`robertcashman-bit/Policestationrepuk`** |
| This cloud-agent repo | `robertdavidcashman-droid/Policestationrepuk` |
| Bit source guard | Every 30m re-promotes bit if live SHA ∉ bit master |
| Droid push/deploy | Can temporarily overwrite production; bit guard reverts |

**Root organisational defect:** two GitHub remotes share one Vercel project. Fixes landing only on droid are reverted; fixes landing only on bit lack droid’s lock-release work.

## Exact failure path (current)

1. Production runs **bit** `0bed84b` (“rebuild firm-outreach indexes as Redis SETs…”).
2. Bit `run-lock.ts` **claims** `firmoutreach:lock:send` but **never releases** (TTL-only, 270s). Pipeline has no `finally` release.
3. Bit send route has **no `force=1`** escape hatch.
4. Bit firm-outreach kick is **manual-only** and last succeeded **2026-08-01** — no kick after the 0bed84b deploy.
5. Ops send-now on 2026-08-01 returned `skippedReason: "overlap"` with ready inventory demoted by firm cooldown / duplicates; PSA `sendableReady: 0`.
6. Droid agents (2026-08-03) briefly owned production (`7c33343`), force-cleared locks, and Resend-accepted **7** campaign emails + probes — then bit guard restored `0bed84b`.
7. Resend webhook probe still intermittently **HTTP 504** (kick continues after e8f4eaa on droid; bit may still hard-fail).
8. Cloud agent in this environment: **no** `VERCEL_TOKEN` / `CRON_SECRET` runtime secrets; **cannot** push to bit; **cannot** `workflow_dispatch`.

## Duplicate / obsolete paths

| Path | Status |
|------|--------|
| KV + Resend job queue (`lib/firm-outreach/email-jobs`) | **Canonical** |
| Bit tip without lock release | **Obsolete / harmful while live** |
| Droid tip with lock release + force clear | Correct code; not sticky on production |
| Python `lead_engine` live Resend | Keep dry-run in GHA; import to KV only |
| Supabase outreach tables | Not used |

## Changes implemented (this branch)

1. Port bit SET reindex / kv-scan / PSA sync / revive / doctor scripts into droid.
2. Keep **tokenised lock claim + release** and add **stale ISO/token recovery** so TTL-only bit locks cannot permanently starve cron.
3. `claimKey` accepts Upstash `"OK"` **or** `true`.
4. Add `/api/cron/firm-outreach-psa-sync` + vercel cron slots (11:45 / 15:45 UTC).
5. Nationwide PSA seed (`countyAllowlist: null`) in bootstrap.
6. Operator scripts: `outreach:doctor|dry-run|test-send|process|recover-stale|…`.
7. GitHub Action **Ops — outreach production verify** on `push` to `cursor/outreach-*`: deploy SHA → health match → kick (force clear + probe + flush).
8. Docs updated to match the dual-repo reality.

## Verification checklist

- [ ] `npm run test:outreach` (and run-lock stale recovery test)
- [ ] Push branch → Actions “Ops — outreach production verify” green
- [ ] Production `/api/health` version = this SHA (until bit guard)
- [ ] Kick log contains Resend `messageId` / `accepted > 0`
- [ ] Sync same commit to **bit** `master` (or disable source guard) so the fix sticks
- [ ] Unsubscribe + webhook signature checks still pass
