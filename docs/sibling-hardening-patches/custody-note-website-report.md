# Security hardening report

Date: 2026-08-07  
Branch: `cursor/security-hardening-uplift-34ef`

This document records defensive hardening applied to the Custody Note marketing/API site and notes gaps relative to production Electron client expectations.

## Changes applied

### Rate limiting (in-memory)

Per-IP fixed-window limits on sensitive API routes:

| Route | Limit | Window |
|-------|-------|--------|
| `POST /api/licence/validate` | 30 | 1 min |
| `POST /api/trial` | 10 | 1 min |
| `POST /api/trial/validate` | 30 | 1 min |
| `GET /api/trial/validate` (deprecated) | 30 | 1 min |
| `POST /api/backup/credentials` | 20 | 1 min |
| `POST /api/backup/list` | 20 | 1 min |

Implementation: `src/lib/rate-limit.ts`. Buckets reset on serverless cold starts; this is a first-line control, not a substitute for edge/WAF rate limits in production.

### Licence validate — reduced PII exposure

- Subscriber and trial **email is no longer returned** in JSON responses.
- Error paths log only generic messages (no licence keys or emails in `console.error` context).

Clients that relied on `email` from validate should obtain it from the local app state or a separate authenticated channel.

### Trial validate — POST preferred

- **Preferred:** `POST /api/trial/validate` with JSON body `{ "key": "..." }` so keys do not appear in query strings, proxy logs, or Referer headers.
- **Deprecated:** `GET /api/trial/validate?key=...` remains for older Electron builds; responses include `Deprecation: true` and `Sunset` headers. New clients must use POST.

### Backup list — licence state alignment

`POST /api/backup/list` now rejects **expired** and **revoked** licences with `403`, matching `POST /api/backup/credentials`.

### Contact form logging

`POST /api/contact` logs subject and field lengths only; name, email, and message body are not written to stdout.

### Security headers (`next.config.js`)

Global response headers:

- `Strict-Transport-Security` (production)
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Content-Security-Policy` (baseline for static/marketing site)
- `Permissions-Policy` (restricts camera, microphone, geolocation, etc.)

## Incomplete API surface vs Electron production expectations

The website repo exposes a **subset** of APIs the full Custody Note Electron product may call in production. The following are **not** fully addressed in this pass and should be tracked separately:

| Area | Gap |
|------|-----|
| **Authentication** | Licence key in request body is the only gate; no device binding, signed tokens, or mutual TLS. |
| **Rate limiting** | In-memory only; multi-instance and cold-start bypass possible. Prefer Vercel Firewall / Upstash Redis for shared limits. |
| **Trial validate GET** | Still supported for backward compatibility; residual risk of key leakage via logs until Electron ships POST-only. |
| **Backup credentials** | STS session scope and rotation policies live in `src/lib/aws.ts`; not audited here. |
| **Stripe webhooks** | Signature verification exists; idempotency and replay windows not re-reviewed. |
| **KV data** | Trial/paid records store email server-side; access control is route-level only. |
| **CSP** | Baseline policy may need tightening if inline scripts or third-party widgets are added. |
| **Audit logging** | No structured security audit trail for validate/backup access. |
| **Electron update channel** | Download/update integrity (code signing, update manifest) is outside this repo. |

## Recommended follow-ups

1. Ship Electron update using `POST /api/trial/validate`; remove GET after adoption window.
2. Move rate limits to a shared store (e.g. Vercel KV / Upstash) keyed by IP + route.
3. Add optional `Authorization` or HMAC request signing for backup and validate endpoints.
4. Wire contact form to Resend/SendGrid without logging message content.
5. Periodic dependency audit (`npm audit`) and Stripe/AWS IAM least-privilege review.
