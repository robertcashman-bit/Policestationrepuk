# Police station data sources

## Tier 1 — official / high authority

| Source | How used |
|--------|----------|
| Territorial force websites (`*.police.uk`) | Official page registry + `site:{forceDomain}` Serper queries |
| police.uk | `site:police.uk` queries |
| GOV.UK | `site:gov.uk` queries |
| Official PDFs | `filetype:pdf` queries + body text extraction |
| Committed force JSON seeds | `data/*-custody-numbers.json` via `seedFindingsFromOfficialJson` |
| Playwright force fetch (GHA) | Devon & Cornwall Cloudflare-heavy pages weekly |

## Tier 2 — structured / licensed

| Source | How used |
|--------|----------|
| OpenStreetMap Nominatim | Station search with `extratags` phone / contact:phone |
| Overpass API | Nearby `amenity=police` nodes/ways with phone tags |
| Wikidata / Wikipedia domains | Recognised as `open_data` source type when they appear in organic results |

**Not enabled by default (needs authorised keys / ToS review):** Google Places, Bing Local, paid directory APIs. Do **not** scrape Google HTML SERPs.

## Tier 3 — corroborating

Council / PCC / FOI / local news / solicitor pages may appear in Serper results. They:

- can create findings;
- can corroborate for auto-publish only when trusted types agree (`corroboration.ts`);
- never override a conflicting current official approved number.

## Prohibited behaviours

- Inventing numbers from model memory.
- Treating 101 / 999 as station-specific lines.
- Auto-publishing from snippet-only evidence.
- Scraping Google results HTML in breach of terms (use Serper API only).
