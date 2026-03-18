# Project context

**Project:** Police Station Rep Directory

This project recreates [policestationrepuk.com](https://www.policestationrepuk.com) as a Next.js application.

## Purpose

Connect **criminal defence solicitors** with **accredited police station representatives** across England and Wales.

## Core features

- **Searchable rep directory** — Find reps by county, station, availability, and accreditation; rep profiles with contact details and coverage.
- **Rep registration form** — Accredited representatives can register and join the directory (form + API handling).
- **Promotional pages** — e.g. CustodyNote: app explanation, link to custodynote.com, discount/offer via policestationrepuk.com, clear CTAs.
- **Informational pages for criminal firms** — Resources, guides, and content aimed at criminal defence firms (stations, forms, PACE, etc.).

## Tech stack

- **Next.js** (App Router)
- **Tailwind CSS** for styling
- **Data**: `data/reps.json` for directory; optional Supabase for persistence
- **Routes**: `/` (home), `/directory`, `/register`, `/contact`, `/CustodyNote`, plus dynamic `/[slug]` for content pages (About, Resources, etc.)

## Key areas in the codebase

| Area | Location |
|------|----------|
| App layout, pages | `app/` |
| Shared UI (header, footer, directory cards) | `components/` |
| Directory data & search | `lib/data.ts`, `data/reps.json` |
| Crawl/mirror data | `content/crawl/`, `data/pages.json`, `lib/mirror-data.ts` |
| Sitemap paths (live site routes) | `lib/sitemap-paths.ts` |

## Design direction

- Professional, legal-sector style
- Clean layout, strong typography, clear CTAs
- Directory listings easy to scan
- No reliance on external site CSS; styles recreated with Tailwind
