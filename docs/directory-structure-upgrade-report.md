# Directory Structure Upgrade Report

## Summary

The site has been upgraded to a professional directory platform structure. All existing routes, page content, directory data, and navigation links are preserved. New homepage sections, county-based directory pages, and navigation improvements have been added.

---

## Part 1 — Homepage Professional Directory Structure

The homepage now uses a modern directory layout with five main sections (plus an optional sixth when mirror content exists).

### Section 1 — Hero

- **Headline:** “Find a Police Station Representative”
- **Subtext:** “Search our directory of accredited police station representatives covering custody suites across the UK.”
- **Prominent search box:** Single search input (name, county or station) that submits to `/directory` with query param `q`.
- **Browse directory button:** Link to `/directory`.

### Section 2 — Representative Search

- Search interface with three filters:
  - **Representative name** (text input `q`)
  - **County** (dropdown)
  - **Police station** (dropdown)
- Form submits via GET to `/directory` with `q`, `county`, and `station`, so directory results are pre-filtered.

### Section 3 — Featured Representatives

- Grid of representative cards (first 6 from the directory).
- Each card includes: name, county, stations covered, availability, accreditation badge, Call button (via existing `DirectoryCard`).
- “View full directory” link to `/directory`.

### Section 4 — How the Directory Works

- Three-step explanation:
  1. Search for a representative
  2. Contact the representative directly
  3. They attend the police station for your client

### Section 5 — Representative Registration

- Call-to-action section inviting representatives to register.
- “Register for free” button linking to `/register`.

### Optional Section 6 — About

- When mirror (crawl) content exists for the homepage, it is shown in an “About” section so existing content is preserved.

---

## Part 2 — County Directory Structure

### County-based directory pages

- **Route pattern:** `/directory/[county]`
- **Examples:** `/directory/kent`, `/directory/london`, `/directory/essex`, `/directory/surrey`, `/directory/sussex`, and all other counties returned by `getAllCounties()`.
- **Behaviour:** Representatives are shown where `rep.counties` includes the county name for that page. Content and metadata come from the same `getCountyContent()` and data layer as the existing `/county/[county]` pages.
- **Number of county pages:** One page per county in the data source (e.g. 25 seed counties). All are pre-rendered via `generateStaticParams()`.

### Counties index page

- **Route:** `/directory/counties`
- **Purpose:** Index of all counties with links to `/directory/[county]`.
- **Layout:** Grid of county cards (name + region) linking to the corresponding county directory page.

### Preservation of existing routes

- **`/county/[county]`** is unchanged and still works (e.g. `/county/kent`). Only new routes under `/directory/` were added.

---

## Part 3 — Directory Card Design

Directory listings use the existing professional card components (unchanged in this task; already aligned with the earlier UI redesign):

- **DirectoryCard** (directory and county directory pages): Representative name, county, stations covered, availability, accreditation badge, “Call” button, “View profile” link. Rounded corners, soft shadow, hover highlight, clear typography.
- **RepCard** (used on `/county/[county]`): Same fields and similar styling.
- **StationCard**: Used for police stations on county and directory county pages.

No card behaviour or data was removed; layout and styling remain consistent.

---

## Part 4 — Directory Grid

- **Desktop (xl):** 3–4 cards per row (e.g. 4 for reps where space allows).
- **Tablet (lg/sm):** 2–3 cards per row.
- **Mobile:** 1 card per row.
- Implemented via Tailwind grid classes on directory page, directory county page, and featured section on the homepage.

---

## Part 5 — Directory Search + Filter

- **Search input:** Name/station/county search on the main directory page (existing `DirectoryFilters`).
- **Filters:** County, availability, accreditation (and station dropdown) in a single filter bar above results.
- **Sorting:** Alphabetical (A–Z) and by county.
- All of the above were already in place; no functionality was removed.

---

## Part 6 — Navigation Improvement

- **Directory:** Link to `/directory` (label “Directory”).
- **Counties:** New link to `/directory/counties` (label “Counties”).
- **Register:** Link to `/register` (or “Join the Directory (Free)”).
- **Custody Note:** Link to `/CustodyNote`.
- **Contact:** Link to `/Contact`.
- **Other existing links** (Home, Blog, Station Numbers, Forms, Resources, About) remain in the header. CTA styling for Register is unchanged.

---

## Part 7 — Design Quality

- **Max-width container:** `page-container` and `--container-max` used across new and updated pages.
- **Spacing:** Consistent vertical spacing between sections (e.g. `py-14`, `py-16`, `mt-12`).
- **Typography:** `text-h1`, `text-h2`, and existing hierarchy used on the new homepage and directory county/counties pages.
- **Cards:** Rounded corners, `--card-shadow`, `--card-shadow-hover`, and borders from global design tokens.
- **Responsive layout:** Grids and forms respond by breakpoint; no existing responsive behaviour was removed.

---

## Final Validation

| Check | Status |
|-------|--------|
| Homepage follows the 5-section structure | Yes (Sections 1–5; Section 6 optional for mirror content) |
| County directory pages work correctly | Yes (`/directory/[county]` and `/directory/counties`) |
| Representatives appear on correct county pages | Yes (filtered by `getRepsByCounty(county.name)`) |
| Directory cards display correctly | Yes (DirectoryCard / RepCard / StationCard unchanged) |
| Filters and search function properly | Yes (existing DirectoryFilters and GET params) |
| Navigation remains intact | Yes (all original links kept; “Counties” added) |
| No existing routes or content removed | Yes (all preserved; only new routes and sections added) |

---

## Artifacts

- **New components:** `HomeHero`, `HomeSearchSection`, `HomeHowItWorks`, `HomeRegisterCta`.
- **New routes:** `app/directory/[county]/page.tsx`, `app/directory/counties/page.tsx`.
- **Updated:** `app/page.tsx` (5-section homepage), `app/directory/page.tsx` (county links to `/directory/[county]` and link to `/directory/counties`), `components/Header.tsx` (Directory, Counties in nav).
- **Report:** `docs/directory-structure-upgrade-report.md` (this file).
