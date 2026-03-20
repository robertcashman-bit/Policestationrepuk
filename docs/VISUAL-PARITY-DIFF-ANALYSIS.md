# Visual parity — diff analysis notes (manual)

**Status:** This file is **not** overwritten by `npm run visual-parity`. Use it to record findings between runs.

## Blocker: diff PNGs not in repo

The parity harness writes to `screenshots/source/`, `screenshots/target/`, `screenshots/diff/`, but **those PNGs are not present in git** (empty / `.gitignore`). **Phase-1 cluster analysis from images cannot be performed in CI or by agents without those files.**

**Action:** After a local run, either:

- commit `screenshots/diff/*.png` for the priority routes, **or**
- attach the worst `home.png` / `directory.png` / `search.png` diffs to the review ticket.

## What the last JSON report *does* show (`docs/visual-parity-report.json`)

Run timestamp in `VISUAL-PARITY-REPORT.md`: **2026-03-19**. Snapshot:

| Route | Diff % | Notes |
|-------|--------|--------|
| `/` (home) | **~34.6%** | Priority #1 |
| `/Directory` | **~34.2%** | Same hub as `/directory` case-variant |
| `/directory` | **~39.0%** | Lowercase route |
| Others | **41–70%** | Content/templates differ more (Resources, FAQ, Blog, …) |

**Target in that run:** `http://127.0.0.1:3000` (see report table), **not** necessarily production `https://policestationrepuk.org`. Re-run with:

```bash
set VISUAL_PARITY_TARGET=https://policestationrepuk.org
npm run visual-parity
```

## Shared causes (inferred — **not** from pixels)

Until diff images are available, these are **hypotheses consistent with 30%+ viewport diffs**:

1. **Platform stack** — Source is **Wix**; target is **Next.js + Tailwind**. Layout, typography rasterisation, and anti-aliasing will differ at nearly every pixel even when structure matches.
2. **Fonts** — Inter (target) vs Wix font stack (source): sub-pixel text differs across large regions → inflated `%`.
3. **Dynamic content** — Rep counts, featured blocks, blog cards, etc. shift height and mid-page alignment.
4. **Target-only chrome** — Floating share/top stack and help chat appear in viewport corner **only on target** → guaranteed diff unless masked (`data-parity-mask` + stabilisation CSS).
5. **Capture height** — Viewport **900px** (not full page): long pages still only compare the **first fold**; mismatched hero height dominates.

## Code changes aimed at measurable parity noise reduction (2026-03)

- **`document.fonts.ready`** before screenshot (both browsers) — reduces font-swap drift.
- **`data-parity-mask`** on **`FloatingDirectoryActions`** wrapper — removes target-only controls from pixels under strict masking rules.

## Honest PASS/FAIL

- **Cannot claim** “homepage diff reduced to threshold” **without a new run** and committed/attached diff PNGs.
- Prior **FAIL** is **structural + platform + content**, not only spacing. Crossing **12% fail** on *all* pages with pixelmatch is expected until masks + comparable fonts/regions are aligned or comparison scope is narrowed.

## Next steps (precision)

1. Re-run visual parity against **`VISUAL_PARITY_TARGET=https://policestationrepuk.org`**.
2. Open `screenshots/diff/home.png` (or `__.png` for `/`) and classify **top / mid / bottom** clusters; record paths in this file.
3. Prefer **shared** fixes: container, section tokens, typography tokens, card/button tokens — already centralised in `app/globals.css`.
4. If diff remains > threshold after masking + fonts: consider **region-based compare** (hero crop only) as a *separate* metric — only if product agrees (changes definition of “parity”).
