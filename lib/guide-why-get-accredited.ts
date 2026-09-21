/** Motivation + firm-value guide for people stuck mid-accreditation — not a how-to duplicate. */

export const WHY_ACCREDITED_ON_THIS_PAGE = [
  { id: 'what-it-means', label: 'What “accredited” means' },
  { id: 'why-firms', label: 'Why firms want — and keep — you' },
  { id: 'push-through', label: 'Reasons to push through' },
  { id: 'without-it', label: 'What if you don’t?' },
  { id: 'career', label: 'Career upside' },
  { id: 'stuck', label: 'If you’re finding it brutally hard' },
  { id: 'next-steps', label: 'Next steps' },
  { id: 'faqs', label: 'FAQs' },
  { id: 'related', label: 'Related guides' },
  { id: 'sources', label: 'Official sources' },
] as const;

export const WHY_ACCREDITED_MEANINGS = [
  {
    title: 'PSRAS',
    body: 'The main route for non-solicitors (solicitors can take it too): written exam, supervised portfolio, and the Critical Incidents Test. If you’re a stuck paralegal, this is usually your fight. Authorised by the SRA; the Legal Aid Agency keeps the Police Station Register.',
  },
  {
    title: 'PSQ',
    body: 'The Police Station Qualification — the solicitor route for Legal Aid-claimable police-station advice. Practising solicitors need PSRAS or PSQ to claim payment for station advice (own-client-only work is treated differently under the Arrangements).',
  },
  {
    title: 'Criminal Litigation Accreditation',
    body: 'A further Law Society step for local duty solicitor rotas. Not the same as police-station competence. Station competence first; duty accreditation later if that’s your aim.',
  },
] as const;

export const WHY_ACCREDITED_FIRM_POINTS = [
  {
    title: 'More valuable when employed',
    body: 'A crime firm on a Legal Aid contract needs people it can lawfully send to custody and voluntary interviews. Until you’re on the right path (probationary → accredited, with supervision), you’re limited. After accreditation, you’re deployable — the difference between “admin who knows crime” and a fee earner who can attend.',
  },
  {
    title: 'Harder to replace — so firms retain you',
    body: 'Station cover is the engine of a criminal practice. Training someone through PSRAS or PSQ costs time and supervision. Once you’re through, you’re capacity. That makes you stickier for retention, progression, and proper fee-earner status — not vibes; contract work needs you.',
  },
  {
    title: 'The path real criminal solicitors walked',
    body: 'Plenty of defence solicitors started as police station representatives or trainees grinding exactly this. Accreditation doesn’t hand you a practising certificate — but it puts you inside the work and the progression story: rep / trainee → newly qualified criminal solicitor → (if you want) duty accreditation and wider crime practice.',
  },
  {
    title: 'National demand across England & Wales',
    body: 'Firms nationwide need reliable accredited attenders. Finish the assessments and you stop competing as “enthusiastic” and start competing as “ready.”',
  },
] as const;

export const WHY_ACCREDITED_REASONS = [
  'So you can do the job for real under Legal Aid frameworks.',
  'So the firm can staff and claim with you — you’re part of how the practice runs.',
  'So urgent attendances can be yours — “I’m studying for it” rarely gets the brief.',
  'So your CV stops stalling — one finished accreditation beats years of “planning to.”',
  'So the solicitor pathway stays open — custody experience plus assessed competence is what criminal departments look for when they grow fee earners into solicitors.',
] as const;

export const WHY_ACCREDITED_WITHOUT = [
  {
    title: 'Register status and Legal Aid roles',
    body: 'Without the right qualification path (and for non-solicitor reps, Police Station Register status), you’re not in the role the LAA Police Station Register Arrangements describe for advice claimed under Legal Aid.',
  },
  {
    title: 'Solicitors and station payment',
    body: 'Solicitors wanting Legal Aid payment for station advice need PSRAS or PSQ. Own-client-only advice is treated differently — check the current Arrangements rather than assuming.',
  },
  {
    title: 'Duty rota is a separate climb',
    body: 'Local duty solicitor rotas need Law Society Criminal Litigation Accreditation. That sits on top of station competence — it isn’t a shortcut around it.',
  },
  {
    title: 'Supervising solicitor required',
    body: 'No supervising solicitor arrangement means register status can’t be maintained as the Arrangements require. The directory and firm outreach guides help you find that relationship — don’t wait forever in limbo.',
  },
] as const;

