# LIVE SITE PARITY AUDIT

**Date:** 2026-03-17
**Live site:** https://policestationrepuk.com
**Competitor:** https://www.policestationreps.com
**Cursor rebuild:** Current workspace

---

## 1. EXACT MATCHES (already in parity)

These pages/features in the Cursor rebuild closely match the live site:

| Area | Live Site | Cursor Rebuild | Notes |
|------|-----------|----------------|-------|
| Homepage hero | Trust badge, H1, subtitle, badges, dual CTA, shortcuts | `HomeHero` component | Copy and structure match |
| Homepage stats | 300+ Reps, 500+ Stations, 42 Forces | Stats section in `page.tsx` | Dynamic counts from data |
| Homepage featured reps | Grid of 6 rep cards | `DirectoryCard` grid | Layout matches |
| Homepage how-it-works | 3-step section | `HomeHowItWorks` component | Present |
| Homepage register CTA | Registration call-to-action | `HomeRegisterCta` component | Present |
| Header nav | Logo + links + mobile hamburger | `Header` component | Links match, emoji icons match |
| Footer | 5-column footer (Brand, Directory, Reps, Tools, Legal) | `Footer` component | Structure matches live site |
| `/About` | Timeline, values, stats, CTA, explore | Dedicated route | Good match |
| `/Contact` | Form + direct email/SMS + regulatory notice | Dedicated route + `ContactForm` | Good match |
| `/register` | Registration form | Dedicated route + `RegisterForm` | Present |
| `/directory` | Search + filters + county browse | `DirectorySearch` + `DirectoryFilters` | Core search present |
| `/directory/[county]` | County reps + stations | Dedicated dynamic route | Present |
| `/rep/[slug]` | Rep profile with contact, coverage, bio | Dedicated dynamic route | Present |
| `/police-station/[station]` | Station page with covering reps | Dedicated dynamic route | Present |
| `/Blog` | Blog listing with post grid | Dedicated route | Present |
| `/FAQ` | Accordion FAQ with quick links | Dedicated route | Present |
| `/Accessibility` | Policy page | Dedicated route | Present |
| `/Complaints` | Complaints page | Dedicated route | Present |
| `/Cookies` | Cookie policy | Dedicated route | Present |
| `/DataProtection` | Data protection info | Dedicated route | Present |
| `/GDPR` | GDPR page | Dedicated route | Present |
| `/Privacy` | Privacy policy | Dedicated route | Present |
| `/Terms` | Terms & conditions | Dedicated route | Present |
| `/CustodyNote` | CustodyNote app page | Dedicated route | Present |
| `/Firms` | Law firms page | Dedicated route | Present |
| `/Forces` | Police forces page | Dedicated route | Present |
| `/FormsLibrary` | Forms library | Dedicated route | Present |
| `/Forum` | Community forum | Dedicated route | Present |
| `/GetWork` | Get work guide | Dedicated route | Present |
| `/GoFeatured` | Featured listings page | Dedicated route | Present |
| `/HowToBecomePoliceStationRep` | How to become a rep | Dedicated route | Present |
| `/LegalUpdates` | Legal updates | Dedicated route | Present |
| `/PACE` | PACE codes | Dedicated route | Present |
| `/PoliceStationCover` | Police station cover for firms | Dedicated route | Present |
| `/PoliceStationRates` | Legal aid rates | Dedicated route | Present |
| `/PoliceStationRepJobsUK` | Rep jobs | Dedicated route | Present |
| `/Premium` | Training guides & resources | Dedicated route | Present |
| `/Resources` | Resources page | Dedicated route | Present |
| `/StationsDirectory` | Stations list by county | Dedicated route | Present |
| `/WhatsApp` | WhatsApp group page | Dedicated route | Present |
| SEO metadata | Title, description, canonical | `buildMetadata` + per-page exports | Present |
| JSON-LD | Organization, Website, LegalService schemas | `JsonLd` component + schema helpers | Present |
| Rewrites | `/Directory` → `/directory`, etc. | `next.config.ts` rewrites | Present |
| Redirects | Old URLs → new routes | `next.config.ts` redirects | Present |

---

## 2. PARTIAL MATCHES (present but incomplete)

