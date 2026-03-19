# Visual parity tooling

Pixel-compare **policestationrepuk.com** vs **policestationrepuk.org** using Playwright + `pixelmatch` + `pngjs`.

## Commands

```bash
# Install browser binaries first (included in npm script)
npm run visual-parity

# Limit pages (recommended for dev)
$env:VISUAL_PARITY_MAX=40; npm run visual-parity   # PowerShell
VISUAL_PARITY_MAX=40 npm run visual-parity         # bash

# Custom URLs
$env:VISUAL_PARITY_SOURCE='https://www.policestationrepuk.com'; $env:VISUAL_PARITY_TARGET='https://policestationrepuk.org'; npm run visual-parity
```

## Outputs

- `screenshots/source/*.png` — source viewport captures  
- `screenshots/target/*.png` — target captures  
- `screenshots/diff/*.png` — magenta diff channels  
- `docs/visual-parity-report.json` — machine-readable  
- `docs/VISUAL-PARITY-REPORT.md` — human summary  

## Stabilisation

- Fixed viewport (1366×900), `networkidle`, scroll-to-top, injected CSS to disable animations/transitions.  
- `[data-parity-mask]` hides the target cookie bar & help bubble for fairer compares (see `components/CookieBanner.tsx`, `HelpChatButton.tsx`).  
- Optional extra selectors: `VISUAL_PARITY_MASK="#id,.class"`.

## Thresholds (env)

| Variable | Default | Meaning |
|----------|---------|---------|
| `VISUAL_PARITY_WARN_RATIO` | `0.02` | Warn in report above this diff ratio |
| `VISUAL_PARITY_FAIL_RATIO` | `0.12` | Count as **critical** page failure |
| `VISUAL_PARITY_PIXEL_THRESHOLD` | `0.12` | `pixelmatch` colour sensitivity |
| `VISUAL_PARITY_MAX` | `0` (= all in-scope) | Cap number of paths |

Wix vs Next.js will often exceed 12% on full pages until templates converge; tighten thresholds once UI is closer.

## Route list

Paths come from `docs/live-site-map.json` with the same **noise filter** as `scripts/parity-verify.ts` (`lib/parity-crawl-noise.ts`). Priority templates are listed in `scripts/visual-parity.config.ts`.
