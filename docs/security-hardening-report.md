# Security Hardening Report — PoliceStationRepUK

**Date:** 2026-08-07  
**Branch:** `cursor/security-hardening-uplift-34ef`  
**Status:** **PARTIAL PASS**

---

## 1. Executive summary

PoliceStationRepUK (Next.js 15 / Vercel / Upstash KV / custom magic-code auth) received a defensive security uplift focused on Critical/High issues: unauthenticated Blob logo uploads, PII in runtime logs, OTP codes in email subjects, cron secret comparison, readiness recon leakage, public API scrape bursts, weak HTML sanitisation, and sparse schema validation on public write APIs.

Sibling portfolio apps were also hardened locally:

| Product | Repo | Local branch | Push |
|---------|------|--------------|------|
| PoliceStationRepUK | `robertcashman-bit/Policestationrepuk` | `cursor/security-hardening-uplift-34ef` | This PR |
| Police Station Agent | `robertcashman-bit/policestationagent` | `cursor/security-hardening-uplift-34ef` @ `69d5d283` | **Blocked 403** (bot lacks write) |
| Custody Note (Electron) | `robertcashman-bit/custody-note-app` | `cursor/security-hardening-uplift-34ef` @ `afdba2a0` | **Blocked 403** |
| Custody Note website | — | Not in GitHub under this owner | N/A |
| psrtrain.com | — | No separate repo found | N/A |

---

## 2. Project / framework / platform

| Item | Value |
|------|--------|
| Framework | Next.js 15 App Router, React 19, TypeScript |
| Auth | Magic-code sessions in Upstash KV (`rep_session` httpOnly cookie); admin allowlist |
| Data | Upstash KV (primary), optional Supabase, Vercel Blob (logos), filesystem JSON |
| Host | Vercel (`policestationrepuk-new`) |
| Email / payments | Resend, Lemon Squeezy |
| Bot protection | Optional Cloudflare Turnstile (`ENABLE_TURNSTILE`) |
| Custody Note mobile | **Not in this repo** (promo landing only) |

---

## 3. Security map

- **Public:** directory, search, maps, contact, register (gated), legal-directory submit, station updates, `/api/stations`, `/api/reps/map`
- **Session:** `/Account`, `/api/account/*`, `/api/custody-tips`
- **Admin:** `/admin/*` + `/api/admin/*` via `requireAdmin` (middleware does not auth)
- **Token-gated:** admin decision links, listing manage, outreach approve/unsubscribe
- **Machine:** `/api/cron/*` (`CRON_SECRET`), Resend/Lemon webhooks

---

## 4. Threat model summary

| Priority | Risk | Control applied |
|----------|------|-----------------|
| High | Anonymous Blob logo abuse | Upload token + admin/mgmt auth + magic bytes + rate limit |
| High | PII in logs / weak Supabase RLS | Redacted logs; KV-first submissions; RLS migration SQL |
| High | OTP in email subjects | Generic subjects; code in body only |
| High | Cron secret / recon | Timing-safe compare; `/api/ready` details auth-gated |
| Medium | Directory scraping | Rate limits on `/api/stations` and `/api/reps/map` |
| Medium | XSS via markdown HTML | `isomorphic-dompurify` for Blog + Wiki |
| Medium | Form spam | Tighter register rate limits; honeypot/gate retained |
| Low | CSP CDN surface | Removed unused esm.sh / jsdelivr / unpkg |

---

## 5–7. Findings fixed

### Critical / High
1. Logo upload now requires one-shot upload token, management token, or admin session; magic-byte verification; rate limits.
2. Submissions no longer `console.info` full PII payloads; prefer KV; Supabase RLS SQL shipped.
3. Magic / enquiry codes removed from email subjects.
4. Cron/bootstrap secret compares are timing-safe.
5. `/api/ready` public body is `{ ok, timestamp }` only.

### Medium / Low
6. Public stations/map APIs rate-limited.
7. Zod `.strict()` schemas on contact, auth send/verify, station-update.
8. DOMPurify sanitiser for Blog markdown + Wiki.
9. `Cache-Control: no-store` + noindex for Account, secure-rep-verification, outreach.
10. CSP tightened (removed unused CDNs; `img-src` no longer allows bare `http:`).
11. Register gate/register rate limits reduced (4 / 15 min).

---

## 8. Files changed (this repo)

- `app/api/legal-directory/logo/route.ts`, `logo-token/route.ts`
- `app/api/ready/route.ts`, `stations/route.ts`, `reps/map/route.ts`
- `app/api/contact/route.ts`, `auth/send-code`, `auth/verify-code`, `station-update`
- `app/api/register/gate/route.ts`, `register/route.ts`
- `app/Wiki/[slug]/page.tsx`
- `components/BlogArticleMarkdown.tsx`, `DirectorySubmissionForm.tsx`
- `lib/cron-auth.ts`, `email.ts`, `submissions.ts`
- `lib/sanitize-html.ts`, `image-magic-bytes.ts`, `legal-directory/logo-upload-token.ts`
- `lib/validation/public-forms.ts`
- `next.config.ts`, `package.json`, `package-lock.json`
- `supabase/migrations/20260807_submissions_rls.sql`
- `__tests__/security-hardening.test.ts`, `__tests__/security-headers.test.ts`
- `docs/security-hardening-report.md`, `docs/incident-response.md`

---

## 9. Security controls added

- Logo upload authorisation tokens
- Image magic-byte checks
- Privacy-safe submission logging + KV preference
- Timing-safe cron auth
- Auth-gated readiness details
- Public API rate limits
- Zod schema validation on key public write APIs
- DOMPurify HTML sanitisation
- Private page no-store headers
- `npm run audit:deps`

