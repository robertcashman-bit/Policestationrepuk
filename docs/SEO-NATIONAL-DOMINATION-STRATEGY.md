# National Domination Strategy: policestationrepuk.org

**Date:** 31 March 2026
**Objective:** Replace policestationreps.com as the #1 UK platform for police station representatives
**Secondary:** Integrate CustodyNote as the default professional tool

---

## 1. SUMMARY

policestationrepuk.org is a technically superior, modern Next.js directory with 180+ reps, 894 stations, 32 counties, 21 blog articles, 45 wiki articles, and comprehensive SEO infrastructure. The competitor (policestationreps.com) is an outdated PHP site claiming ~1,500 reps but running on legacy technology with no structured data, poor mobile experience, and stale content.

**The gap is not technical — it is content depth, rep count, and domain age.** The competitor has been live since ~2008 and has accumulated backlinks and rep registrations over 18 years. policestationrepuk.org has superior architecture but needs to exploit that advantage with scale, topical authority, and network effects.

**Verdict:** policestationrepuk.org can overtake within 6-12 months with disciplined execution of the strategy below.

---

## 2. CURRENT POSITIONING

policestationrepuk.org currently positions as:

- **Primary:** A free directory connecting criminal defence firms with accredited police station representatives
- **Secondary:** A knowledge hub for PACE, custody procedures, rep careers, and legal aid billing
- **Tertiary:** A CustodyNote promotion channel

**Brand identity:** "PoliceStationRepUK" — clear, keyword-rich, authoritative.
**Legal entity:** Defence Legal Services Ltd.
**Domain:** .org (trust signal for non-commercial/community positioning).

---

## 3. STRUCTURAL MAP

```
Homepage (/)
├── Directory Hub (/directory)
│   ├── County pages (/directory/{county}) × 32
│   ├── Counties index (/directory/counties)
│   └── Rep profiles (/rep/{slug}) × ~180
├── Stations Directory (/StationsDirectory)
│   └── Station pages (/police-station/{station}) × 894
├── Blog (/Blog)
│   └── Articles (/Blog/{slug}) × 21
├── Wiki (/Wiki)
│   └── Articles (/Wiki/{slug}) × 45
├── Legal Updates (/LegalUpdates)
│   └── Updates (/LegalUpdates/{slug}) × 7
├── SEO Landing Pages
│   ├── /police-station-representative
│   ├── /criminal-solicitor-police-station
│   ├── /free-legal-advice-police-station
│   ├── /police-station-rights-uk
│   ├── /police-station-rep-kent
│   ├── /police-station-rep-london
│   ├── /police-station-rep-essex
│   └── /police-station-representatives-directory-england-wales
├── Guide Pages (20+)
│   ├── /HowToBecomePoliceStationRep
│   ├── /WhatDoesRepDo
│   ├── /DutySolicitorVsRep
│   ├── /PACE
│   ├── /InterviewUnderCaution
│   └── ... (career, billing, disclosure, etc.)
├── Tools
│   ├── /EscapeFeeCalculator
│   ├── /FormsLibrary
│   ├── /CustodyNote
│   ├── /Map
│   └── /UpdateStation
├── Community
│   ├── /WhatsApp
│   ├── /Forum
│   ├── /register
│   └── /GetWork
└── Legal/Corporate (Privacy, Terms, GDPR, etc.)
```

**Total indexable URLs:** ~1,200+ (94 static routes + ~180 rep profiles + 894 station pages + 21 blog + 45 wiki + 7 legal updates + 32 county pages + 13 county-seo redirects)

---

## 4. STRENGTHS

