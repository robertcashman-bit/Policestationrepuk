/**
 * Failure inventory — Buffer posting reliability (2026-06-14 investigation)
 *
 * Architecture: Production cron uses `@robertcashman/buffer-engine` (local REPUK
 * blog only). Manual `npm run buffer:schedule` now matches that path.
 * Legacy multi-feed is `npm run buffer:schedule-legacy`.
 */

# Buffer failure inventory

| Error type | Frequency | First seen | Components | Root cause | Fix |
|------------|-----------|------------|------------|------------|-----|
| GBP WebP / disallowed image | Recurring historically | Pre-2026 | image-url, gbp-preflight, blog heroes | WebP heroes not accepted by GBP | JPEG companions + preflight + hosted GBP defaults — **fixed** |
| Rate limit / Too many requests | Bulk seo-growth scheduling | 2026-06-14 | client GraphQL, seo-growth scripts | Burst createPost volume | Retries + backoff + slow retry script — **mitigated** |
| Missing image aborts whole batch | Code-level risk | Engine scheduler | `runSiteBufferScheduler` | `return ok:false` on first bad image | **Skip bad posts, continue batch** (this change) |
| Dual scheduler (cron ≠ npm) | Ops risk | Engine migration | cron vs `buffer:schedule` | Legacy multi-feed vs engine | **npm schedule → engine**; legacy renamed |
| buffer-health not cron'd | Doc drift | buffer-ops.md | vercel.json | Route existed, not scheduled | **Registered Mon 06:00 UTC** |
| Partial success with ok:true under-quota | Possible | engine scheduler | schedule result | Some posts fail mid-batch | ok requires quota; errors array; verify gap-fill |
| Fake postId `already-scheduled-in-buffer` | seo-growth retry | retry script | results JSON | Sentinel ID for duplicates | Sync script; reconcile flags sentinels |
| Cron skip (already scheduled) | Daily | KV run lock | buffer-blog-posts | Idempotent day lock | By design; force/replace-today |
| PSA RSS 403 | Intermittent | Feeds | rss-fetch | Datacenter IP block | Proxy feed — **mitigated** |
| Cooldown exhaustion | Small pools | bandit selection | engine | pool < posts×cooldown | Bypass + reconcile — **mitigated** |

## Silent / incomplete batch risks addressed

1. One invalid attachment no longer aborts remaining posts (engine).
2. Attempt records + admin diagnostics for expected vs accepted.
3. Historical reconcile dry-run classifies under-quota / missing IDs / attachment repair.
4. Weekly GBP health cron restored.

## Remaining external blockers

- Buffer API rate limits cannot be eliminated; only paced and retried.
- Sister-site blogs must be published before their Buffer social URLs work.
- Facebook channel not in default Buffer config — CSV rows only.