---

## 10. Tests / checks

| Check | Result |
|-------|--------|
| `vitest` security-hardening + security-headers + cron-auth | **24/24 passed** |
| `npx tsc --noEmit` | **passed** |
| `npm run audit:deps` | **7 high** advisories (next/postcss, sharp, undici, xlsx) — no safe non-breaking fix for all; listed as manual follow-up; do **not** `audit fix --force` without regression testing |

---

## 11. Remaining risks

- Middleware still does not enforce admin auth (page/API gates do).
- CSP still allows `'unsafe-inline'` / `'unsafe-eval'` (Next.js practicality).
- Static guide pages with trusted author HTML via `dangerouslySetInnerHTML` not all migrated to DOMPurify.
- Public directory intentionally exposes rep phone/email (product).
- Turnstile optional when unset (passthrough) — enable in production.
- Sibling repo pushes blocked for this agent identity.
- Dependency advisories (xlsx/sharp/undici/next) remain until carefully upgraded.

---

## 12. Manual actions (platform / DNS / MFA)

See section 15–18 and `docs/incident-response.md`.

---

## 13. Secrets to rotate

No live secrets were found committed in git. If any historical `.env` was ever shared or logged:

- `CRON_SECRET`, `ADMIN_DECISION_TOKEN_SECRET`, `UPSTASH_*`, `RESEND_API_KEY`, `BLOB_READ_WRITE_TOKEN`, `TURNSTILE_SECRET`, Lemon Squeezy secrets, `INTERNAL_API_TOKEN`, Buffer/OpenAI/Serper keys.

Values redacted — rotate in Vercel dashboard.

---

## 14. Environment variables

| Variable | Action |
|----------|--------|
| `ENABLE_TURNSTILE=1` + `TURNSTILE_SECRET` + `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Enable in production for report-profile / secure-rep-verification |
| `ADMIN_EMAILS` / `OWNER_EMAIL` | Confirm allowlist |
| `ADMIN_DECISION_TOKEN_SECRET` | ≥16 chars, unique |
| `CRON_SECRET` | Required in production |
| `BLOB_READ_WRITE_TOKEN` | Required for logo uploads |
| Apply Supabase migration | If Supabase submissions table is live |

---

## 15. DNS / CDN / hosting

- Enforce HTTPS / HSTS at Vercel (already in `next.config.ts`).
- Protect **Preview deployments** (Vercel Authentication).
- SPF / DKIM / DMARC for the Resend sending domain.
- Cloudflare Turnstile host allowlist: `.org`, `.com`, `localhost`.
- Branch protection on `master`; require PR reviews.
- MFA on Vercel, GitHub, Resend, Upstash, Supabase, Cloudflare, domain registrar.

---

## 16. Auth provider settings

- Magic-code only (password admin login already 410).
- Keep admin session TTL at 1 hour.
- Enable MFA on admin mailboxes (email is the second factor surface).

---

## 17. Database / storage

- Apply `supabase/migrations/20260807_submissions_rls.sql` if using Supabase.
- Confirm Vercel Blob cannot list anonymously beyond public object URLs.
- KV session keys: revoke by deleting `session:*` / rotating cookie secret material (new sessions).

---

## 18. Email deliverability

- Confirm SPF/DKIM/DMARC for From domain used by Resend.
- OTPs no longer appear in subjects (lock-screen safer).

---

## 19. Mobile / Custody Note

- Electron app hardened locally on `custody-note-app` (marketing capture gate, safer Outlook compose, log redaction, OpenAI log hygiene). **Push blocked.**
- `custodynote.com` website repository was **not found** under `robertcashman-bit` — harden separately when available.
- `psrtrain.com` has **no separate GitHub repo** in this account.

---

## 20. GDPR / retention

| Data | Store | Retention guidance |
|------|-------|--------------------|
| Contact / registration submissions | KV (90d TTL) / optional Supabase | Review ≤ 12 months; delete when no longer needed |
| Magic codes | KV 10 min | Automatic |
| Sessions | KV 7d rep / 1h admin | Automatic |
| Legal directory listings | KV | Owner delete + admin tools |
| Logs | Vercel | Avoid PII; already redacted in fallbacks |
| Analytics | Vercel / optional GA | No confidential legal notes |

---

## 21. 30-day maintenance plan

1. Week 1: Enable Turnstile in prod; apply Supabase RLS; push sibling branches with a human credential; MFA audit.
2. Week 2: `npm run audit:deps`; review Vercel access; preview protection.
3. Week 3: Spot-check admin decision token email flow; review firm-outreach unsubscribe.
4. Week 4: Re-run security tests; review CSP report-only path if adding third-party scripts.

---

## 21b. Multi-account push fix

Cloud Agents in this environment can only push `robertcashman-bit/Policestationrepuk`.
Sibling hardening for both GitHub accounts is delivered via:

```bash
export GH_TOKEN=ghp_...   # write on bit + droid accounts
./scripts/push-portfolio-security-hardening.sh
```

Patches live in `docs/sibling-hardening-patches/`. Latest agent retry table: [`docs/MULTI_REPO_PUSH_STATUS.md`](MULTI_REPO_PUSH_STATUS.md). Durable fix: Cursor GitHub App on both accounts + environment `repos` list.

## 22. Verdict

**PARTIAL PASS**

- No known unaddressed Critical issue remains in this codebase after the uplift.
- Meaningful High issues fixed and regression-tested.
- Manual platform/DNS/MFA/sibling-push/Custody Note website remain outside verified code control.
