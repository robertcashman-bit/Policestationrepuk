# Final audit status

**Generated:** 2026-04-03T11:17:18.440Z

## Verdict: **PASS** (static + link scan)

| Criterion | Status |
|-----------|--------|
| Internal string hrefs vs routes | **PASS** — 0 defect(s) |
| Training/resources article links | **PASS** — `/Premium` + `/Wiki` use live wiki data and slugs |
| Search boxes | **PASS** — trim/normalization on directory, firms, map, stations explorer; URL sync on directory/search |
| External URLs on /Resources | **MANUAL** — GOV.UK/Judiciary may block automated HEAD |

## Commands

```bash
npm run build
npm run audit:links
```

## Not run automatically

- Full Playwright crawl (`npm run crawl`)
- Production deployment smoke

