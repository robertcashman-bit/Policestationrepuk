# Production deploy — PoliceStationRepUK

## Source of truth

| Role | Value |
|------|--------|
| **Git remote for production** | `origin` → `https://github.com/robertcashman-bit/Policestationrepuk` |
| **Production branch** | `master` |
| **Vercel project** | `policestationrepuk-new` (`prj_lZ0zL8uq5cBDFosKovyF0n8FmlCn`) |
| **Live site** | https://policestationrepuk.org |

The `droid` remote (`robertdavidcashman-droid/Policestationrepuk`) is **read-only** for this workflow. Do not push there for production — Vercel must stay linked to **robertcashman-bit**.

If production health (`/api/health` → `version`) shows a SHA that only exists on `droid`:

1. Merge/disable deploys on the droid mirror (it must not run `Deploy to Vercel (production)` — that workflow shares `VERCEL_*` secrets and overwrites bit).
2. Re-run **Ops — RepUK Vercel git link (bit)** if the Vercel project git link is wrong.
3. **Ops — production source guard** polls every 5 minutes: re-links the Vercel project to `robertcashman-bit`, promotes bit `master`, and holds the alias through a short soak.
4. `vercel.json` `ignoreCommand` (`scripts/vercel-ignore-non-bit.sh`) skips production builds whose git owner is not `robertcashman-bit`, so droid-linked auto-deploys cannot become production.
5. **Disable on the droid mirror** (`robertdavidcashman-droid/Policestationrepuk`): workflow **Ops — production outreach hold** (and ideally **Deploy to Vercel (production)**). It shares the same `VERCEL_*` secrets and re-promotes droid tip `d79d2c6` every few minutes, racing bit’s source guard. Bit alone cannot turn that workflow off.

Backup of the previous bit `master` tip (before prod-sync): branch `backup/bit-master-pre-prod-sync`.

## How deploy works

```text
git push origin master
  → GitHub Actions CI (build / audit)
  → vercel-deploy-hook promotes production
```

Immediate promote (bypass waiting for the hook):

```bash
npm run deploy:vercel
# or
npm run deploy -- --vercel
```

## Agent / operator command

```bash
# On master, clean tree:
npm run deploy
```

This runs `tsc --noEmit`, then `git push origin HEAD`. CI + the deploy hook finish the rest.

Flags:

- `--skip-push` — typecheck only
- `--vercel` — also run `vercel deploy --prod` after push

## One-time Vercel GitHub app note

If git-connected deploys fail after a relink, grant the Vercel GitHub app access to `robertcashman-bit/Policestationrepuk` in the Vercel dashboard (Git settings), then re-run `npm run deploy:vercel`.