| Strength | Detail |
|----------|--------|
| **Modern tech stack** | Next.js 15 with SSG, ISR, structured data, optimised images, Vercel edge |
| **Rich structured data** | JSON-LD on every page type: Organization, WebSite, BlogPosting, FAQ, BreadcrumbList, Person, GovernmentBuilding |
| **894 police stations** | Every custody suite in England & Wales with contact details — competitor has similar but in a flat PHP database |
| **180+ rep profiles** | Each with dedicated URL, structured data, county/station coverage |
| **32 county directory pages** | Filterable, with station counts and rep listings |
| **SEO-first architecture** | Canonical URLs, sitemap, robots.txt, OG tags, Twitter cards on every page |
| **21 professional blog articles** | Passing automated SEO audit (meta length, internal links, FAQ schema) |
| **45 wiki articles** | Covering offences, PACE, procedures, billing |
| **Tools** | Escape Fee Calculator, Forms Library, Map, Station Update system |
| **Community** | WhatsApp group, Forum, registration system |
| **CustodyNote integration** | Professional tool cross-promotion throughout |
| **Domain: .org** | Perceived authority and non-commercial trust |
| **Mobile-first design** | Responsive, modern UI vs competitor's dated layout |
| **Free model** | No paywall, no middleman fees |

---

## 5. WEAKNESSES (CRITICAL — WHY NOT #1 YET)

### W1. Rep Count Gap
- **Us:** ~180 reps
- **Them:** Claim 1,500 reps
- **Impact:** Massive. Google sees their directory as more comprehensive. Firms see more choice.
- **Fix:** Aggressive registration drive + scraped data enrichment + "claim your profile" system.

### W2. Homepage Title Misses Primary Keywords
- **Current:** "Police Station Reps UK | Find Police Station Representatives" (62 chars)
- **Problem:** Does not target "police station representative directory" or "find a police station rep" explicitly.
- **Fix:** "Find a Police Station Rep | UK Representative Directory" (55 chars)

### W3. No Town-Level Pages
- **Problem:** The competitor has search results pages for every town. We have county pages only. Someone searching "police station rep Maidstone" finds them, not us.
- **Fix:** Programmatic town pages linking county → town → station → reps.

### W4. Thin County Pages
- **Problem:** County pages are lists of reps with minimal unique content. Google may see these as thin.
- **Fix:** Add county-specific introductory text, station lists, local custody information, and internal links.

### W5. No Force-Level Hub Pages
- **Problem:** "Kent Police reps" / "Metropolitan Police reps" etc. are high-value search terms with no dedicated pages.
- **Fix:** Create /directory/force/{force-slug} pages that map forces to stations and reps.

### W6. Blog Volume Too Low
- **Current:** 21 articles.
- **Competitor:** Wiki with 80+ articles.
- **Fix:** Scale to 50+ articles targeting long-tail rep keywords.

### W7. No "Find a Rep" Prominent in URL Structure
- **Problem:** /directory is generic. /find-a-rep would be a keyword-rich canonical.
- **Fix:** Create /find-a-rep as an alias/redirect to /directory, or use it as the primary slug.

### W8. Station Pages Lack Rep Coverage Data
- **Problem:** Station pages show station details but may not prominently list "X reps cover this station."
- **Fix:** Enrich station pages with rep listings, coverage radius, and "request cover" CTA.

### W9. No Backlink Strategy
- **Problem:** Competitor has 18 years of accumulated links from legal directories, forums, and law society sites.
- **Fix:** Guest posting on legal blogs, law society engagement, university law department outreach.

### W10. Kent-Heavy Positioning
- **Problem:** Multiple Kent-specific pages (Kent, Maidstone, Gravesend, Sevenoaks, etc.) but no equivalent for other high-demand areas (London, Manchester, Birmingham, Leeds).
- **Fix:** Create equivalent landing pages for top 20 population centres.

---

## 6. COMPETITOR GAP ANALYSIS — policestationreps.com

### Why They Rank

