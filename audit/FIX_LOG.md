# Fix log (generated)

Generated: 2026-04-03T11:17:18.440Z

| File | Issue | Root cause | Fix applied |
|------|--------|------------|-------------|
| app/Map/page.tsx | Search could treat whitespace as query | No trim on `searchQuery` | Trim before lowercasing and filtering |
| components/FirmDirectory.tsx | Search/filter state inconsistent for spaces-only | Raw `query` without trim | `query.trim()` for filter and active-filter detection |
| components/DirectorySearch.tsx | Station text filter too aggressive | Empty/space `station` still passed to `.includes` | `station.trim()` before filtering reps |

## Prior fixes (resources / navigation)

- `/Premium` uses `WikiArticleIndex` + `getAllWikiArticles()` — cards link to `/Wiki/[slug]`.
- `/Resources` internal career cards use `next/link`.
- Primary CTAs and footer training spotlight point to `/Wiki` where appropriate.

