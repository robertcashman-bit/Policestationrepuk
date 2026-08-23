# Police Station Agent — cross-digest RepUK branding

**Date:** 2026-08-23  
**Scope:** `robertcashman-bit/policestationagent` morning/evening cross-workspace digest  
**Patch:** `policestationagent-cross-digest-repuk-brand.patch`

## Problem (live 23 Aug 2026)

`[Outreach digest] Morning` emails arrive From **Police Station Agent &lt;noreply@policestationrepuk.org&gt;** and treat PSA as a live send workspace with a **5000** daily cap and ready queue (e.g. 27), beside RepUK.

That cron lives on **policestationagent.com** (`/api/cron/firm-outreach-cross-digest`), not on RepUK. RepUK's 07:00 daily report already states PSA send is permanently disabled.

## Fix

- Digest `from:` defaults to `PoliceStationRepUK <noreply@policestationrepuk.org>` (override via `FIRM_OUTREACH_DIGEST_FROM_EMAIL`)
- PSA row is `liveSend: false` — no cap / ready queue / recipients listed
- Subject and body lead with PoliceStationRepUK only

## Apply

```bash
cd /path/to/policestationagent
git apply /path/to/Policestationrepuk/docs/sibling-hardening-patches/policestationagent-cross-digest-repuk-brand.patch
# or: patch -p1 < ...
npm test -- __tests__/firm-outreach-cross-digest.test.ts
```

This Cloud Agent cannot push to `policestationagent` (token scoped to RepUK only). Use `PORTFOLIO_PUSH_PAT` + Portfolio security hardening workflow, or apply manually.

**Do not** re-enable PSA firm outreach sends when applying this patch.
