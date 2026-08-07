# Security Hardening Report — PSR Train (psrtrain.com)

**Date:** 2026-08-07  
**Branch:** `cursor/security-hardening-uplift-34ef`  
**Scope:** `/tmp/sibling-repos/psrtrain` (Next.js training platform)  
**Overall verdict:** **PARTIAL PASS**

---

## Executive summary

This uplift closes high-impact gaps where anonymous PostgREST clients could read MCQ answer keys and paid module bodies, unauthenticated callers could end arbitrary session records, cron secrets were compared with a non-constant-time check, and admin pages lacked `Cache-Control: no-store`. Contact and newsletter error paths now redact PII before logging.

**Manual step required:** apply `supabase/migrations/0006_paid_content_rls.sql` in the Supabase SQL editor. Until then, production RLS remains permissive for approved questions.

| Area | Status | Notes |
|------|--------|-------|
| RLS — questions / modules / CIT / PACE | **PENDING DEPLOY** | Migration shipped; must run in Supabase dashboard |
| `/api/access/verify` rate limit + timing-safe code | **PASS** | 10 attempts / min per IP |
| `/api/auth/logout-track` auth | **PASS** | Session owner or `ADMIN_EMAILS` only |
| Cron `CRON_SECRET` comparison | **PASS** | `crypto.timingSafeEqual`; fail closed in production |
| PII in contact/newsletter logs | **PASS** | `lib/safe-log.ts` redacts emails and sensitive keys |
| `/admin` Cache-Control | **PASS** | `no-store, no-cache, must-revalidate, private` |
| Vitest regression tests | **PASS** | `tests/unit/security-hardening.test.ts` |

---

## 1. RLS — paid training content (`0006_paid_content_rls.sql`)

### Finding

`scripts/setup.sql` policy **"Approved questions are visible to all"** allowed the anon Supabase key to `SELECT` full rows including `correct_answer` and `explanation`. `content_modules`, `cit_scenarios`, and `pace_code_sections` were readable by any authenticated user regardless of subscription.

### Fix

New migration (idempotent):

- `has_paid_training_access()` — checks `customer_access` for active/grace paid row linked to `auth.uid()` or JWT email.
- `is_app_admin()` — checks `public.users.role = 'admin'`.
- `can_access_paid_training_content()` — authenticated AND (paid OR admin).
- Replaces permissive SELECT policies on questions, modules, CIT scenarios, and PACE sections.
- `approved_question_count()` SECURITY DEFINER RPC — count-only for homepage stats (no answer leakage).

### Apply in Supabase

1. Open **Supabase Dashboard → SQL Editor**.
2. Paste the full contents of `supabase/migrations/0006_paid_content_rls.sql`.
3. Click **Run**.
4. Verify: `npm run audit:supabase-rls` (requires `SB_PAT` in `.env.local`).

### Residual risk

- `FREE_ACCESS_UNTIL` / `FREE_ACCESS_ENABLED` and `ADMIN_EMAILS` env overrides are **app-layer only**; RLS does not mirror them. Staff listed only in `ADMIN_EMAILS` need `users.role = 'admin'` or a `customer_access` row for direct client queries.
- Migration not applied until operator runs SQL manually.

---

## 2. Access gate brute force (`/api/access/verify`)

### Finding

Codeword verification used `===` (timing side-channel) and had no rate limit.

### Fix

- Per-IP limit: 10 POSTs / minute → HTTP 429.
- `crypto.timingSafeEqual` codeword comparison.

---

## 3. Session logout tracking (`/api/auth/logout-track`)

### Finding

Any caller could POST a `sessionId` and mark another user's session logged out (session fixation / presence spoofing).

### Fix

- Requires authenticated Supabase user.
- Non-admins may only end sessions they own (`user_sessions.user_id = auth.uid()`).
- Admins (`ADMIN_EMAILS`) may end any session (admin live view).

---

## 4. Cron authentication (`lib/auth/api-guards.ts`)

### Finding

`isCronRequestAuthorized` compared `Authorization: Bearer …` with `===`.

### Fix

- `timingSafeEqualStrings` for `Authorization` bearer and `x-cron-secret`.
- Unset `CRON_SECRET` in production still returns `'misconfigured'` (503 on cron routes).

---

## 5. PII in logs (contact / newsletter)

### Finding

Resend error objects can echo subscriber email addresses into `console.error`.

### Fix

- `lib/safe-log.ts` — `safeErrorLog()` redacts emails and sensitive keys.
- Wired in `app/api/contact/route.ts` and `app/api/newsletter/route.ts`.

---

## 6. Admin cache headers (`next.config.mjs`)

### Finding

`/admin/*` had `X-Robots-Tag` but no `Cache-Control`, allowing shared-cache retention of authenticated admin HTML on misconfigured proxies.

### Fix

Added `Cache-Control: no-store, no-cache, must-revalidate, private` for `/admin/:path*`.

---

## 7. Files changed

| File | Change |
|------|--------|
| `supabase/migrations/0006_paid_content_rls.sql` | Paid-content RLS + count RPC |
| `lib/auth/api-guards.ts` | Timing-safe cron auth |
| `lib/rate-limit.ts` | Shared per-IP rate limiter |
| `lib/safe-log.ts` | PII redaction for logs |
| `lib/question-count.ts` | Service-role / RPC for marketing count |
| `app/api/access/verify/route.ts` | Rate limit + timing-safe gate code |
| `app/api/auth/logout-track/route.ts` | Auth + session ownership |
| `app/api/contact/route.ts` | Shared rate limit + safe logging |
| `app/api/newsletter/route.ts` | Shared rate limit + safe logging |
| `next.config.mjs` | Admin `Cache-Control: no-store` |
| `tests/unit/security-hardening.test.ts` | Regression tests |
| `docs/security-hardening-report.md` | This report |

---

## 8. Tests

```bash
npm run test:unit -- tests/unit/security-hardening.test.ts
```

Also run existing `tests/unit/security-headers.test.ts` — no regressions expected.

---

## 9. Out of scope / follow-ups

- Column-level masking view for unpaid authenticated users (currently blocked entirely at RLS).
- Upstash-backed rate limits (in-memory resets on serverless cold start).
- `FREE_ACCESS` promo mirrored in SQL policies.
- E2E verification against live Supabase after migration apply.

---

## 10. Verdict rationale (PARTIAL PASS)

Code and tests ship in-repo. **Production security for answer keys depends on applying migration 0006 in Supabase** — automated deploy does not run SQL migrations. Until applied, anon clients can still read approved question rows via PostgREST.
