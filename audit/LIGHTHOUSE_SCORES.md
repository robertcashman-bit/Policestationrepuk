# Lighthouse Scores — 3 April 2026

Run against **production** (`https://policestationrepuk.org`) using Lighthouse 12.6.1 with Chrome 146 headless.

## Current scores (post-optimization)

| Page | Performance | Accessibility | Best Practices | SEO |
|------|:-----------:|:-------------:|:--------------:|:---:|
| `/` (Home) | **67** | **100** | **100** | **100** |
| `/directory` | **58** | **100** | **100** | **100** |
| Blog post | **72** | **100** | **100** | **100** |

## Before / after comparison

| Category | Before | After | Change |
|----------|--------|-------|--------|
| **Accessibility** (home) | 96 | **100** | +4 |
| **Accessibility** (directory) | 96 | **100** | +4 |
| **Accessibility** (blog) | 96 | **100** | +4 |
| **SEO** (all pages) | 92 | **100** | +8 |
| **Best Practices** (directory) | 96 | **100** | +4 |
| **CLS** (home) | 0.118 | **0** | fixed |
| **DOM** (home) | 1,861 | **968** | -48% |

## Fixes applied

1. **CLS 0.118 → 0**: CustodyNote top banner now renders with reserved space instead of appearing after hydration (eliminated layout shift).
2. **Accessibility 96 → 100**: Added `--gold-link` CSS variable (`#92400e`, 6.2:1 contrast on white) for link text on light backgrounds. Changed `text-slate-400` to `text-slate-500` on directory. Removed `content-visibility: auto` from dark-background sections that caused false contrast failures.
3. **SEO 92 → 100**: Changed all generic "Learn more" link text to descriptive "About CustodyNote" / "Accreditation requirements".
4. **Best Practices 96 → 100** (directory): Removed reference to missing `grid.svg`, replaced with CSS gradient pattern.
5. **DOM 1,861 → 968**: Replaced 895-element `<select>` station dropdown on homepage with a text search input.

## Notes

- **Performance scores** vary 50–90 between runs due to local machine CPU contention (Lighthouse runs Chrome locally). The key metrics improved: CLS fixed (was 0.118), DOM halved. TBT remains variable (~160–980ms) depending on system load.
- **Directory performance (50–69)**: TBT dominated by `DirectorySearch` client component hydrating ~250 reps with filtering. Future improvement: virtualize the results list or defer hydration.
- **Windows EPERM on cleanup**: Lighthouse exits with code 1 after writing results due to Chrome temp-dir permission issue on Windows/OneDrive. JSON reports are still written correctly.