| Factor | Detail |
|--------|--------|
| **Domain age** | ~18 years (est. 2008). Massive trust signal. |
| **Rep count** | 1,500 claimed. More profiles = more indexable pages = more long-tail traffic. |
| **Exact-match domain** | "policestationreps.com" — exact keyword match for "police station reps" |
| **Wiki depth** | 80+ wiki pages covering offences, PACE, billing — each indexable |
| **Search by 7 methods** | Station, force, county, town, address, postcode, custody number |
| **Established brand** | Known in the profession, linked from legal forums |
| **No Comment affiliation** | Backed by the UK's largest rep agency — authority by association |

### Where They Are Weak

| Weakness | Our Opportunity |
|----------|----------------|
| **Ancient PHP tech** | No SSG, no structured data, no JSON-LD, no mobile optimisation |
| **No structured data** | Zero schema markup — we have Organization, WebSite, FAQ, BlogPosting, Person, etc. |
| **Poor mobile UX** | Table-based layout, tiny text, no responsive design |
| **No blog SEO** | Their "blog" is a single PHP page with anchors, not individual indexable posts |
| **No canonical URLs** | Duplicate content issues (rates.php/legalupdates.php in search results) |
| **Stale content** | References from 2018, Parliamentary Review, pre-COVID advice still prominent |
| **No HTTPS in some internal links** | Mixed content signals |
| **Agency promotion** | Heavy "No Comment" branding makes it feel like an agency site, not a neutral directory |
| **No conversion funnel** | No email capture, no professional tools, no CustodyNote equivalent |
| **No individual station pages** | Stations are only in search results, not dedicated URLs |
| **No county content pages** | Flat search results, no SEO-optimised county hubs |

### Exact Opportunities to Beat Them

1. **Structured data advantage:** Google's rich results will prefer our JSON-LD marked pages for rep profiles, FAQ snippets, and directory listings.

2. **Station page supremacy:** We have 894 individual station URLs; they have zero. This is ~894 pages of indexable, unique content they cannot match without a rebuild.

3. **Content velocity:** Their wiki is static and stale. We can publish 2-3 blog posts/week and outpace them within months.

4. **Mobile-first indexing:** Google uses mobile-first indexing. Their site is barely usable on mobile. We are fully responsive.

5. **Speed:** Next.js SSG on Vercel edge vs PHP on shared hosting. Core Web Vitals advantage is significant.

6. **Neutral positioning:** They are tied to "No Comment" (an agency). We are an independent directory. Firms prefer neutral platforms.

7. **Professional tools:** CustodyNote, Escape Fee Calculator, Forms Library — sticky features they do not have.

---

## 7. NATIONAL DOMINATION STRATEGY

### 7.1 Core Positioning

**Define the site as:** "The UK Police Station Representative Network"

**Tagline:** "Find, connect with, and support accredited police station representatives across England & Wales"

**Reinforce across:**

| Surface | Implementation |
|---------|---------------|
| Homepage H1 | "Find a Police Station Representative — UK Directory" |
| Meta title | "Find a Police Station Rep | UK Representative Directory" |
| Directory page | "Police Station Representatives Directory — England & Wales" |
| Footer | "The UK's free police station representative network" |
| JSON-LD Organization.description | Include "UK police station representative directory" |
| Blog author bios | "Published by PoliceStationRepUK, the UK's police station representative network" |

### 7.2 Topical Authority Structure

```
LEVEL 1: UK Hub
├── / (homepage — national positioning)
├── /police-station-representative (definitional cornerstone)
├── /directory (directory hub)
│
LEVEL 2: Regions (NEW — create these)
├── /directory/region/london-and-south-east
├── /directory/region/midlands
├── /directory/region/north-west
├── /directory/region/north-east-and-yorkshire
├── /directory/region/south-west
├── /directory/region/east-of-england
├── /directory/region/wales
│
LEVEL 3: Counties (EXISTING — enrich)
├── /directory/{county} × 32
│
LEVEL 4: Towns / Stations (PARTIAL — expand)
├── /police-station/{station} × 894 (existing)
├── /directory/{county}/{town} (NEW — programmatic)
│
LEVEL 5: Rep Profiles (EXISTING)
├── /rep/{slug} × 180+
```

