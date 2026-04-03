# Lighthouse Scores — 3 April 2026

Run against **production** (`https://policestationrepuk.org`) using Lighthouse 12.6.1 with Chrome 146 headless.

| Page | Performance | Accessibility | Best Practices | SEO |
|------|-------------|---------------|----------------|-----|
| `/` (Home) | **87** | **96** | **100** | **92** |
| `/directory` | **69** | **96** | **96** | **92** |
| `/Blog/what-does-a-freelance-police-station-representative-do` | **86** | **96** | **100** | **92** |

## Thresholds (from `lighthouserc.json`)

| Category | Threshold | Result |
|----------|-----------|--------|
| Performance | warn < 75 | Home 87, Blog 86 PASS; Directory 69 WARN |
| Accessibility | warn < 90 | All 96 PASS |
| Best Practices | warn < 90 | All 96–100 PASS |
| SEO | warn < 90 | All 92 PASS |

## Notes

- **Directory performance (69):** The `/directory` page loads the full rep search component with county data; the lower perf score is primarily LCP from the search UI hydration. Could be improved with lazy-loading the search panel or skeleton placeholder.
- **Windows EPERM on cleanup:** Lighthouse exits with code 1 after writing results due to a Chrome temp-directory permission issue on Windows/OneDrive. The JSON reports are still written correctly. Run in WSL or CI to avoid this.
- Raw JSON reports saved to `audit/lighthouse-home.json`, `audit/lighthouse-directory.json`, `audit/lighthouse-blog.json`.
