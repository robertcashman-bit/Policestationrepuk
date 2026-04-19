import type { BlogArticle } from './types';

const IMG = (slug: string, alt: string) => ({
  src: `/images/blog/raster/${slug}.webp`,
  alt,
  width: 1200,
  height: 675,
});

export const ARTICLES_BATCH_1: BlogArticle[] = [
  {
    slug: 'what-does-a-freelance-police-station-representative-do',
    title: 'What Does a Freelance Police Station Representative Actually Do?',
    metaTitle: 'Freelance Police Station Rep: What They Do | PSR UK',
    metaDescription:
      'What a freelance police station representative does in custody: who they act for, how firms instruct them, and how that differs from rota scheme cover.',
    primaryKeyword: 'freelance police station representative',
    categories: ['freelance-reps', 'attendance', 'law-firms'],
    published: '2026-03-20T09:00:00.000Z',
    modified: '2026-03-26T12:00:00.000Z',
    excerpt:
      'Freelance accredited representatives attend custody on behalf of instructing firms. Here is what that work involves in practice — without confusing it with duty solicitor schemes.',
    summary:
      'This article explains the day-to-day work of a freelance police station representative acting under instruction from a criminal defence firm: preparation, attendance, client contact, liaison with custody, and post-attendance reporting. It is general guidance for professionals, not legal advice.',
    image: IMG(
      'what-does-a-freelance-police-station-representative-do',
      'Old London police station signage on a brick wall'
    ),
    relatedSlugs: [
      'freelance-police-station-representative-vs-duty-solicitor',
      'what-makes-a-good-police-station-representative',
      'police-station-attendance-checklist',
    ],
    faqs: [
      {
        q: 'Is a freelance police station representative the same as a duty solicitor?',
        a: 'No. Duty solicitors are allocated under a separate rota scheme. A freelance rep is usually instructed directly by a firm that already acts for the client. Our article on the duty solicitor comparison explains the distinction in more detail.',
      },
      {
        q: 'Who does the representative take instructions from?',
        a: 'Typically from the criminal defence firm that instructs them. The rep’s role is to attend, advise within their accreditation, and report back so the firm can run the case. Exact arrangements should always be agreed in writing between firm and representative.',
      },
      {
        q: 'Where can firms find accredited representatives?',
        a: 'Use the PoliceStationRepUK directory and search to filter by area and accreditation, then complete your own panel checks and engagement terms.',
      },
    ],
    bodyMarkdown: `
## Key takeaways

- A **freelance police station representative** attends on the instructing firm’s instructions and reports back clearly — distinct from duty solicitor rota cover.
- Strong briefing, custody discipline, and structured notes drive repeat instructions and safer files.
- PoliceStationRepUK is a **directory** for discovery; it does not replace supervision, insurers, or retainers.

## Questions this article answers

- What does a freelance police station representative actually do in custody?
- How does freelance cover differ from the duty solicitor route?
- What should firms and reps prioritise before, during, and after attendance?

## Role in one sentence

A freelance police station representative is an accredited professional who attends a police station (or other investigative interview under caution) **on behalf of an instructing firm**, to support the client and feed clear information back to the lawyers running the file.

## Before attendance

Good work starts before anyone reaches the custody suite. In practice, representatives review whatever the firm can provide: offence type, known allegations, bail status, vulnerability flags, and any prior correspondence with the police. They confirm logistics — station, custody suite, estimated arrival window — and how the firm wants updates (call, secure email, messaging policy).

If you are a firm, the quality of this handover directly affects outcomes. The [briefing and disclosure article](/Blog/what-to-include-in-a-police-station-brief) sets out what to send. If you are a rep, pushing politely for missing basics (offence summary, client details, risk notes) is not awkwardness; it is professional risk management.

## At the police station

Once booked in, the representative’s work usually spans several parallel tracks:

- **Private consultation with the client** — taking a careful account, explaining the process in plain language, and identifying anything that affects how the interview should be approached.
- **Liaison with the investigating officer** — obtaining disclosure that is available at that stage, clarifying what the interview will cover, and understanding practical points (digital material, identification procedures, and similar).
- **PACE and custody awareness** — keeping an eye on welfare, appropriate adults, interpreters, and delays that might affect whether the interview should proceed or be re-timed.
- **Supporting the interview strategy** — aligned with the instructing firm’s approach. That might include no-comment advice, a prepared statement route, or answering questions — always within the boundaries of the representative’s accreditation and the firm’s instructions.

Nothing in this list replaces the judgment of the duty solicitor or solicitor on the record where they are involved. Many files use **both**: a freelance rep for attendance and a solicitor for ongoing case ownership.

## After attendance

Firms rarely benefit from a verbal “it went fine” without structure. Strong representatives produce **dated, factual attendance notes**: what disclosure was seen, what was said at a high level (without unsafe speculation), bail or interview outcome, next dates, and any follow-up the firm must do immediately.

That is where [handover discipline](/Blog/best-practice-handover-notes-after-police-station-attendance) earns repeat instructions. It also protects the client when timelines matter — for example if the police propose a charging decision or a re-interview.

## How PoliceStationRepUK fits in

PoliceStationRepUK helps **firms find accredited representatives** and helps **reps present clear coverage areas and contact routes** in one directory. It does not replace your professional retainer, supervision, or insurer’s requirements — but it does reduce friction when you need someone reliable at short notice. Browse the [directory](/directory) or use [advanced search](/search) when you need cover.

## Commercial reality for both sides

For **firms**, freelance cover is often about capacity: out-of-hours rotas, geographic gaps, or conflict situations where another panel member must attend. For **reps**, the work is competitive; reliability, communication, and note quality are how you stay on the speed-dial list. If you want to grow that pipeline, read [how reps win repeat instructions](/Blog/how-freelance-police-station-reps-win-repeat-instructions).

---

*General information for legal professionals in England and Wales — not legal advice. If you are unsure about a specific case, take advice from your firm’s supervisors and insurers.*
`.trim(),
  },
  {
    slug: 'how-firms-can-instruct-freelance-police-station-reps',
    title: 'How Criminal Defence Firms Can Instruct Freelance Police Station Reps More Effectively',
    metaTitle: 'Instruct Freelance Police Station Reps | Law Firms',
    metaDescription:
      'How criminal defence firms instruct freelance police station reps: clearer briefs, faster deployments, escalation rules, and stronger post-attendance reporting.',
    primaryKeyword: 'instruct freelance police station rep',
    categories: ['law-firms', 'best-practice'],
    published: '2026-03-21T09:00:00.000Z',
    modified: '2026-03-26T12:00:00.000Z',
    excerpt:
      'Small changes to how you brief and communicate with freelance reps reduce risk, speed up attendance, and make handovers back to the fee earner painless.',
    summary:
      'Criminal defence firms use freelance accredited representatives to extend coverage and respond to demand spikes. This guide covers instruction channels, minimum brief content, escalation paths, and how to evaluate performance — so deployments are consistent rather than ad hoc.',
    image: IMG(
      'how-firms-can-instruct-freelance-police-station-reps',
      'Senior solicitor briefing colleagues during an office meeting'
    ),
    relatedSlugs: [
      'what-to-include-in-a-police-station-brief',
      'common-mistakes-when-instructing-freelance-police-station-reps',
      'out-of-hours-police-station-cover-for-law-firms',
    ],
    faqs: [
      {
        q: 'Should instructions always be in writing?',
        a: 'Best practice is yes — email or case-management message with key facts, client details, and who is the solicitor on the record. Urgent phone calls happen, but they should be followed by written confirmation when possible.',
      },
      {
        q: 'How do we agree fees and cancellation terms?',
        a: 'Use your firm’s standard terms with panel reps or the representative’s own engagement letter. Agree who bills the client or legal aid and what happens if the police cancel. PoliceStationRepUK does not set fees between firms and reps.',
      },
      {
        q: 'How do we instruct a freelance police station rep in a hurry?',
        a: 'Send a minimum viable brief (identity, allegation summary, strategy headline, custody location), confirm the named contact for mid-attendance decisions, then follow up in writing. Use the [directory](/directory) alongside your panel list when you need a new name fast.',
      },
    ],
    bodyMarkdown: `
## Key takeaways

- **Instruct freelance police station rep** workflows improve when one contact owns routing and written instructions back every urgent call.
- Minimum brief content (identity, allegation, strategy, billing) prevents guesswork in custody.
- Panel depth by geography and time band beats a single “favourite name” at 2 a.m.

## Questions this article answers

- How should firms structure instructions to freelance reps?
- What belongs in a minimum viable brief at deployment time?
- How do escalation rules and channel discipline reduce risk?

## Why instruction quality matters

When you instruct a freelance police station rep, clarity is the main lever. A freelance rep can only work with what you provide. Thin instructions create duplicated calls, slower attendance, and avoidable strain on the client. Strong instructions look boring on paper — and that is the point.

## Single point of contact

Nominate **one fee earner or paralegal** as the routing address for updates. Rotating contacts across a night shift is fine, but the chain should be explicit: who is awake, who can approve strategy changes, and who signs off on billing queries.

## Minimum viable brief (MVB)

At instruction, aim to include:

1. **Client identity and contact** — full name, DOB, any safer-contact notes.
2. **Matter reference** — your file number and, if known, police reference.
3. **Allegation summary** — even two sentences beats “assault, Kent”.
4. **Vulnerability and language** — AA, interpreter, health, communication needs.
5. **Strategy headline** — e.g. “seek disclosure first; no comment unless X”.
6. **Billing / legal aid** — who is paying and any CRM constraints you already know.

Expand on this in the dedicated article on [what to include in a police station brief](/Blog/what-to-include-in-a-police-station-brief).

## Channel discipline

Use the firm’s approved channels. If you use PoliceStationRepUK to **find** a rep, move operational messaging back to your secure systems once contact is established. Speed matters, but so does confidentiality.

## Escalation

Agree in advance **when the rep should stand down** and a solicitor must attend instead — for example complex fraud, serious sexual allegations where firm policy requires a solicitor, or client instructions that fall outside the rep’s accreditation. Write that threshold into your panel agreement.

## Aftercare: close the loop

When notes arrive, acknowledge receipt. If something is unclear, ask the same day. Reps who never hear feedback cannot calibrate. Firms that never close the loop invite repeated follow-up calls.

## Building a panel

You do not need fifty names; you need **depth by geography and time band**. Map custody suites your firm actually uses, then list two to three reps per band (weeknight, weekend, bank holiday). Our guide to [out-of-hours cover](/Blog/out-of-hours-police-station-cover-for-law-firms) walks through that network design.

## Using the directory

When you need a new name quickly, filter by county and accreditation on the [directory hub](/directory).

---

*General operational guidance for professionals — not legal advice.*
`.trim(),
  },
  {
    slug: 'police-station-attendance-checklist',
    title: 'Police Station Attendance Checklist for Freelance Representatives',
    metaTitle: 'Police Station Attendance Checklist for Freelance Reps | UK',
    metaDescription:
      'Police station attendance checklist for freelance reps: before travel, custody desk, consultation, interview support, outcomes, and notes firms can rely on.',
    primaryKeyword: 'police station attendance checklist',
    categories: ['attendance', 'freelance-reps', 'best-practice'],
    published: '2026-03-18T09:00:00.000Z',
    modified: '2026-03-26T12:00:00.000Z',
    excerpt:
      'Use this structured checklist to reduce missed steps in custody: from confirming the brief to delivering notes the instructing solicitor can rely on.',
    summary:
      'A field checklist for accredited representatives covering pre-arrival checks, custody desk points, consultation, interview support, and post-release reporting. Adapt it to your firm’s house style and your insurer’s requirements.',
    image: IMG(
      'police-station-attendance-checklist',
      'Hand ticking off items in a paper notebook checklist with a pen'
    ),
    relatedSlugs: [
      'what-to-include-in-a-police-station-brief',
      'best-practice-handover-notes-after-police-station-attendance',
      'why-fast-clear-communication-matters-in-police-station-representation',
    ],
    faqs: [
      {
        q: 'Should I vary this checklist for voluntary interviews?',
        a: 'Many steps are the same (disclosure, consultation, outcomes). Voluntary interviews may differ on booking-in mechanics — adjust custody-specific items to the venue’s process.',
      },
      {
        q: 'What if the firm’s strategy changes mid-attendance?',
        a: 'Confirm instructions in writing where possible, or note time-stamped phone approval in your attendance record. If you cannot reach the firm, follow your accreditation rules and document the limitation clearly.',
      },
      {
        q: 'Does this checklist replace PACE training?',
        a: 'No. It complements your accreditation and firm instructions. For context on process and rights, see the in-site [PACE overview](/PACE) and your regulator’s materials.',
      },
    ],
    bodyMarkdown: `
## Key takeaways

- Use a **police station attendance checklist** so preparation, custody desk steps, and reporting stay consistent.
- Document disclosure, outcomes, and follow-ups the same day — tired fee earners skim predictable headings.
- Align with the firm’s PACE awareness and your accreditation limits; this is operational guidance, not case advice.

## Questions this article answers

- What should a rep verify before travelling to custody?
- What belongs in post-attendance notes for the instructing firm?
- How do voluntary interviews differ in practice from booked-in custody?

## Before you travel

This **police station attendance checklist** is a field aide — adapt it to the instructing firm and the venue.

- Confirm **station, suite, and booking window** with the firm and custody where possible.
- Re-read the brief; flag gaps (missing DOB, offence detail, AA/interpreter).
- Charge phone; pack notepad, pen, firm notepaper if used, and any required ID for professional visitors.
- Know **who to call** for escalations (named solicitor, not a generic switchboard if avoidable).

## Arrival and custody desk

- Identify yourself and the **instructing firm** clearly.
- Note **time of arrival**, custody officer name/badge if given, and any delay reasons.
- Confirm **legal consultation room** availability and whether the client is ready.

## Private consultation

- Take a full **initial account** in the firm’s preferred format.
- Check **health, medication, sleep, understanding** — and whether an AA or interpreter is required.
- Align on interview approach with the firm’s headline instruction; document if the client wishes to depart from it after advice.
- Explain next steps in plain English; confirm the client understands they can stop for advice during interview breaks.

## Disclosure and interview

- Obtain **whatever disclosure the officer will give**; note gaps politely if material is missing.
- During the interview, intervene on **PACE fairness** where appropriate; avoid turning into an advocate outside your role.
- Track **breaks**, legal consultations mid-interview, and any changes to alleged facts.

## Outcomes

Record accurately:

- **Charge, NFA, bail, RUI**, voluntary end, or re-schedule.
- Dates of **return to station** or court.
- Property, phones, bail conditions summarised.
- Any **warnings or ancillary processes** the firm must know about the same day.

## Post-attendance reporting

Send structured notes quickly — see [handover notes best practice](/Blog/best-practice-handover-notes-after-police-station-attendance). Include **time in / time out**, who you saw, disclosure summary, outcome, and follow-up tasks for the firm.

## Professional hygiene

- Store notes per firm policy; avoid personal devices for client data.
- If something went wrong (late arrival, disclosure dispute), say so early — firms forgive problems they know about; they rarely forgive surprises a week later.

## Stay visible for the next instruction

Keep your [directory profile](/register) accurate on counties, hours, and accreditation so firms can match you to live demand. Firms planning cover may also use [police station cover overview](/PoliceStationCover) before they instruct.

---

*Operational guidance — not legal advice. Follow your accreditation body rules and supervising firm instructions.*
`.trim(),
  },
  {
    slug: 'what-to-include-in-a-police-station-brief',
    title: 'What Law Firms Should Include in a Proper Police Station Brief',
    metaTitle: 'Police Station Brief for Freelance Rep: What to Include',
    metaDescription:
      'What to put in a police station brief for a freelance rep: client IDs, allegation summary, vulnerabilities, tactics, billing — so custody attendance runs smoothly.',
    primaryKeyword: 'police station brief for freelance rep',
    categories: ['law-firms', 'best-practice', 'attendance'],
    published: '2026-03-19T09:00:00.000Z',
    modified: '2026-03-26T12:00:00.000Z',
    excerpt:
      'A proper brief is not a long essay. It is a tight bundle of facts, risk notes, and strategy so the rep can attend without guesswork.',
    summary:
      'Sets out the elements solicitors’ firms should include when instructing freelance police station representatives: client and matter identifiers, allegation summary, vulnerabilities, disclosure expectations, tactical steer, and post-attendance deliverables.',
    image: IMG(
      'what-to-include-in-a-police-station-brief',
      'Solicitor preparing a case brief at a desk with a laptop and notebook'
    ),
    relatedSlugs: [
      'how-firms-can-instruct-freelance-police-station-reps',
      'common-mistakes-when-instructing-freelance-police-station-reps',
      'police-station-attendance-checklist',
    ],
    faqs: [
      {
        q: 'How much disclosure should we attach?',
        a: 'Send what you already hold: charge sheet drafts, MG5 summary if available, letters from the police, and key exhibits list. If you have nothing beyond the allegation label, say so explicitly so the rep can manage expectations on site.',
      },
      {
        q: 'Should we include internal firm gossip or speculation?',
        a: 'No. Stick to facts, instructions, and known risks. Speculation clouds advice and can leak into notes in unhelpful ways.',
      },
      {
        q: 'Where does interview under caution fit in?',
        a: 'Many briefs support a PACE interview or voluntary interview under caution. Point the rep to your preferred approach and any [interview under caution](/InterviewUnderCaution) notes the firm already uses.',
      },
    ],
    bodyMarkdown: `
## Key takeaways

- A **police station brief for freelance rep** use should bundle identity, allegations, vulnerabilities, tactics, and billing in one thread.
- Vague offence labels and silent strategy create custody risk; name escalation thresholds explicitly.
- Attach what you already hold on disclosure; say plainly when you have only a label.

## Questions this article answers

- What must a firm include when briefing a freelance representative?
- How much disclosure should travel with the instruction?
- How should tactical limits and billing be expressed?

## The purpose of the brief

The brief exists so a freelance representative can **stand in your shoes for a few hours** without improvising client strategy from thin air. It should answer: who, what, where, why it matters, and how you want the attendance conducted.

## Identity and references

- Client full name, DOB, contact numbers.
- Your **file reference** and fee earner name.
- Police **URN / crime reference** if known.
- Court dates or bail markers already in play.

## Allegation block

Provide a **neutral summary** of what is alleged — not advocacy, just enough to frame disclosure. If there are multiple allegations or complainants, number them. Link to [PACE and interview context](/PACE) internally for trainees drafting briefs.

## Client context

Note prior convictions only if **relevant to tactics or bail** and you are comfortable sharing at this stage. Flag mental health, neurodiversity, learning disability, or language needs. State whether an **appropriate adult** is already arranged or must be requested.

## Tactical instruction

Be explicit:

- Preferred default (e.g. **no comment** unless disclosure crosses a stated threshold).
- Any **prepared statement** already drafted — attach the latest version.
- Topics that are **off limits** without solicitor approval.
- Whether you want **immediate phone contact** if the officer offers an out-of-character disposal.

## Logistics and billing

- Custody location, officer name if known, interview window.
- Who invoices (firm, legal aid certificate detail if applicable).
- Out-of-scope tasks (e.g. “do not discuss civil proceedings”).

## What you want back

Set deliverable expectations: **call before interview**, **email notes within X hours**, encrypted portal upload, etc. Our article on [communication standards](/Blog/why-fast-clear-communication-matters-in-police-station-representation) explains why this matters.

## Common gaps to avoid

Vague offence labels, missing client phone numbers, and silent strategy (“use your judgment”) on sensitive files. If judgment truly is delegated, say so plainly and name **numeric thresholds** for escalation.

## Find reps when you are stuck

Use [PoliceStationRepUK search](/search) to filter by area and accreditation, then move the conversation to your case systems.

---

*Professional practice guidance — not legal advice.*
`.trim(),
  },
];