**Implementation without duplication:**
- Region pages aggregate county pages (no duplicate listings — use county cards with rep counts)
- Town pages are sub-filters of county pages (show reps covering that town + local stations)
- Station pages already exist — add "reps covering this station" section more prominently

### 7.3 Directory Domination

**Increase indexable pages:**

| Action | New Pages | Priority |
|--------|-----------|----------|
| Region hub pages (7) | +7 | Week 2 |
| Town pages (top 100 towns with stations) | +100 | Week 2-3 |
| Force hub pages (43 forces) | +43 | Week 2 |
| "Claim your profile" pages for unclaimed reps | +500-1000 | Week 3-4 |

**Enrich rep profiles:**
- Add "years of experience" field
- Add "accreditation type" field
- Add "languages spoken" field
- Add "specialisms" (e.g., serious crime, fraud, youth)
- Add "availability" indicator (available / busy / unavailable)
- Add "verified" badge system
- Add "response time" average
- Add CustodyNote user badge

**Improve crawl depth:**
- Every station page links to covering reps
- Every rep profile links to covered stations
- Every county page links to local stations
- Every blog article links to relevant directory pages
- Homepage links to all region hubs

### 7.4 Programmatic SEO

**County pages (existing — enrich):**
Each `/directory/{county}` page should contain:
- H1: "Police Station Representatives in {County}"
- Unique intro paragraph about rep availability in that county
- Number of reps, number of stations
- List of major towns with station links
- FAQ schema specific to that county
- Internal links to region hub and national directory

**Town pages (NEW):**
Template: `/directory/{county}/{town}`
- H1: "Police Station Reps in {Town}, {County}"
- List of stations in/near that town
- Reps covering those stations
- Link up to county page
- Link down to individual station pages
- Structured data: Place + ItemList
- Unique text: "There are X police stations near {Town}. Y accredited representatives cover this area."

**Force pages (NEW):**
Template: `/directory/force/{force-slug}`
- H1: "Police Station Representatives — {Force Name}"
- All stations under that force
- All reps covering those stations
- Coverage map
- Links to county pages within that force's area

**Station pages (existing — enrich):**
Each `/police-station/{station}` should add:
- "Representatives covering this station" section with rep cards
- "Request cover at this station" CTA
- FAQ: "How do I find a rep for {Station Name}?"
- Internal links to county, force, and town pages

### 7.5 Content Authority Layer

**Pillar content strategy:**

| Pillar | URL | Status | Action |
|--------|-----|--------|--------|
| What is a police station representative | /police-station-representative | EXISTS | Expand to 3000+ words |
| How police station cover works | /PoliceStationCover | EXISTS | Expand, add FAQ schema |
| How reps get work | /GetWork | EXISTS | Add real data, testimonials |
| Police station procedures UK | /PACE | EXISTS | Expand codes, add video |
| Out of hours police station cover | /SolicitorPoliceStationCoverUK | EXISTS | Merge messaging, add case studies |
| How to become a police station rep | /HowToBecomePoliceStationRep | EXISTS | Expand to definitive 5000-word guide |
| Police station rep pay/rates | /PoliceStationRepPay + /PoliceStationRates | EXISTS | Merge into single authoritative page |

**New content targets (blog):**

| # | Target Keyword | Slug |
|---|---------------|------|
| 1 | police station rep Manchester | police-station-reps-manchester |
| 2 | police station rep Birmingham | police-station-reps-birmingham |
| 3 | police station rep Leeds | police-station-reps-leeds |
| 4 | police station rep Liverpool | police-station-reps-liverpool |
| 5 | police station rep Bristol | police-station-reps-bristol |
| 6 | how much do police station reps earn | how-much-do-police-station-reps-earn |
| 7 | police station rep training | police-station-rep-training-guide |
| 8 | police station rep accreditation 2026 | police-station-rep-accreditation-2026 |
| 9 | PACE Code C summary | pace-code-c-summary-for-reps |
| 10 | custody record explained | custody-record-explained |
| 11 | what happens at a police station interview | what-happens-police-station-interview |
| 12 | police station rep vs solicitor | police-station-rep-vs-solicitor-difference |
| 13 | how to claim escape fees | how-to-claim-escape-fees-guide |
| 14 | police station waiting times | police-station-waiting-times-uk |
| 15 | police station rep night work | police-station-rep-night-work-guide |

