# Homepage Rewrite + SEO Hierarchy Plan
## policestationrepuk.org — Implementation-Ready Audit

---

## 1. EXECUTIVE SUMMARY

policestationrepuk.org has the technical infrastructure to outrank policestationreps.com. The site already has 894 station pages, ~180 rep profiles, 32 county pages, 21 blog articles, 45 wiki articles, rich JSON-LD, modern SSG, and mobile-first design. The competitor has none of those technical advantages.

**What is holding the site back is not structure — it is homepage keyword focus, section ordering, internal linking density, and content positioning.** The homepage currently dilutes its SEO power across too many sections (CustodyNote promo, Kent spotlight, AI assistant) before establishing directory authority. The fix is surgical: reorder, sharpen copy, and tighten internal links.

---

## 2. LIVE SITE AUDIT

### A. Current Site Positioning

Google currently sees policestationrepuk.org as:
- A **free directory** of police station representatives (correct)
- A **Kent-focused** platform (incorrect — Kent spotlight and Kent-specific pages outnumber other regions)
- A **CustodyNote promotion channel** (diluting — CustodyNote appears before core directory content)
- A **mixed-purpose** site (guides, wiki, calculator, community, blog, tools all at the same level)

**The problem:** The homepage title says "Police Station Reps UK" but the page body pushes CustodyNote, Kent, and tools before reinforcing the directory positioning. Google reads section order as importance.

### B. Current Structural Hierarchy

```
/ (homepage)
├── /directory (hub — correct)
│   ├── /directory/{county} × 32
│   ├── /directory/counties
│   └── /rep/{slug} × ~180
├── /StationsDirectory (station search)
│   └── /police-station/{station} × 894
├── /Blog × 21 articles
├── /Wiki × 45 articles
├── /LegalUpdates × 7
├── SEO landing pages (8 pages: /police-station-representative, etc.)
├── Guide pages (20+ pages)
├── Tools (/EscapeFeeCalculator, /FormsLibrary, /CustodyNote, /Map)
├── Community (/WhatsApp, /Forum, /register, /GetWork)
└── Legal/Corporate (Privacy, Terms, etc.)
```

**Total indexable URLs:** ~1,200+

### C. What Already Works

| Asset | SEO Value |
|-------|-----------|
| 894 station pages with unique URLs | Massive long-tail advantage — competitor has zero station URLs |
| JSON-LD on every page type | Rich results eligibility competitor lacks entirely |
| 32 county directory pages | County-level keyword coverage |
| ~180 rep profiles with structured data | Person schema, individual URLs |
| Mobile-first responsive design | Mobile-first indexing advantage |
| Next.js SSG on Vercel edge | Core Web Vitals superiority |
| 15-question FAQ with FAQPage schema | Featured snippet eligibility |
| Blog passing automated SEO audit | Content freshness signals |
| .org domain | Perceived non-commercial trust |
| "Since 2016" establishment | Trust signal |
| SearchAction in WebSite schema | Sitelinks search box eligibility |

### D. What Is Holding the Site Back

**D1. Homepage keyword dilution**
- Title is 62 chars ("Police Station Reps UK | Find Police Station Representatives") — over the 60-char display limit. Google truncates it.
- H1 says "The UK's Free Directory of Police Station Representatives" — passive voice. Does not lead with user intent ("Find").
- CustodyNote and ToolsForReps appear as sections 3 and 4 on the homepage, before the core SEO content hub (HomeSeoConversionHub). Google reads this as: "this page is about CustodyNote tools," not "this page is the UK directory of reps."

**D2. Homepage section ordering is wrong for SEO**
Current order after hero:
1. Stats strip (good)
2. Platform disclaimer (wastes prime real estate)
3. **HomeCustodyNote** (promotional — should be lower)
4. **ToolsForRepsSection** (secondary — should be lower)
5. HomeSeoConversionHub (this is the actual SEO content — too late)
6. HomeKentSpotlight (regional bias — should be lower)
7. HomeRecentlyJoined
8. HomeWhyChoose
9. HomeTrainingResources
10. HomeFeaturedCarousel
11. HomeTestimonials
12. HomeBlogPreview
13. HomeRegisterCta
14. HomeQuickSearch
15. HomeHomepageFaq
16. HomePhoneNumbers
17. HomeAIAssistant

