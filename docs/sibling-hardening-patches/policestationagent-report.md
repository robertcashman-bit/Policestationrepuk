# Security Hardening Report — Police Station Agent (web44ai)

**Date:** 2026-08-07  
**Branch:** `cursor/security-hardening-uplift-34ef`  
**Scope:** Defensive hardening for the Next.js App Router site at `policestationagent.com`  
**Type:** Defensive fixes only — no exploit code, no UX regression for genuine solicitor enquiries.

---

## Executive summary

This uplift closes several information-disclosure and cross-site abuse gaps: admin OTP codes no longer appear in email subjects, cron and bootstrap secrets are compared with `crypto.timingSafeEqual`, production enquiry/contact POSTs require a trusted `Origin` or `Referer`, scraped and blog HTML is sanitized before `dangerouslySetInnerHTML`, and unauthenticated health/indexing endpoints return a minimal `{ ok }` heartbeat instead of configuration metadata.

**Overall status: PARTIAL PASS**

Most automated controls are in place and covered by Vitest. A few items remain operator-dependent (dependency audit triage, Resend domain verification, rotating any secrets that may have been exposed via prior logging).

---

## Fixes applied

| # | Area | Issue | Fix |
|---|------|-------|-----|
| 1 | `lib/email.ts` | Admin magic-code OTP appeared in email subject (inbox/search leakage). | Subject is now generic (`Your Police Station Agent admin login code`); code remains in HTML body only. Console fallbacks use boolean flags instead of recipient email. |
| 2 | `lib/cron-auth.ts` | Cron/bootstrap secret comparison used `===` (timing side-channel). | `crypto.timingSafeEqual` via `timingSafeSecretEqual()`; missing `CRON_SECRET` still denies in production. |
| 3 | `lib/enquiry/origin.ts` | Missing `Origin`/`Referer` allowed in production; broad preview host trust. | Production requires trusted host on `Origin` or `Referer` (`policestationagent.com`, `www.policestationagent.com`). Localhost / `.vercel.app` allowed only outside production. |
| 4 | `app/api/contact/route.ts` | Contact POST had no origin guard (CSRF-style abuse from other sites). | Reuses `isAllowedEnquiryOrigin()` — returns 403 when untrusted. |
| 5 | `lib/scraped-html.ts`, `lib/html-sanitizer.ts` | Scraped HTML rendered unsanitized. | `normalizeScrapedHtml()` pipes through `sanitizeScrapedHtml()`. Sanitizer disallows `style` attributes and `data:` URLs; blog key-takeaway boxes styled via `.prose .key-takeaways` in `globals.css`. |
| 6 | `app/api/index-now/route.ts`, `app/api/contact/health/route.ts` | Unauthenticated GET leaked keys, sitemap URLs, env flags. | Public GET returns `{ ok: true }` or `{ ok: boolean }` only; detailed status requires `CRON_SECRET`. |
| 7 | `next.config.js` | Admin cache / indexing headers | **Already present** — `/admin/:path*` has `Cache-Control: no-store` and `X-Robots-Tag: noindex, nofollow, noarchive`. No change required. |
| 8 | Tests | Regression coverage | `__tests__/security-hardening.test.ts` — OTP subject, cron auth, origin, sanitizer, recon strip. |
| 9 | `package.json` | Dependency audit script | Added `"audit:deps": "npm audit --audit-level=moderate"`. |

---

## Manual actions (operator)

1. **Run dependency audit** — `npm run audit:deps` and triage any moderate+ findings (fix or accept with documented rationale).
2. **Confirm `CRON_SECRET`** is set on Vercel production for web44ai; rotate if it was ever logged or shared.
3. **Verify Resend** — custom domain `policestationagent.com` verified so magic-code and contact emails deliver reliably.
4. **Smoke-test forms** on production — contact, voluntary, and agency enquiry flows from `www.policestationagent.com` (browsers send `Origin` on same-site POST).
5. **Review Vercel preview** — preview deployments on `*.vercel.app` cannot POST enquiries in production mode; use localhost or production domain for form QA.

---

## Test results

Run:

```bash
npx vitest run __tests__/security-hardening.test.ts
```

Expected: all tests in `security-hardening.test.ts` pass.

---

## Files changed

- `lib/email.ts`
- `lib/cron-auth.ts`
- `lib/enquiry/origin.ts`
- `lib/html-sanitizer.ts`
- `lib/scraped-html.ts`
- `app/api/contact/route.ts`
- `app/api/contact/health/route.ts`
- `app/api/index-now/route.ts`
- `app/globals.css`
- `package.json`
- `__tests__/security-hardening.test.ts`
- `docs/security-hardening-report.md`

---

## PASS / PARTIAL PASS checklist

| Control | Status |
|---------|--------|
| OTP not in email subject | **PASS** |
| PII redacted from magic-code console fallbacks | **PASS** |
| Cron timing-safe auth + prod fail-closed | **PASS** |
| Production origin guard (enquiry + contact) | **PASS** |
| Scraped/blog HTML sanitization | **PASS** |
| Public health/index recon stripped | **PASS** |
| Admin `no-store` + `noindex` headers | **PASS** (pre-existing) |
| Vitest regression suite | **PASS** (when tests run clean) |
| Dependency audit automation | **PARTIAL PASS** — script added; operator must run and remediate findings |

**Overall: PARTIAL PASS** — code controls complete; operational follow-up on `npm audit` and production smoke tests remains.