| Area | Live Site | Cursor Rebuild | Gap |
|------|-----------|----------------|-----|
| Homepage sections | 7+ sections including Kent spotlight, training/resources cards | Only 5 sections (hero, stats, featured, how-it-works, register CTA) | **Missing 2 sections** |
| County SEO pages | 13 dedicated county pages (`/PoliceStationRepsKent`, etc.) + county index | Handled via generic mirror catch-all, renders as raw text dump | **Poor rendering** |
| Town-specific pages | 6 town pages (Gravesend, Maidstone, Medway, Sevenoaks, Swanley, Tonbridge) | Mirror catch-all only | **Poor rendering** |
| Blog posts | Individual blog articles with proper layout | Served via `[...slug]` catch-all | Blog post rendering is basic |
| Content/guide pages | ~22 guide pages (AccreditedGuide, BeginnersGuide, etc.) | Mirror catch-all, raw text dump | **No structured rendering** |
| Registration | Live site requires login first, then form | Cursor has standalone form | Different flow |
| `/PoliceStationRepsByCounty` | County index with 13 counties, each linking to dedicated page | Cursor has `/directory/counties` but different URL structure | Partial match |
| `/FindYourRep` | Interactive search with cloud view, force view, map view | Rewrites to `/directory` (basic search only) | Missing interactive features |
| Footer categories | Directories, For Representatives, Tools & Resources, Community | Directory, For Representatives, Tools & Resources, Legal | Close but "Community" column missing |
| Navigation | PSR UK logo + Blog, Custody Note, Find a Rep, Stations, Forms, Resources, Contact, About, Register CTA | Matches but uses emoji icons | Close match |

---

## 3. MISSING ITEMS (not present in Cursor rebuild)

### A. Missing Interactive Features (CRITICAL)

| Feature | Live Site URL | Description | Priority |
|---------|--------------|-------------|----------|
| **Interactive Map** | `/Map` | Leaflet map with 921 stations, click-to-see-reps, filter by force | HIGH |
| **Escape Fee Calculator** | `/EscapeFeeCalculator` | Calculator for legal aid escape fees with rate inputs | HIGH |
| **Wiki / Knowledge Base** | `/Wiki` | 45-article knowledge base organised by category | HIGH |
| **Wiki Article Detail** | `/WikiArticle` | Individual wiki article view | HIGH |
| **FindYourRep Enhanced** | `/FindYourRep` | Cloud view, force view, map view (not just basic search) | MEDIUM |

### B. Missing Content Pages (served via mirror but need proper dedicated pages)

| Page | Live URL | Purpose | Priority |
|------|----------|---------|----------|
| `/AboutFounder` | About the founder | Content | LOW |
| `/AccreditedRepresentativeGuide` | Guide to accreditation | Content/SEO | MEDIUM |
| `/BeginnersGuide` | Beginner's guide | Content/SEO | MEDIUM |
| `/BuildPortfolioGuide` | Portfolio guide | Content/SEO | LOW |
| `/CriminalLawCareerGuide` | Career guide | Content/SEO | LOW |
| `/CrownCourtFees` | Crown court fees reference | Content/SEO | MEDIUM |
| `/DSCCRegistrationGuide` | DSCC registration guide | Content/SEO | LOW |
| `/DutySolicitorVsRep` | Comparison page | Content/SEO | MEDIUM |
| `/GettingStarted` | Getting started guide | Content/SEO | LOW |
| `/HowToBecome` | How to become (duplicate of HowToBecomePoliceStationRep?) | Content | LOW |
| `/ICO` | ICO information | Content | LOW |
| `/InterviewUnderCaution` | Interview under caution guide | Content/SEO | MEDIUM |
| `/MagistratesCourtFees` | Magistrates court fees | Content/SEO | MEDIUM |
| `/MediaKit` | Media kit | Content | LOW |
| `/PoliceDisclosureGuide` | Police disclosure guide | Content/SEO | MEDIUM |
| `/PoliceStationRepPay` | Rep pay information | Content/SEO | MEDIUM |
| `/PrepareForCIT` | CIT preparation guide | Content/SEO | LOW |
| `/SolicitorPoliceStationCoverUK` | SEO landing for solicitors | SEO/Landing | MEDIUM |
| `/WhatDoesRepDo` | Explainer page | Content/SEO | MEDIUM |
| `/RepFAQMaster` | Extended FAQ | Content | LOW |

### C. Missing County/Town Landing Pages (13 counties + 6 towns)

These exist on the live site as dedicated SEO landing pages. The Cursor rebuild serves them via generic mirror catch-all which renders poorly.