export const WHY_ACCREDITED_CAREER = [
  'Fee earner, not passenger — deployable capacity the firm can build around.',
  'Retention leverage — firms invest to get you through; replacing you hurts them.',
  'Pathway toward becoming a criminal solicitor (SQE / QWE and related routes still apply separately).',
  'National options — employed, cover, or instructed arrangements where the rules allow.',
  'Be realistic and ambitious: no guarantees of rotas, salary, or volume. Becoming deployable is in your control.',
] as const;

export const WHY_ACCREDITED_STUCK = [
  {
    title: 'The CIT terrifies you',
    body: 'Train for that format. Structured prep — for example on PSR Train — beats lonely highlighting. See our CIT guide for the assessment shape, then practise scenarios.',
  },
  {
    title: 'Failed, deferred, or went quiet',
    body: 'Restart is normal. One assessment window, one supervising solicitor, one booked date. Momentum beats perfect conditions.',
  },
  {
    title: 'No supervising solicitor',
    body: 'Ask crime firms and people who made it. Don’t wait forever before the written paper if you’re otherwise ready — but register status still needs a proper supervision arrangement under the Arrangements.',
  },
  {
    title: 'Money, time, caring, day job',
    body: 'Accreditation is finite. “After things calm down” isn’t. Protect weekly slots; treat prep like a rota commitment.',
  },
  {
    title: '“Not cut out for custody”',
    body: 'Competence is assessed. Confidence usually comes after you’re in the work — not before you’ve started.',
  },
  {
    title: '“I’ll do duty instead”',
    body: 'Different ladder. Station competence first; Criminal Litigation Accreditation is a later Law Society step for duty rotas.',
  },
] as const;

export const WHY_ACCREDITED_FAQS = [
  {
    q: 'Is this the same as the how-to-become-a-rep guide?',
    a: 'No. This page is motivation and firm-value context for people stuck mid-route. For mechanics — written exam, portfolio, CIT, DSCC — use the <a href="/HowToBecomePoliceStationRep" class="font-semibold underline">full PSRAS guide</a> and the stage guides linked below.',
  },
  {
    q: 'Does accreditation make me a solicitor?',
    a: 'No. PSRAS / PSQ accredit competence for police-station advice under the relevant schemes. Becoming a solicitor still requires the SRA qualification route (for example SQE and qualifying work experience). Many criminal solicitors started with station work; accreditation puts you inside that progression story — it does not replace admission.',
  },
  {
    q: 'Why do firms care so much about accreditation?',
    a: 'Under Legal Aid frameworks, firms need people they can lawfully send to custody and claim for. Accreditation (and register status for non-solicitor reps) turns you from limited support into deployable capacity — which is why firms invest in supervision and why accredited people are harder to replace.',
  },
  {
    q: 'I’m stuck — what should I do this week?',
    a: 'Pick one concrete next step: book or rebook an assessment date, ask one SCC crime firm about supervision/employment, or start structured CIT / written prep. Then open the matching how-to guide so you’re not guessing the rules.',
  },
  {
    q: 'Where do Tuckers fit in?',
    a: 'Tuckers Solicitors LLP is an example of a major national criminal defence practice already referenced on this site (for example in the supervising-solicitor guide). We do not invent vacancies here — use firm careers pages, the directory, and professional networks if you’re exploring employment pathways.',
  },
] as const;

export const WHY_ACCREDITED_RELATED = [
  {
    href: '/HowToBecomePoliceStationRep',
    label: 'How to become a rep (full route)',
    desc: 'Written exam, portfolio, CIT, costs, and timelines',
  },
  {
    href: '/AccreditedRepresentativeGuide',
    label: 'Accredited representative guide',
    desc: 'What PSRAS and the Police Station Register mean',
  },
  {
    href: '/CriminalLawCareerGuide',
    label: 'Criminal law career guide',
    desc: 'SQE, CILEX, and broader solicitor pathways',
  },
  {
    href: '/BuildPortfolioGuide',
    label: 'Portfolio guide',
    desc: 'Part A / Part B case studies and submission',
  },
  {
    href: '/PrepareForCIT',
    label: 'CIT preparation',
    desc: 'Critical Incidents Test format and prep plan',
  },
  {
    href: '/DSCCRegistrationGuide',
    label: 'DSCC registration',
    desc: 'ADMIN forms and engaged requirements',
  },
  {
    href: '/FindSupervisingSolicitor',
    label: 'Find a supervising solicitor',
    desc: 'How SCC firms actually take trainees on',
  },
  {
    href: '/BeginnersGuide',
    label: "Beginner's guide",
    desc: 'Custody basics once you’re in the work',
  },
  {
    href: '/GetWork',
    label: 'Get work guide',
    desc: 'Building instructions after accreditation',
  },
  {
    href: '/RepsHub',
    label: 'RepsHub',
    desc: 'Hub for tools and representative resources',
  },
] as const;
