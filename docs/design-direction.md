# Design direction

Clean, professional legal service website. Quality bar: **Stripe, Linear, Vercel** — modern SaaS marketing with strong typography, generous whitespace, and clear hierarchy. Avoid clutter.

---

## Design style

- **Clean professional legal** — Suitable for solicitors and accredited reps; calm, credible, no visual noise.
- **Comparable to:** Stripe, Linear, Vercel (modern SaaS marketing pages).
- **Strong typography** — Clear type scale, readable body, confident headings.
- **Whitespace** — Generous padding and margins; let content breathe.
- **Clear hierarchy** — One main idea per section; headlines > subtext > body; single primary CTA where it matters.
- **Avoid clutter** — Fewer links in nav, no redundant decoration, no dense blocks of links.

---

## Visual style

### Colour

Defined in `app/globals.css` (CSS variables). Navy & gold palette matching the live site:

| Variable | Value | Use |
|----------|--------|-----|
| `--navy` | `#0b1a2e` | Header, footer, hero backgrounds |
| `--gold` | `#d4a843` | Primary CTA, accent colour, trust badges |
| `--background` | `#f5f7fa` | Page background (light blue-grey) |
| `--foreground` | `#0b1a2e` | Body text, headings |
| `--muted` | `#4a5e78` | Secondary text, captions |
| `--border` | `#d1d9e6` | Borders, dividers |
| `--card-bg` | `#ffffff` | Card backgrounds |

- **Backgrounds:** Light blue-grey (`--background`) for page; white for cards; navy for headers/CTAs.
- **Text:** Navy for primary; muted blue-grey for secondary.
- **CTAs:** Gold for primary action buttons; navy for secondary; outline for tertiary.

### Typography

- **Font:** Inter (`next/font/google`) — set in `app/layout.tsx`, applied via `font-sans` and CSS variable `--font-inter`.
- **Scale:** Large, confident headlines (e.g. 2rem–2.5rem for h1); clear step-down for h2/h3; comfortable body size (1rem).
- **Line height:** 1.5–1.6 body; 1.25–1.35 headings.
- **Weight:** Semibold/bold for headings; regular for body; medium for labels and nav.
- **Whitespace:** Ample margin above/below sections; avoid cramped line-length (max-width on content).

---

## Layout and components

### Reusable layout

- **Header** — Minimal: logo/site name, few nav links, one primary CTA. Plenty of horizontal padding; thin or no border.
- **Footer** — Simple: copyright, small set of links (Directory, Contact, Register, Privacy, Terms). Muted text; no visual clutter.
- **Main content** — Centred, max-width (e.g. 48rem content, 72rem for directory); consistent vertical rhythm (space-y-16 or equivalent for sections).

### Call-to-action

- **One primary CTA** per screen or section where relevant (Register, Send message, Go to CustodyNote).
- Primary: solid `--accent`, white text, rounded (e.g. 6px), comfortable padding; hover state slightly darker.
- Secondary: text or subtle border; never compete with the primary.

### Directory

- **Listings** — Scannable cards or rows: name prominent, accreditation and counties as muted supporting line; phone as clear link. Avoid heavy borders or shadows.
- **Filters** — Simple controls; subtle borders; results count clearly visible.
- **Avoid clutter** — Don’t pack every field into one block; use hierarchy (name > accreditation > counties > contact).

### Forms

- Labels above inputs; generous spacing between fields; single primary submit button.
- Success/error: one clear message, minimal styling (e.g. subtle background + text).

---

## Technical constraints

- **Tailwind only** — No external site CSS; all styles via Tailwind and `app/globals.css`.
- **CSS variables** — Use `var(--primary)`, `var(--accent)`, etc. so colours can be tuned in one place.
- **Responsive** — Mobile-first; nav and grids adapt (flex-wrap, grid, breakpoints) so the site works on small screens.

---

## Where to change things

| Change | File / place |
|--------|------------------|
| Colours, body font, base spacing | `app/globals.css` (`:root`, `body`) |
| Header nav and logo | `components/Header.tsx` |
| Footer links and copy | `components/Footer.tsx` |
| Directory card layout | `components/RepCard.tsx` |
| Directory filters and results layout | `components/DirectorySearch.tsx`, `DirectoryFilters.tsx` |
| Page-level max width and padding | Per-page containers in `app/*/page.tsx` |

Keeping these consistent will preserve the intended professional, legal look and clear CTAs across the site.