**Counties (high SEO value):**
- `/PoliceStationRepsKent` - Kent reps with listed profiles
- `/PoliceStationRepsLondon` - London reps
- `/PoliceStationRepsEssex` - Essex reps
- `/PoliceStationRepsManchester` - Manchester reps
- `/PoliceStationRepsWestMidlands` - West Midlands reps
- `/PoliceStationRepsWestYorkshire` - West Yorkshire reps
- `/PoliceStationRepsSurrey` - Surrey reps
- `/PoliceStationRepsSussex` - Sussex reps
- `/PoliceStationRepsHampshire` - Hampshire reps
- `/PoliceStationRepsNorfolk` - Norfolk reps
- `/PoliceStationRepsSuffolk` - Suffolk reps
- `/PoliceStationRepsBerkshire` - Berkshire reps
- `/PoliceStationRepsHertfordshire` - Hertfordshire reps

**Towns (Kent-specific SEO):**
- `/GravesendPoliceStationReps`
- `/MaidstonePoliceStationReps`
- `/MedwayPoliceStationReps`
- `/SevenoaksPoliceStationReps`
- `/SwanleyPoliceStationReps`
- `/TonbridgePoliceStationReps`

**Kent-specific:**
- `/KentAgentCover`
- `/KentCustodySuites`
- `/KentPoliceStationReps`

### D. Missing User/Payment Features

| Feature | Live URL | Priority |
|---------|----------|----------|
| `/Account` | User account page | LOW (requires auth) |
| `/FeaturedCheckout` | Stripe checkout for featured | LOW (payment flow) |
| `/FeaturedSuccess` | Payment success page | LOW |
| `/PaymentCancel` | Payment cancel page | LOW |
| `/PaymentSuccess` | Payment success page | LOW |
| `/Subscribe` | Subscription page | LOW |
| `/FirmProfile` | Firm profile page | MEDIUM |
| `/RepProfile` | Rep self-profile page | MEDIUM |
| `/SpotlightProfile` | Featured/spotlight profile | MEDIUM |
| `/LegalUpdateDetail` | Legal update article | MEDIUM |
| `/ForumPost` | Forum post detail | LOW |

### E. Missing Misc Pages

| Page | Purpose | Priority |
|------|---------|----------|
| `/FirmsWhatsAppGroup` | WhatsApp for firms | LOW |
| `/CountyReps` | County reps landing | LOW (overlap with PoliceStationRepsByCounty) |
| `/Join` | Join page | LOW (rewrites to /register) |
| `/Advertisers` | For advertisers | LOW |
| `/Advertising` | Advertising info | LOW |
| `/police-station-representatives-directory-england-wales` | SEO landing page | MEDIUM |

---

## 4. BROKEN ITEMS

| Issue | Details | Impact |
|-------|---------|--------|
| Mirror page rendering | Mirror catch-all pages render as raw text dump in a single card. Headings are listed but not interspersed with content. No proper section structure. | HIGH - affects ~50+ pages |
| sitemap.xml returns 500 | `https://policestationrepuk.com/sitemap.xml` returns error | HIGH - SEO impact |
| Live site timeout | policestationrepuk.com frequently times out on fetch | HIGH - availability |
| `/Wiki` redirects to `/Premium` | `next.config.ts` redirects Wiki to Premium — live site has separate Wiki | MEDIUM - loses wiki functionality |
| Registration flow mismatch | Live site requires login before registration; Cursor has standalone form | MEDIUM |
| Missing `/Map` route | Interactive map is a key feature on live site, completely absent | HIGH |
| Missing `/EscapeFeeCalculator` | Functional calculator tool absent | HIGH |

---

## 5. BEST-PRIORITY FIXES (ranked by impact)

### Tier 1 — Critical Parity (do first)

1. **Add missing homepage sections** — Kent spotlight + Training resources sections
2. **Create `/EscapeFeeCalculator` page** — Functional calculator with rate inputs
3. **Create `/Map` page** — Interactive Leaflet map with station pins
4. **Create `/Wiki` page** — Knowledge base with category browsing (remove redirect)
5. **Create `/WikiArticle` page** — Wiki article detail view
6. **Fix county SEO pages** — Create proper template for `/PoliceStationReps{County}` pages (13 counties)
7. **Improve mirror page rendering** — Better section/heading/content layout for catch-all pages

### Tier 2 — Important Parity

8. **Create town-specific pages** — Template for `/[Town]PoliceStationReps` (6 Kent towns)
9. **Create `/PoliceStationRepsByCounty`** — County index page
10. **Create key content pages** — DutySolicitorVsRep, InterviewUnderCaution, PoliceStationRepPay, WhatDoesRepDo
11. **Create fee reference pages** — CrownCourtFees, MagistratesCourtFees
12. **Create guide pages** — AccreditedGuide, BeginnersGuide, PoliceDisclosureGuide
13. **Create `/SolicitorPoliceStationCoverUK`** — SEO landing for solicitors
14. **Create `/police-station-representatives-directory-england-wales`** — SEO landing