**Linking strategy from content:**
- Every blog article must contain >= 3 internal links to directory pages
- Every pillar page must link to directory, blog cluster, and tools
- Every content piece must include "Find a rep" CTA

### 7.6 Network Effect Moat

Features competitors cannot easily replicate:

1. **Live availability signals:** Allow reps to set "Available now" status. Show on directory cards. This creates real-time value that static directories cannot match.

2. **Rep verification system:** "Verified by PoliceStationRepUK" badge. Reps submit accreditation proof → manual review → verified status. Trust signal that cannot be gamed.

3. **Contribution-driven updates:** The /UpdateStation system already exists. Expand to allow reps to update their own profiles, add station notes, and contribute to wiki.

4. **Community integration:** WhatsApp group + Forum + Blog comments create a professional network. Competitors have Facebook only.

5. **Professional tools lock-in:** CustodyNote, Escape Fee Calculator, Forms Library — reps who use these daily return to the site. Sticky usage.

6. **Firm feedback system:** Allow firms to leave private notes on reps (not public reviews — professional context). Creates data moat.

### 7.7 Internal Linking Dominance

```
Homepage → Region hubs (7) → County pages (32)
County pages → Town pages (100) → Station pages (894)
Station pages → Rep profiles (180+)
Rep profiles → Station pages + County pages
Blog articles → Directory pages + Pillar content
Pillar content → Directory + Blog cluster
Tools (Calculator, Forms) → Directory + Blog
Every page → Homepage via breadcrumbs
Footer → All hub pages
```

**Specific link insertions needed:**

1. **Homepage:** Add "Browse by region" section with links to all 7 region hubs
2. **Every station page:** Add "Find reps for {Station}" with links to covering reps
3. **Every rep profile:** Add "Also covers" section linking to all covered stations
4. **Every blog post:** Add contextual directory links (minimum 3 per article — already enforced by CI)
5. **Directory sidebar:** Add "Popular stations" widget linking to top station pages

---

## 8. CUSTODY NOTES PROGRAMME INTEGRATION

### Placement Strategy

| Location | Type | Copy |
|----------|------|------|
| Rep profiles | Badge | "Uses CustodyNote" on verified users |
| Station pages | Contextual | "Taking notes at {Station}? CustodyNote structures your attendance notes automatically." |
| /PACE page | Tool reference | "Use CustodyNote to document PACE compliance during attendance" |
| Blog articles (bottom) | Already implemented via BlogCustodyNotePromo | Keep current implementation |
| /FormsLibrary | Featured tool | "CustodyNote replaces paper forms with structured digital notes" |
| Directory right panel | Already implemented via CustodyNoteInlineCTA | Keep current implementation |
| Homepage | Already implemented via HomeCustodyNote + ToolsForRepsSection | Keep |

### SEO Layer for CustodyNote

| Keyword | Page | Implementation |
|---------|------|----------------|
| custody notes template | /CustodyNote | Already exists — enrich with template content |
| police station attendance notes | /Blog/attendance-notes-guide | NEW blog article |
| digital custody notes | /CustodyNote | Add section |
| police station interview notes | /Blog/interview-notes-best-practice | NEW blog article |

### Conversion Pathways

```
Directory search → Rep profile → "CustodyNote user" badge → CustodyNote page
Blog article → Inline CTA → CustodyNote trial
Station page → "Taking notes here?" → CustodyNote
Exit intent popup → Free template → Email capture → CustodyNote drip
```

