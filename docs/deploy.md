# Production deploy — PoliceStationRepUK

## Source of truth

| Role | Value |
|------|--------|
| **Git remote for production** | `origin` → `https://github.com/robertcashman-bit/Policestationrepuk` |
| **Production branch** | `master` |
| **Vercel project** | `policestationrepuk-new` (`prj_lZ0zL8uq5cBDFosKovyF0n8FmlCn`) |
| **Live site** | https://policestationrepuk.org |

The `droid` remote (`robertdavidcashman-droid/Policestationrepuk`) is **read-only** for this workflow. Do not push there for production — Vercel must stay linked to **robertcashman-bit**.

If production health (`/api/health` → `version`) shows a SHA that only exists on `droid`, re-run **Ops — RepUK Vercel git link (bit)** (`.github/workflows/ops-repuk-vercel-git-link.yml`) to unlink droid, link bit, and promote `master`.

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