**Problem:** The definitional content ("What is a police station representative?"), coverage links, and "How it works" — the content Google needs to understand topical authority — is buried at position 5. CustodyNote and Kent promo sit above it.

**D3. Weak internal linking from homepage to directory pages**
The HomeSeoConversionHub links to 9 county/region paths. But the homepage does not prominently link to:
- /directory/counties (all counties index)
- The top 10 station pages by traffic
- The /police-station-representative definitional page (the cornerstone content)
- /Blog (as a section hub)

**D4. County pages lack unique introductory content**
Most county pages are pure rep listings. No unique text about that county's custody suites, police forces, or rep availability. Google may treat these as thin content.

**D5. Station pages underlink to reps**
Station pages show station details but the "reps covering this station" section is not prominent enough. Each station page is a missed opportunity to link to 3-10 rep profiles.

**D6. Kent over-representation**
The site has: KentPoliceStationReps, KentAgentCover, KentCustodySuites, MaidstonePoliceStationReps, MedwayPoliceStationReps, GravesendPoliceStationReps, SevenoaksPoliceStationReps, SwanleyPoliceStationReps, TonbridgePoliceStationReps, police-station-rep-kent, HomeKentSpotlight.
No equivalent pages exist for London, Manchester, Birmingham, or Leeds. This signals "Kent directory" not "UK directory."

---

## 3. COMPETITOR BENCHMARK

### A. Why policestationreps.com Ranks

1. **Domain age (~18 years):** Accumulated trust and backlinks since ~2008
2. **Rep count (claims 1,500):** More profiles = more indexable long-tail pages
3. **Exact-match domain:** "policestationreps" is the keyword
4. **7 search methods:** Station, force, county, town, address, postcode, custody number — each generating crawlable result pages
5. **Wiki depth:** 80+ wiki articles on offences, PACE, billing
6. **Industry incumbency:** Known brand in the profession

### B. Where the Competitor Is Weaker

1. **Zero structured data** — no JSON-LD, no rich results eligibility
2. **Zero individual station pages** — flat search results only
3. **Ancient PHP** — no SSG, slow load times, poor Core Web Vitals
4. **Not mobile-friendly** — table-based layout
5. **No canonical URLs** — duplicate content issues visible in Google (rates.php/legalupdates.php)
6. **Stale content** — references from 2018, pre-COVID advice
7. **Agency branding** — "No Comment" agency promotion makes it feel biased, not neutral
8. **No blog SEO** — single PHP page with anchors, not individual posts
9. **No professional tools** — no CustodyNote equivalent, no forms library

### C. What policestationrepuk.org Already Has That Can Be Better Leveraged

1. **894 station pages** the competitor cannot match without a full rebuild
2. **Person + GovernmentBuilding JSON-LD** on rep and station pages
3. **FAQPage schema** on homepage and blog posts — featured snippet ready
4. **BlogPosting schema** on 21 properly structured articles
5. **Professional tools** (Calculator, Forms, CustodyNote) that create return visits
6. **Community layer** (WhatsApp, Forum, registration) that competitors lack
7. **Modern UX** that converts better on mobile

### D. Exact Strategic Advantage

policestationrepuk.org can win on **technical SEO superiority** (structured data, speed, mobile), **content depth** (station pages, blog, wiki), and **neutrality** (independent directory vs agency-tied competitor). The gap to close is **homepage keyword focus** and **internal linking density**.

---

## 4. NEW HOMEPAGE SEO TITLE / META / H1

### SEO Title (57 chars)
```
Find a Police Station Rep — UK Representative Directory
```

### Meta Description (154 chars)
```
Free directory of accredited police station representatives in England & Wales. Search by county, station, or name. 300+ reps, 894 stations. Join free.
```

### H1
```
Find a Police Station Representative — UK Directory
```

**Rationale:**
- Leads with the action verb "Find" — matches search intent
- Contains exact target phrase "police station representative"
- Contains "UK directory" — geographic + category qualifier
- Under 60 chars for title, under 155 for meta
- H1 is distinct from title (Google guidance) but reinforces the same keyword cluster

---

## 5. NEW HOMEPAGE SECTION STRUCTURE

Revised section order (priority = SEO weight):

