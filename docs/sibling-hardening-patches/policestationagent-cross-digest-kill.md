# Sibling note — PSA morning/evening cross-digest still emails Robert

**Date:** 2026-08-28  
**RepUK change:** Firm outreach *email* product permanently killed on this repo (sends + operator digests/reports + admin UI). See `lib/firm-outreach/site-config.ts` (`FIRM_OUTREACH_EMAIL_PERMANENTLY_DISABLED`).

## Still live on policestationagent

`[Outreach digest] Morning — PoliceStationRepUK` is sent by **policestationagent.com** cron `/api/cron/firm-outreach-cross-digest`, not by RepUK.

RepUK alone cannot stop that mail. Apply a permanent early-return / remove that cron on the PSA sibling when Robert wants zero operator outreach mail from either site.

Do **not** re-enable PSA or RepUK firm outreach email sends when applying sibling patches.