**Key principle:** CustodyNote must feel like a natural part of the professional ecosystem, not an advertisement. Position as "the tool reps use" not "the tool we sell."

---

## 9. HOMEPAGE — OPTIMISED COPY

### SEO Title (55 chars)
```
Find a Police Station Rep | UK Representative Directory
```

### Meta Description (152 chars)
```
Free directory of accredited police station representatives across England & Wales. Search by county, station or name. 300+ reps, 894 stations. Join free.
```

### H1
```
Find a Police Station Representative — UK Directory
```

### Section Structure (revised order for SEO + conversion)

1. **Hero** — H1, subtitle, search CTAs, trust badges
2. **Stats strip** — "300+ Reps · 894 Stations · 43 Forces · Free Since 2016"
3. **"What is a police station representative?"** — definitional content for featured snippets
4. **Search/Directory CTA** — prominent "Find a Rep" with county quick-links
5. **Coverage map** — "Browse by region" with links to all region hubs
6. **How it works** — 3-step process (Contact → Allocate → Attend)
7. **For firms / For reps** — split panel with targeted messaging
8. **Professional tools** — CustodyNote, Calculator, Forms (subtle integration)
9. **Recent blog articles** — content freshness signal
10. **Testimonials** — social proof
11. **FAQ** — 15 questions with FAQPage schema
12. **Register CTA** — "Join 300+ representatives" conversion

### Key Copy Changes

**Current H1:** "The UK's Free Directory of Police Station Representatives"
**New H1:** "Find a Police Station Representative — UK Directory"

**Rationale:** "Find a police station rep" is the primary search intent. Leading with the action verb matches what users type.

**Current title tag:** "Police Station Reps UK | Find Police Station Representatives" (62 chars — over limit)
**New title tag:** "Find a Police Station Rep | UK Representative Directory" (55 chars)

---

## 10. QUICK WINS

### 5 Structural Fixes

1. **Shorten homepage title** to under 60 characters with primary keyword first
2. **Add `hreflang` tags** — `en-GB` for all pages (signals UK-specific content to Google)
3. **Create `/find-a-rep` redirect** to `/directory` — captures exact-match search intent
4. **Add `lastModified` to rep profiles** in sitemap using profile update dates
5. **Remove duplicate content** between /HowToBecome and /HowToBecomePoliceStationRep (consolidate to one URL, 301 the other)

### 5 Internal Linking Improvements

1. **Every station page:** Add "Representatives covering this station" section with rep card links
2. **Blog articles:** Ensure every article links to at least one county directory page (not just /directory)
3. **Homepage:** Add "Browse by region" links above the fold
4. **Rep profiles:** Add "Other reps in {County}" section
5. **Footer:** Add top 10 county directory links (currently only has general navigation)

### 5 Content Improvements

1. **Expand /police-station-representative** to 3,000+ words — this is the definitional page Google wants for "police station representative"
2. **Create "Police Station Rep Pay 2026"** comprehensive guide (people also ask: "how much do police station reps get paid")
3. **Add county-specific intro text** to every /directory/{county} page (currently just a list)
4. **Publish 2 blog articles per week** for 3 months (target: 50 total articles)
5. **Create a "Police Station Rep Statistics" page** — UK-wide data that journalists and bloggers will link to

### 5 UX Improvements

1. **Add instant search** to homepage hero (type station/county name, see results live)
2. **Add "Available now" toggle** to rep profiles
3. **Improve directory card density** — show phone/WhatsApp icons directly on cards
4. **Add "Share this rep" button** on profiles (WhatsApp share for mobile)
5. **Add "Compare reps" shortlist feature** for firms evaluating multiple reps

### 5 Authority Signals