| # | Section | Purpose | Current Component |
|---|---------|---------|-------------------|
| 1 | Hero | H1 + primary CTA + trust badge | HomeHero (rewritten) |
| 2 | Stats strip | Scale signals | (existing — keep) |
| 3 | "What is a police station representative?" | Definitional content for featured snippets | HomeSeoConversionHub (move up) |
| 4 | Coverage links / Browse by county | Directory navigation + internal links | New or extracted from HomeSeoConversionHub |
| 5 | How it works (3-step) | Process clarity | Part of HomeSeoConversionHub (move up) |
| 6 | For firms / For reps split | Dual-audience targeting | Part of HomeSeoConversionHub (move up) |
| 7 | Featured reps carousel | Social proof + rep links | HomeFeaturedCarousel |
| 8 | Recently joined reps | Freshness signal | HomeRecentlyJoined |
| 9 | Why choose this directory | Trust + differentiation | HomeWhyChoose |
| 10 | Professional tools (including CustodyNote) | Sticky value + subtle promo | ToolsForRepsSection (moved down) |
| 11 | Blog preview | Content freshness | HomeBlogPreview |
| 12 | Training resources | Supporting content | HomeTrainingResources |
| 13 | Testimonials | Social proof | HomeTestimonials |
| 14 | Register CTA | Conversion | HomeRegisterCta |
| 15 | Quick search (stations + counties) | Extra internal links | HomeQuickSearch |
| 16 | FAQ | Featured snippet + long-tail | HomeHomepageFaq |
| 17 | Platform disclaimer | Regulatory | (moved from #3 to #17) |

**Removed/demoted:**
- **HomeCustodyNote:** Absorbed into ToolsForRepsSection (position 10, not 3)
- **HomeKentSpotlight:** Removed from homepage. Kent already has /police-station-rep-kent and /directory/kent. A regional spotlight on the national homepage undermines UK positioning.
- **HomePhoneNumbers:** Move to footer or Contact page
- **HomeAIAssistant:** Remove from homepage (not adding SEO value, adds weight)
- **Platform disclaimer:** Move to bottom (currently wastes position 3)

---

## 6. FULL HOMEPAGE COPY

### Hero Section

**Trust badge:** "Trusted by 300+ professionals · Free since 2016"

**H1:** Find a Police Station Representative — UK Directory

**Subtitle:** The UK's free directory connecting criminal defence firms with accredited police station representatives for custody attendance across England and Wales. Search by county, station, or name — 24/7.

**Badges:** Free to search · Free to join · No middleman fees

**Primary CTA:** Find a Representative → /directory
**Secondary CTA:** Join the Directory → /register

**Quick links:** Station Numbers → /StationsDirectory · Forms Library → /FormsLibrary · Rep Wiki → /Wiki · Resources → /Resources

### Stats Strip

300+ Registered Reps · 894 Stations Listed · 43 Police Forces · Free Since 2016

### Section: What Is a Police Station Representative?

**H2:** What is a police station representative?

A police station representative is an accredited professional who attends custody on behalf of an instructing criminal solicitor or firm. They advise suspects and volunteers, support them through booking-in and interview, and help protect their position under PACE and the Codes of Practice.

- Acts under the direction of the solicitor firm that instructs them
- Attends custody suites and interview rooms across England and Wales
- Used for out-of-hours, volume, or geographic coverage where in-house staff are stretched
- Must hold appropriate accreditation — firms retain responsibility for supervision

Read the full guide: Police station representative (UK) → /police-station-representative
What does a rep do? → /WhatDoesRepDo
Duty solicitor vs representative → /DutySolicitorVsRep

### Section: Browse Representatives by County

**H2:** Police station reps across England and Wales

Browse representatives by county to see available reps and local custody suites.

[Kent] [London] [Essex] [Greater Manchester] [West Midlands] [West Yorkshire] [Merseyside] [Hampshire] [Surrey] [Sussex] [All counties →]

### Section: How It Works

**H2:** How police station cover works

1. **Search** — A firm needs attendance at a station. Search the directory by county, station, or rep name.
2. **Connect** — A rep with the right accreditation and availability accepts the instruction directly from the firm.
3. **Attend** — The rep attends custody, delivers advice, and reports back to the instructing solicitor.

[Open directory →] [Advanced search →]

### Section: For Firms / For Reps

**H2 (left):** For criminal law firms

We provide a police station cover discovery layer: find accredited reps by area, station, and availability. Use alongside your panel, DSCC, and WhatsApp workflows — 100% free to search.

- Filter by county and custody suite
- 24/7 directory access
- Links to rates, forms, and PACE resources

[Police station cover guide for firms →]

**H2 (right):** For police station representatives

Register a free profile so firms can find you by area, station, and accreditation. Update your availability and coverage as your practice changes.

- Free listing — no commission
- Visible to solicitor firms nationally
- Professional tools: CustodyNote, Escape Fee Calculator, Forms

[Register free →] [CustodyNote for reps →]

### Section: Featured Representatives

**H2:** Featured police station representatives

[Featured rep cards with links to /rep/{slug}]

### Section: Recently Joined

**H2:** Recently joined the directory

[Recent rep cards — freshness signal]

### Section: Why Choose This Directory

**H2:** Why firms and reps use PoliceStationRepUK

- **National coverage** — representatives across all 43 police force areas
- **Free and independent** — not tied to any agency or firm
- **Trusted since 2016** — established directory with professional community
- **Professional tools** — CustodyNote, Escape Fee Calculator, Forms Library, PACE reference
- **Always current** — reps update their own profiles and availability

### Section: Professional Tools

**H2:** Tools for police station representatives

- **CustodyNote** — Structure your attendance notes in minutes. Used by professional police station reps for consistent, shareable custody records. [Try free →]
- **Escape Fee Calculator** — Work out firm and rep earnings quickly [Calculate →]
- **Forms Library** — Standard forms for police station work [View forms →]
- **PACE Reference** — Codes A-H quick reference [PACE hub →]

### Section: From the Blog

**H2:** Guides and insights for police station representatives

[3 latest blog article cards]
[View all articles →]

### Section: Register CTA

**H2:** Join 300+ police station representatives

Register your free profile and let criminal defence firms find you. No fees, no commission, no lock-in.

[Register free →]

### Section: Search Stations and Counties

**H2:** Search by police station or county

[Autocomplete inputs for station name and county name]

### Section: Frequently Asked Questions

**H2:** Common questions about police station representatives

[15 FAQ items with FAQPage schema — already existing]

### Section: Platform Notice (bottom)

PoliceStationRepUK is a directory — not a law firm, agency, or provider of legal services. It connects criminal defence firms with accredited representatives. Any engagement is a direct contract between the instructing firm and the representative.

---

## 7. CURRENT SITE HIERARCHY

(See Section 2B above)

---

## 8. IMPROVED SEO HIERARCHY USING EXISTING PAGES

```
Homepage /
│
├── DIRECTORY HUB /directory
│   ├── /directory/counties (all-counties index)
│   ├── /directory/{county} × 32 (county listing pages)
│   └── → links down to /rep/{slug} × 180+ (rep profiles)
│
├── STATIONS HUB /StationsDirectory
│   └── /police-station/{station} × 894 (station detail pages)
│       └── → links to covering reps /rep/{slug}
│
├── DEFINITIONAL CORNERSTONE /police-station-representative
│   ├── /WhatDoesRepDo
│   ├── /DutySolicitorVsRep
│   ├── /InterviewUnderCaution
│   └── /police-station-rights-uk
│
├── CAREER/TRAINING CLUSTER
│   ├── /HowToBecomePoliceStationRep (pillar)
│   ├── /AccreditedRepresentativeGuide
│   ├── /GettingStarted
│   ├── /BuildPortfolioGuide
│   ├── /PrepareForCIT
│   ├── /DSCCRegistrationGuide
│   └── /CriminalLawCareerGuide
│
├── FIRMS CLUSTER
│   ├── /PoliceStationCover (pillar)
│   ├── /criminal-solicitor-police-station
│   ├── /SolicitorPoliceStationCoverUK
│   ├── /Firms
│   └── /free-legal-advice-police-station
│
├── RATES/BILLING CLUSTER
│   ├── /PoliceStationRepPay (pillar — consolidate /PoliceStationRates here)
│   ├── /EscapeFeeCalculator
│   ├── /CrownCourtFees
│   └── /MagistratesCourtFees
│
├── REFERENCE CLUSTER
│   ├── /PACE (pillar)
│   ├── /PoliceDisclosureGuide
│   ├── /FormsLibrary
│   ├── /Resources
│   └── /Wiki + /Wiki/{slug} × 45
│
├── BLOG /Blog + /Blog/{slug} × 21
│
├── TOOLS
│   ├── /CustodyNote
│   ├── /EscapeFeeCalculator
│   └── /Map
│
├── COMMUNITY
│   ├── /register
│   ├── /WhatsApp
│   ├── /Forum
│   ├── /GetWork
│   └── /PoliceStationRepJobsUK
│
├── TRUST/AUTHORITY
│   ├── /About
│   ├── /AboutFounder
│   ├── /FAQ
│   └── /Advertising
│
├── REGIONAL SEO (existing)
│   ├── /police-station-rep-kent
│   ├── /police-station-rep-london
│   └── /police-station-rep-essex
│
└── LEGAL (Privacy, Terms, GDPR, Cookies, etc.)
```

---

## 9. PAGE ROLE ASSIGNMENT

| Page Type | SEO Role | Primary Keyword | Links TO | Linked FROM |
|-----------|----------|-----------------|----------|-------------|
| Homepage | Authority hub | find a police station rep, UK directory | /directory, /police-station-representative, /register, counties, blog | Every page (nav + breadcrumbs) |
| /directory | Directory hub | police station rep directory | County pages, rep profiles | Homepage, all content pages |
| /directory/{county} | County targeting | police station rep {county} | Rep profiles, local stations | /directory, homepage coverage section, blog |
| /rep/{slug} | Long-tail + conversion | {rep name} police station rep | Covered stations, county page | County pages, station pages |
| /police-station/{station} | Station targeting | {station name} contact, reps | Covering reps, county page | /StationsDirectory, county pages |
| /police-station-representative | Definitional cornerstone | police station representative | /directory, /WhatDoesRepDo, /DutySolicitorVsRep | Homepage, blog articles, all guide pages |
| /Blog/{slug} | Topical authority | Long-tail keywords | /directory, county pages, /register | /Blog index, homepage, related articles |
| /CustodyNote | Tool page | custody notes, attendance notes | /register, /directory | Blog articles, rep profiles, tools section |
| /HowToBecomePoliceStationRep | Career pillar | how to become a police station rep | /register, /AccreditedRepresentativeGuide | Homepage, blog, /GetWork |
| /PoliceStationCover | Firms pillar | police station cover UK | /directory, /criminal-solicitor-police-station | Homepage, blog, /Firms |
| /AboutFounder | Trust/authority | Robert Cashman police station | /directory, /About, policestationagent.com | Footer, /About |

---

## 10. INTERNAL LINKING FRAMEWORK

### From Homepage
- Hero CTA → /directory
- Hero CTA → /register
- Quick links → /StationsDirectory, /FormsLibrary, /Wiki, /Resources
- "What is a rep?" section → /police-station-representative, /WhatDoesRepDo, /DutySolicitorVsRep
- County browse → /directory/kent, /directory/london, etc. + /directory/counties
- How it works → /directory, /search
- For firms → /criminal-solicitor-police-station, /PoliceStationCover
- For reps → /register, /CustodyNote
- Blog preview → 3 latest /Blog/{slug}
- FAQ → embedded (no link needed — on-page schema)

### From County Pages
- Up → /directory (breadcrumb)
- Down → /rep/{slug} for each rep in county
- Across → Nearby county pages
- Down → /police-station/{station} for local stations
- Context → Relevant blog articles

### From Station Pages
- Up → County page (breadcrumb)
- Across → /rep/{slug} for covering reps (prominently)
- Context → /PACE, /police-station-representative

### From Rep Profiles
- Up → /directory/{county} (breadcrumb)
- Across → /police-station/{station} for covered stations
- Context → /Blog articles about rep practice
- Tool → /CustodyNote (if applicable)

### From Blog Articles
- Minimum 3 internal links to directory pages (enforced by CI)
- Link to /police-station-representative or other pillar content
- Link to /register (CTA)
- Footer link to policestationagent.com (already implemented)

---

## 11. AUTHORITY FLOW MODEL

```
                    Homepage (highest authority)
                         │
            ┌────────────┼────────────┐
            │            │            │
       /directory   /police-station  /Blog
       (hub)        -representative  (content hub)
            │        (cornerstone)        │
    ┌───────┼───────┐       │       ┌────┼────┐
    │       │       │       │       │    │    │
 /dir/   /dir/   /dir/   guides  post  post  post
 kent   london  essex     │        │
    │       │       │      │        │
    └───┬───┘       │      └────────┘
        │           │     (cross-link)
   /rep/{slug}  /police-station/{station}
        │              │
        └──────────────┘
        (mutual cross-links)
```

**Authority flows DOWN from homepage through hubs to individual pages.**
**Authority flows BACK UP through breadcrumbs and contextual "back to" links.**
**Authority flows ACROSS through cross-links between reps and stations, between blog posts and directory pages.**

---

## 12. GENUINELY MISSING PAGES

| URL | Purpose | Target Keyword | Why Needed |
|-----|---------|---------------|------------|
| /find-a-rep | Redirect to /directory | "find a police station rep" | Exact-match URL for the #1 target search query. Currently no URL contains "find-a-rep". Create as a 301 redirect to /directory. |
| /police-station-rep-manchester | Regional SEO page | police station rep Manchester | Kent/London/Essex exist but no Manchester page. Manchester is the 3rd largest legal market. |
| /police-station-rep-birmingham | Regional SEO page | police station rep Birmingham | Same gap — 2nd largest city, no landing page. |

**That is it.** Only 3 genuinely missing items — one redirect and two regional pages matching the existing /police-station-rep-kent pattern. Everything else already exists.

---

## 13. TOP 10 PRIORITY CHANGES

| # | Change | File(s) | Impact |
|---|--------|---------|--------|
| 1 | **Rewrite homepage title** to "Find a Police Station Rep — UK Representative Directory" (57 chars) | app/page.tsx metadata | High — fixes truncation, leads with action keyword |
| 2 | **Rewrite homepage H1** to "Find a Police Station Representative — UK Directory" | components/HomeHero.tsx | High — matches search intent |
| 3 | **Rewrite homepage meta description** to include "894 stations" and "300+ reps" | app/page.tsx metadata | High — improves CTR from SERPs |
| 4 | **Move HomeSeoConversionHub to position 3** (after stats strip, before everything else) | app/page.tsx section order | High — puts definitional SEO content where Google reads it |
| 5 | **Move CustodyNote/ToolsForReps to position 10** (after reps, trust, why-choose) | app/page.tsx section order | High — stops diluting directory positioning |
| 6 | **Remove HomeKentSpotlight from homepage** | app/page.tsx | Medium — eliminates regional bias on national page |
| 7 | **Move platform disclaimer to bottom** of homepage | app/page.tsx | Medium — frees prime real estate for SEO content |
| 8 | **Add /find-a-rep 301 redirect** to /directory | middleware or vercel.json | Medium — captures exact-match search intent |
| 9 | **Create /police-station-rep-manchester** using existing county-seo template | app/ or lib/county-seo-pages.ts | Medium — fills the biggest regional gap |
| 10 | **Add "Representatives covering this station" section** to top of every station page | app/police-station/[station]/page.tsx | Medium — links 894 station pages to rep profiles |

---

## 14. FASTEST WINS

### 5 Homepage SEO Improvements
1. Shorten title to 57 chars, lead with "Find a Police Station Rep"
2. Rewrite H1 to lead with action verb
3. Move definitional content (HomeSeoConversionHub) to position 3
4. Move CustodyNote promo below the fold (position 10)
5. Remove Kent spotlight from national homepage

### 5 Internal Linking Improvements
1. Add "Browse all counties" link above the fold on homepage
2. Every station page: prominently link to covering reps
3. Every rep profile: link to covered stations
4. Blog articles: ensure each links to at least one specific county page (not just /directory)
5. Add /police-station-representative link in homepage hero quick links

### 5 Authority Signal Improvements
1. Update stats strip to use real data: "{reps.length}" not hardcoded "300+"
2. Add "Founded by Robert Cashman, Duty Solicitor" more visibly on homepage
3. Add structured data for founder (Person schema linked to Organization)
4. Add "Independent directory — not tied to any agency" trust badge
5. Surface blog publication dates and update frequency in homepage blog section

### 5 Content Depth Improvements
1. Add 2-3 sentence unique intro to each of the 32 county pages
2. Expand /police-station-representative to 3,000+ words (definitional cornerstone)
3. Create /police-station-rep-manchester and /police-station-rep-birmingham
4. Add FAQ schema to /PoliceStationCover and /HowToBecomePoliceStationRep
5. Ensure every wiki article links to at least one directory page and one blog article

---

*Implementation-ready audit for policestationrepuk.org*
*Based on live codebase analysis, 31 March 2026*
