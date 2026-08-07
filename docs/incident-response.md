# Incident response checklist — PoliceStationRepUK

Defensive operational steps. Do not store client-identifiable legal notes in tickets or chat when investigating.

## 1. Rotate secrets

In Vercel → Project → Settings → Environment Variables (Production + Preview):

1. Generate new values for compromised secrets (`CRON_SECRET`, `ADMIN_DECISION_TOKEN_SECRET`, `UPSTASH_*`, `RESEND_*`, `BLOB_READ_WRITE_TOKEN`, Lemon Squeezy, Buffer, OpenAI, Serper, `INTERNAL_API_TOKEN`, Turnstile).
2. Redeploy production after rotation.
3. Update any external cron/webhook dashboards with the new secrets.
4. Revoke old Resend API keys / Lemon webhook secrets at the provider.

## 2. Disable compromised accounts

1. Remove the email from `ADMIN_EMAILS` / `OWNER_EMAIL`.
2. Delete Upstash keys matching `session:*` for that user if identifiable, or flush all `session:*` and force re-login.
3. Delete outstanding `magic:*` codes for the email.

## 3. Revoke sessions

- Upstash: delete `session:<token>` keys (or flush session prefix).
- Users must request a new magic code.
- Admin sessions expire in 1 hour by design.

## 4. Review logs

- Vercel → Deployments → Functions / Runtime Logs.
- Resend → Emails (delivery only; avoid exporting full bodies unnecessarily).
- Look for spikes on `/api/auth/*`, `/api/register/*`, `/api/legal-directory/logo`, `/api/contact`, `/api/cron/*`.

**Do not** paste full custody notes, DSCC PINs, or client messages into shared channels.

## 5. Disable public forms temporarily

Options (fastest first):

1. Set `DISABLE_KV_FOR_AUDIT=1` only for emergency offline of KV-backed flows (breaks login — use carefully).
2. Remove/rotate `RESEND_API_KEY` to stop outbound mail (forms may still accept).
3. Deploy a temporary maintenance message on Contact/Register pages via a hotfix PR.
4. At CDN/WAF: challenge or block `/api/contact`, `/api/register`, `/api/legal-directory/*`.

## 6. Restore from backup

- Directory JSON in git + Vercel deployments.
- KV: no automatic point-in-time restore unless Upstash backup is configured — document recovery expectations with Upstash support.
- Blob logos: Vercel Blob dashboard.

## 7. Hosting / platform support

- Vercel support / status page
- Upstash support
- Resend support
- Domain registrar / DNS

## 8. Preserve evidence without exposing client data

1. Export relevant log windows with redaction (emails → hashes, strip message bodies).
2. Note timestamps (UTC), IPs (if needed for abuse), route paths, status codes.
3. Snapshot Vercel deployment ID and git SHA.
4. Do not download full submission payloads into personal devices unless encrypted and necessary.