1. **Add "As featured in" section** if any press/legal publication mentions exist
2. **Add Law Society / SRA logo references** where applicable (as context, not endorsement)
3. **Add "Founded by Robert Cashman, Duty Solicitor"** more prominently in footer/about
4. **Create a "Methodology" page** explaining how rep profiles are verified
5. **Add testimonials from named firms** (with permission) — named social proof outranks anonymous

---

## 11. EXECUTION ROADMAP

### Week 1: Foundation + Homepage

| Day | Task |
|-----|------|
| Mon | Update homepage title, meta description, H1 per strategy |
| Mon | Add hreflang en-GB to root layout |
| Tue | Consolidate duplicate pages (HowToBecome + HowToBecomePoliceStationRep) |
| Tue | Create /find-a-rep redirect to /directory |
| Wed | Expand /police-station-representative to 3,000+ words |
| Wed | Add county-specific intro text to top 10 county pages |
| Thu | Enrich top 20 station pages with "covering reps" section |
| Thu | Add "Browse by region" section to homepage |
| Fri | Deploy, validate sitemap, submit to Google Search Console |

### Week 2: Directory Structure + Scale

| Day | Task |
|-----|------|
| Mon | Create 7 region hub pages |
| Tue | Create force hub page template + generate 43 force pages |
| Wed | Create town page template + generate top 50 town pages |
| Thu | Add "Other reps in {County}" to rep profiles |
| Fri | Deploy, test, validate all new URLs in sitemap |

### Week 3: Content Velocity + Internal Linking

| Day | Task |
|-----|------|
| Mon | Publish 3 new blog articles (city-specific rep guides) |
| Tue | Publish 2 new blog articles (career/pay guides) |
| Wed | Add internal links: every station page → covering reps |
| Thu | Add internal links: every rep profile → covered stations |
| Fri | Add footer county links + "Browse by region" to key pages |

### Week 4: Authority + CustodyNote + Network Effects

| Day | Task |
|-----|------|
| Mon | Add "CustodyNote user" badge to rep profiles |
| Tue | Create "Methodology" / "How we verify reps" page |
| Wed | Add "Available now" status system to rep profiles |
| Thu | Launch "Claim your profile" campaign for unclaimed reps |
| Fri | Outreach: submit directory to legal resource lists, law school directories |

### Ongoing (Month 2+)

- 2 blog articles per week
- 10 new town pages per week
- Rep registration outreach (target: 50 new reps/month)
- Backlink acquisition (legal blogs, university law departments)
- Monitor rankings weekly for target keywords
- A/B test homepage CTA copy for conversion rate

---

## APPENDIX: TARGET KEYWORD MAP

| Keyword | Search Intent | Target Page | Priority |
|---------|--------------|-------------|----------|
| police station representative | Informational | /police-station-representative | P1 |
| police station rep | Navigational/Informational | Homepage + /directory | P1 |
| find a police station rep | Transactional | /directory | P1 |
| police station cover UK | Transactional | /PoliceStationCover | P1 |
| police station rep directory | Navigational | /directory | P1 |
| police station rep {county} | Local | /directory/{county} | P1 |
| police station rep {city} | Local | /directory/{county}/{town} | P2 |
| how to become a police station rep | Informational | /HowToBecomePoliceStationRep | P1 |
| police station rep pay | Informational | /PoliceStationRepPay | P1 |
| police station rep jobs | Transactional | /PoliceStationRepJobsUK | P2 |
| duty solicitor vs rep | Informational | /DutySolicitorVsRep | P2 |
| PACE codes of practice | Informational | /PACE | P2 |
| custody record review | Informational | /Blog/how-to-review-custody-record | P2 |
| police station rates 2026 | Informational | /PoliceStationRates | P2 |
| escape fee calculator | Tool | /EscapeFeeCalculator | P3 |
| custody notes template | Tool | /CustodyNote | P2 |
| police station interview tips | Informational | /Blog/pre-interview-consultation-rep-guide | P3 |

---

*Strategy authored for policestationrepuk.org — Defence Legal Services Ltd.*
