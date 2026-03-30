import type { BlogArticle } from './types';

const IMG = (slug: string, alt: string) => ({
  src: `/images/blog/raster/${slug}.webp`,
  alt,
  width: 1200,
  height: 675,
});

export const ARTICLES_BATCH_2: BlogArticle[] = [
  {
    slug: 'freelance-police-station-representative-vs-duty-solicitor',
    title: 'Freelance Police Station Representative vs Duty Solicitor: What Is the Difference?',
    metaTitle: 'Freelance Police Station Rep vs Duty Solicitor | Explained',
    metaDescription:
      'Freelance police station representative vs duty solicitor: how allocation works, who instructs whom, and when firms use each in England and Wales.',
    primaryKeyword: 'freelance police station representative vs duty solicitor',
    categories: ['law-firms', 'freelance-reps', 'best-practice'],
    published: '2026-03-17T09:00:00.000Z',
    modified: '2026-03-26T12:00:00.000Z',
    excerpt:
      'The labels are often mixed up. Here is a straight comparison of how duty solicitor schemes and privately instructed freelance reps fit into police station work.',
    summary:
      'Clarifies duty solicitor rota work versus firm-instructed freelance accredited representatives, including typical instruction paths, client expectations, and how the two roles can complement each other.',
    image: IMG(
      'freelance-police-station-representative-vs-duty-solicitor',
      'Graphic header: freelance police station representative compared with duty solicitor role'
    ),
    relatedSlugs: [
      'what-does-a-freelance-police-station-representative-do',
      'what-makes-a-good-police-station-representative',
      'how-firms-can-instruct-freelance-police-station-reps',
    ],
    faqs: [
      {
        q: 'Can the same person be both a duty solicitor and a freelance rep?',
        a: 'A solicitor might perform both functions in different contexts, but the *role on the day* depends on how they were engaged — rota duty versus instructed by a firm. The client should always know who is acting for them and on what basis.',
      },
      {
        q: 'Does legal aid pay the same for each?',
        a: 'Billing rules depend on the scheme, certificate, and stage of work. Firms should follow LAA guidance and their own billing team processes — this article does not give fee advice.',
      },
      {
        q: 'Can a firm use both on one file?',
        a: 'Sometimes the pathway changes as the case develops. The important point is clarity: record who attended, under what scheme or instruction, and how the client was advised. Use your firm’s PACE materials for process background — this article is not case-specific advice.',
      },
    ],
    bodyMarkdown: `
## Key takeaways

- **Freelance police station representative vs duty solicitor** is mainly about *how someone is engaged*: rota allocation versus firm instruction.
- Both pathways need clear file notes so clients, billing, and supervision stay coherent.
- Freelance reps often extend a firm’s strategy; duty solicitors may own the file or hand off — practices vary.

## Questions this article answers

- How does duty solicitor allocation differ from instructing a freelance rep?
- When might a firm still book freelance cover if duty exists?
- What should be recorded on the file after attendance?

## Two different front doors

**Duty solicitors** are typically accessed through a rota system when a detainee asks for the duty solicitor or when that pathway is otherwise engaged. The point is **scheme allocation**, not a standing relationship with a particular firm.

**Freelance police station representatives** are usually **instructed by a named criminal defence firm** that already represents the client (or is about to). The firm chooses the representative from its panel or network.

## Who is the client’s “lawyer”?

In both settings, clear communication matters. The detainee should understand **who is giving advice**, whether a solicitor will take over later, and how messages reach the firm that owns the file.

Freelance reps often act as the **eyes and ears** of an instructing fee earner. Duty solicitors may carry the file forward themselves or hand over to another department — practices vary by firm.

## Skill sets overlap — incentives differ

Accredited representatives and solicitors may share custody experience. The difference is often **governance**: who supervises, who holds professional indemnity for which elements, and what the accreditation scheme permits on the day.

Firms should not use freelance cover as a way to dodge supervision obligations. Equally, reps should not accept instructions outside their accreditation or without agreed reporting lines.

## When firms still book a freelance rep

Even where duty solicitor cover exists, firms frequently instruct freelance reps when:

- They need **their own strategy** followed to the letter.
- There is a **relationship** with a trusted rep in that town.
- **Capacity** on the duty rota is uncertain at busy times.
- **Conflict** or brand considerations make an external rota call unattractive.

## Practical takeaway

Write down **which pathway you used** on the file note: duty scheme versus instructed rep, with times and names. That single line prevents confusion at billing and at court later.

## Further reading

- [What a freelance rep actually does](/Blog/what-does-a-freelance-police-station-representative-do)
- [Duty solicitor context on this site](/DutySolicitorVsRep)

## Directory use

Whether you are a firm or a rep, the [accredited representative directory](/directory) is a neutral place to **match supply and demand** — it does not replace rota rules or professional obligations.

---

*General information — not legal advice.*
`.trim(),
  },
  {
    slug: 'common-mistakes-when-instructing-freelance-police-station-reps',
    title: 'Common Mistakes Firms Make When Instructing Freelance Police Station Representatives',
    metaTitle: 'Mistakes When Instructing Freelance Police Station Reps',
    metaDescription:
      'Avoid the common briefing, communication, and billing mistakes criminal defence firms make with freelance police station representatives — and what to do instead.',
    primaryKeyword: 'mistakes instructing freelance police station reps',
    categories: ['law-firms', 'best-practice'],
    published: '2026-03-16T09:00:00.000Z',
    modified: '2026-03-26T12:00:00.000Z',
    excerpt:
      'Thin briefs, vague strategy, and slow feedback loops create custody problems. Here are the mistakes we see most often — and straightforward fixes.',
    summary:
      'A practical list of operational mistakes firms make when instructing freelance accredited representatives, from missing risk flags to unclear escalation paths, with corrective habits that improve outcomes and relationships.',
    image: IMG(
      'common-mistakes-when-instructing-freelance-police-station-reps',
      'Graphic header: avoiding common mistakes when instructing freelance police station representatives'
    ),
    relatedSlugs: [
      'how-firms-can-instruct-freelance-police-station-reps',
      'what-to-include-in-a-police-station-brief',
      'why-fast-clear-communication-matters-in-police-station-representation',
    ],
    faqs: [
      {
        q: 'Is the biggest problem really the brief?',
        a: 'Often yes. A two-line email saves sixty seconds at the desk and can cost hours on the phone later. Investing five minutes in a structured brief usually pays off immediately.',
      },
      {
        q: 'What if we genuinely do not know the allegation detail yet?',
        a: 'Say so, and instruct how to handle limited disclosure — for example, seek maximum permissible disclosure before interview, or attend a voluntary slot to clarify scope first.',
      },
      {
        q: 'Should we route everything through the directory?',
        a: 'PoliceStationRepUK helps you discover reps; operational messaging should stay on your firm’s approved systems. Use the public directory to shortlist, then onboard through your panel process.',
      },
    ],
    bodyMarkdown: `
## Key takeaways

- **Mistakes instructing freelance police station reps** usually trace to thin briefs, vague strategy, slow callbacks, and weak feedback loops.
- Fix the handover template, escalation ladder, and billing assumptions before blaming “rep quality.”
- Panel reps are independent professionals — respect boundaries and data rules.

## Questions this article answers

- What briefing errors create the most custody friction?
- How should firms handle mid-attendance decisions and billing?
- What habits protect relationships with freelance representatives?

## 1. The “title-only” brief

These **mistakes instructing freelance police station reps** are easy to avoid once you see them. Sending only an offence label (“GBH — Maidstone”) forces the rep to reconstruct context under pressure. Fix: use the template in [what to include in a brief](/Blog/what-to-include-in-a-police-station-brief).

## 2. Ambiguous strategy

“We’ll play it by ear” is not an instruction. Either delegate clearly with boundaries or nominate someone reachable for a five-minute decision.

## 3. Hiding vulnerabilities

If the client needs an AA or interpreter, **say it early**. Discovering literacy issues ten minutes before interview helps nobody.

## 4. Slow responses mid-custody

Custody moves fast. If nobody picks up the escalation line, the rep is left between bad choices. Use [communication norms](/Blog/why-fast-clear-communication-matters-in-police-station-representation) your night team actually follows.

## 5. Billing surprises

Agree **who pays**, cancellation rules, and mileage assumptions up front. Disputes after the fact burn relationships.

## 6. No feedback loop

If notes were good, say so. If they were late or unclear, say that too. Reps adjust; silence does not teach.

## 7. Treating reps like employees

Panel reps are **independent professionals**. Instructions should respect that — including data protection and supervision boundaries.

## 8. Skipping post-attendance routing

Notes that sit unread in a shared mailbox miss bail dates. Assign someone to **acknowledge and file** the same day.

## Build better panels

Combine this article with [out-of-hours network planning](/Blog/out-of-hours-police-station-cover-for-law-firms) so you are not always calling the same exhausted name at 2 a.m.

---

*Practice management guidance — not legal advice.*
`.trim(),
  },
  {
    slug: 'best-practice-handover-notes-after-police-station-attendance',
    title: 'Best Practice Handover Notes After Police Station Attendance',
    metaTitle: 'Police Station Handover Notes: Best Practice for Reps & Firms',
    metaDescription:
      'How to write police station handover notes that instructing firms can rely on: structure, disclosure, outcomes, and follow-ups for freelance representatives.',
    primaryKeyword: 'police station handover notes',
    categories: ['best-practice', 'attendance', 'law-firms'],
    published: '2026-03-15T09:00:00.000Z',
    modified: '2026-03-26T12:00:00.000Z',
    excerpt:
      'Good handover notes reduce repeat calls and protect the client. Use a consistent structure so fee earners see the same information every time.',
    summary:
      'Describes a professional structure for post-attendance reporting from freelance reps to instructing solicitors: timings, disclosure, advice summary boundaries, outcomes, and explicit next actions.',
    image: IMG(
      'best-practice-handover-notes-after-police-station-attendance',
      'Graphic header: professional handover notes after police station attendance'
    ),
    relatedSlugs: [
      'police-station-attendance-checklist',
      'why-fast-clear-communication-matters-in-police-station-representation',
      'how-firms-can-instruct-freelance-police-station-reps',
    ],
    faqs: [
      {
        q: 'How detailed should the interview account be?',
        a: 'Enough for the firm to run the file — themes, key answers, admissions/denials at a high level — without turning into a full transcript unless the firm asks for that separately.',
      },
      {
        q: 'Should reps give opinions on prospects?',
        a: 'Be cautious. Factual reporting plus clear questions back to the firm is usually safer than bold predictions, unless you have a specific role agreement allowing evaluative comment.',
      },
      {
        q: 'Where should firms store the notes?',
        a: 'Use the firm’s case system or encrypted channels. If you are comparing reps, read the in-site article on what makes a good police station representative for traits that show up in written work.',
      },
    ],
    bodyMarkdown: `
## Key takeaways

- **Police station handover notes** should follow the same headings every time: metadata, disclosure, advice summary, outcome, tasks, risks.
- Factual tone beats advocacy in notes; flag questions back to the firm instead of bold predictions.
- Send on approved secure channels and acknowledge receipt on the firm side.

## Questions this article answers

- What structure do fee earners actually read at midnight?
- How much interview detail belongs in a handover?
- How should confidentiality and storage be handled?

## Why structure beats prose

**Police station handover notes** work best when they follow a predictable shape. Fee earners skim at speed. **Headings and bullets** beat long paragraphs. A predictable order means nothing important is missed when someone tired is reading at midnight.

## Suggested layout

### 1. Metadata

- Date and times **in / out**
- Custody suite and officer names if recorded
- Representative name and instructing firm/file ref

### 2. Disclosure summary

What the officer said they would rely on — exhibits, summaries, keys dates. Note **what you did not receive** if that affects advice.

### 3. Client instructions and advice (high level)

Summarise the **interview approach** agreed with the client and any mid-interview changes after further advice. Avoid unnecessary adjectives; stick to what happened.

### 4. Outcome

Charge, NFA, bail, RUI, voluntary rearrangement, or other. Copy **conditions and dates** carefully.

### 5. Immediate actions for the firm

List **who** must do **what** by **when**: obtain medical records, chase CCTV, speak to ID officer, etc.

### 6. Risk flags

Safeguarding, bail risk, media risk, or anything that should sit on the file cover.

## Tone and confidentiality

Send through **secure channels**. If you must phone first, follow with written confirmation. Do not forward custody material to personal email.

## For firms receiving notes

Acknowledge receipt. If the rep missed something, ask once clearly — they usually prefer a direct question to silent disappointment. If you are building a panel, pair note quality with [how firms instruct freelance reps](/Blog/how-firms-can-instruct-freelance-police-station-reps).

## Link to attendance discipline

Pair this habit with the [attendance checklist](/Blog/police-station-attendance-checklist) so field work and reporting stay aligned. Firms can also brief against [what to include in a police station brief](/Blog/what-to-include-in-a-police-station-brief) so reps receive consistent inputs.

---

*Professional standards guidance — not legal advice.*
`.trim(),
  },
  {
    slug: 'out-of-hours-police-station-cover-for-law-firms',
    title: 'Out-of-Hours Police Station Cover: How Firms Can Build a Reliable Freelance Network',
    metaTitle: 'Out of Hours Police Station Cover for Law Firms | Network Guide',
    metaDescription:
      'Build reliable out-of-hours police station cover with freelance reps: map demand, split time bands, plan geography, vet panels, and run clear night escalations.',
    primaryKeyword: 'out of hours police station cover',
    categories: ['law-firms', 'best-practice'],
    published: '2026-03-14T09:00:00.000Z',
    modified: '2026-03-26T12:00:00.000Z',
    excerpt:
      'Out-of-hours cover fails when firms rely on a single name or vague “someone will go”. Here is how to design a small, resilient freelance panel.',
    summary:
      'Explains how solicitors’ firms map custody demand, split geography and time bands, vet freelance reps, and run low-drama escalations so overnight police station work is predictable.',
    image: IMG(
      'out-of-hours-police-station-cover-for-law-firms',
      'Graphic header: out of hours police station cover network for criminal defence firms'
    ),
    relatedSlugs: [
      'how-firms-can-instruct-freelance-police-station-reps',
      'what-makes-a-good-police-station-representative',
      'common-mistakes-when-instructing-freelance-police-station-reps',
    ],
    faqs: [
      {
        q: 'How many reps should we list per area?',
        a: 'Aim for at least two viable contacts per band (weeknight vs weekend) for each cluster of custody suites you actually use. One name is not a network.',
      },
      {
        q: 'Should we pay retainers?',
        a: 'Some firms do; others rely on per-attendance fees. That is a commercial decision — document it either way so expectations match.',
      },
      {
        q: 'How does PoliceStationRepUK help with out-of-hours cover?',
        a: 'It is a discovery layer for accredited representatives — not a substitute for your rota rules. Start from the site search, then add names to your formal panel with agreed terms.',
      },
    ],
    bodyMarkdown: `
## Key takeaways

- **Out of hours police station cover** needs mapped demand, time bands, and geography — not one exhausted contact.
- Vet reps with real test instructions; review note quality and decline rates quarterly.
- Discovery tools complement, but never replace, your formal panel agreement and rota governance.

## Questions this article answers

- How many names should a firm hold per custody cluster?
- How should night escalation and strategy approval work?
- What signals predict reliable freelance cover?

## Map real demand

**Out of hours police station cover** should reflect real demand, not hope. Pull six months of data: **which custody suites**, which nights, and which offence types spike. Your network should match reality, not a map pin in the county town if you never go there.

## Time bands, not vibes

Split **weekday evenings**, **Friday–Saturday**, and **Sunday–bank holiday**. Availability that works for Tuesday teatime may be useless at 3 a.m. Saturday.

## Geography that respects drive time

Add **adjacent county** coverage where forces border each other. A ten-mile trip across a boundary beats a rep stuck on the wrong side of a river crossing at rush hour.

## Vetting beyond the CV

Check **accreditation**, insurance, references from other firms, and note quality from a test instruction if possible. The [good rep criteria article](/Blog/what-makes-a-good-police-station-representative) lists traits that predict reliability.

## Escalation playbooks

Write a one-page **night script**: who answers the phone, who approves strategy changes, who logs the instruction. Reps should not be guessing whether they can wake a partner.

## Quality control without micromanagement

Quarterly review: late arrivals, note quality, polite decline rate. Drop names that erode trust; add names that earn it.

## Directory discovery

PoliceStationRepUK is built to help you **discover names** you might not meet at the local solicitors’ dinner. Start from [search](/search), then bring people into your formal panel process. Cross-check wider [police station cover](/PoliceStationCover) pages when you explain the model to new fee earners.

## For reps wanting more night work

Keep your profile’s **hours and counties** painfully accurate. Firms remember the rep who said “24/7” but did not pick up.

---

*Operational planning guidance — not legal advice.*
`.trim(),
  },
];