### Tier 3 — Nice-to-have Parity

15. Create `/AboutFounder`, `/MediaKit`, `/Advertisers`, `/Advertising`
16. Create `/FirmProfile`, `/RepProfile`, `/SpotlightProfile`
17. Create `/LegalUpdateDetail`, `/ForumPost`
18. Create `/Subscribe`, `/FeaturedCheckout`, `/FeaturedSuccess` payment flows
19. Create `/Account` (requires auth)
20. Remaining guide pages

---

## 6. ASSUMPTIONS / UNKNOWNS

| Item | Assumption | Confidence |
|------|-----------|------------|
| Live site auth | Base44 uses its own auth system; Cursor rebuild has no auth | Medium |
| Payment processing | Live site appears to use Stripe; not implemented in Cursor | Medium |
| Data source | Live site uses Base44 backend; Cursor uses JSON files + optional Supabase | High |
| Rep data | Cursor has mock/seed data; live site has real registered reps | High |
| Map data | Live site loads 921 stations; Cursor has ~60 stations in JSON | High |
| Wiki content | Live site has 45 wiki articles; Cursor has Premium/Wiki but content served via mirror | High |
| Blog content | Live site blog is SEO-targeted (Kent police station topics); Cursor loads from crawl | High |
| Design system | Live site uses Base44 default styling; Cursor uses clean Tailwind | Medium |
| Mobile nav | Both have hamburger menu; exact behavior may differ | Medium |

---

## COMPETITOR BENCHMARK (policestationreps.com)

### Features on Competitor NOT on My Site

| Feature | Competitor | My Site | Should Add? |
|---------|-----------|---------|-------------|
| Advanced Search (7 methods) | Station, force, county, town, address, postcode, custody tel | Station + county + query search | Phase 2 |
| Login system | Full auth with login/register | No auth in Cursor | Phase 2 |
| Fat Cats Stats | Firm earnings data | Not present | Phase 2 |
| Interactive rep map | Shows 1500 reps on map | Has `/Map` but not in Cursor | Phase 1 (map exists on live) |
| Banner system | Rotating promotional banners | Not present | Optional |
| Facebook community | Social integration | WhatsApp group instead | No |
| Parliamentary Review feature | Content page | Not needed | No |
| GDPR toolkit | Compliance toolkit | Has GDPR page | Phase 2 |
| Mileage guide | Detailed guide | Can add to wiki | Phase 2 |
| Double fees guide | Legal aid guide | Can add to wiki | Phase 2 |

### Where My Site Is Stronger

- Modern, clean design (vs competitor's dated layout)
- Mobile responsive (competitor appears less responsive)
- Better SEO structure (JSON-LD, proper metadata)
- More content pages and guides
- Wiki/knowledge base with 45 articles
- County-specific landing pages
- Featured rep system with tiers
- CustodyNote app integration
- WhatsApp community

### Phase 2 Enhancement Candidates (after parity)

1. Advanced search with postcode/address/custody tel inputs
2. User authentication and profiles
3. Stripe payment integration for featured listings
4. Forum with post/reply functionality
5. Enhanced blog with comments
6. Regional demand heatmap
7. More county/town landing pages beyond current 13

---

## IMPLEMENTATION ROADMAP

### PHASE A — Critical Homepage Parity (immediate)
- Add Kent spotlight section to homepage
- Add Training guides/resources section to homepage

### PHASE B — Missing Interactive Features
- Create `/EscapeFeeCalculator` with functional calculator
- Create `/Map` with Leaflet interactive map
- Create `/Wiki` knowledge base (remove redirect)
- Create `/WikiArticle` detail view

### PHASE C — County/Town SEO Pages
- Create reusable template for county rep pages
- Generate 13 county pages from template
- Generate 6 Kent town pages from template
- Create `/PoliceStationRepsByCounty` index

### PHASE D — Content Pages
- Create key SEO content pages (DutySolicitorVsRep, InterviewUnderCaution, etc.)
- Create fee reference pages
- Create guide pages

### PHASE E — Mirror Page Quality
- Improve catch-all page rendering
- Better heading/content interleaving
- Section-based layout for mirror pages

### PHASE F — Remaining Pages
- Profile pages (Firm, Rep, Spotlight)
- Payment flow pages
- Misc content pages

### PHASE G — Competitor-Inspired Enhancements
- Advanced search
- Auth system
- Payment integration
