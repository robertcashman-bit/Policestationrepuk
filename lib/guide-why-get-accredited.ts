/** Motivation + firm-value guide — why finish accreditation (not a how-to duplicate). */

export const WHY_ACCREDITED_ON_THIS_PAGE = [
  { id: 'what-it-means', label: 'What “accredited” means' },
  { id: 'fee-earner', label: 'Fee earner in your own right' },
  { id: 'retention', label: 'More valuable — harder to replace' },
  { id: 'reasons', label: 'Strong reasons to finish' },
  { id: 'portfolio', label: 'The hard part: the portfolio' },
  { id: 'stuck', label: 'Other sticking points' },
  { id: 'without-it', label: 'What if you don’t?' },
  { id: 'next-steps', label: 'Next steps' },
  { id: 'faqs', label: 'FAQs' },
  { id: 'related', label: 'Related guides' },
  { id: 'sources', label: 'Official sources' },
] as const;

export const WHY_ACCREDITED_MEANINGS = [
  {
    title: 'PSRAS',
    body: 'The main route for non-solicitors (solicitors can take it too): written exam, supervised portfolio, and the Critical Incidents Test. Authorised by the SRA; the Legal Aid Agency keeps the Police Station Register. If you’re a stuck paralegal, this is usually your fight.',
  },
  {
    title: 'PSQ',
    body: 'The Police Station Qualification — the solicitor route for Legal Aid-claimable police-station advice. Practising solicitors need PSRAS or PSQ to claim payment for station advice (own-client-only work is treated differently under the Arrangements — check the current text).',
  },
  {
    title: 'Criminal Litigation Accreditation',
    body: 'A further Law Society step for local duty solicitor rotas. Not the same as police-station competence. Station competence first; duty accreditation later if that’s your aim.',
  },
] as const;

export const WHY_ACCREDITED_FEE_EARNER = [
  {
    title: 'Not “just a paralegal”',
    body: 'Before accreditation you’re often supporting other people’s files. Once you’re fully accredited (and engaged as the Arrangements require), a crime firm can put you into custody and voluntary interviews in your own right — you’re doing the advice, not only booking the attendance.',
  },
  {
    title: 'Firms pay for deployable capacity',
    body: 'Accredited station work is fee-earning work under the Standard Crime Contract framework. Firms pay more because you’re generating that work yourself — not because of a vibe or a job title. We don’t invent salary figures here; the point is structural: accreditation moves you from support cost to fee earner.',
  },
  {
    title: 'Your name on the attendance',
    body: 'Urgent calls go to people the firm can lawfully send. “I’m studying for it” rarely gets the brief. Finish the route and the firm can staff with you when a solicitor is in court, asleep, or covering another force area.',
  },
] as const;

export const WHY_ACCREDITED_RETENTION = [
  {
    title: 'You generate money for the practice',
    body: 'Police-station cover is core criminal-defence work. When you’re accredited, every attendance you take is capacity the firm would otherwise have to buy in, cover itself, or decline. That economic value is why good firms invest in supervision — and why they prefer to keep people who’ve made it through.',
  },
  {
    title: 'Harder to replace, professionally',
    body: 'Getting someone through written exams, portfolio, and CIT costs time and supervisor attention. Replacing an accredited attender mid-rota hurts cover plans. Stay professional about it: this is retention through usefulness, not scare tactics or invented “job security” stats.',
  },
  {
    title: 'Progression follows usefulness',
    body: 'Crime departments grow fee earners who already know custody. Accreditation doesn’t guarantee promotion — but it puts you in the conversation when firms look for who can carry more work, train juniors, or move toward solicitor qualification.',
  },
] as const;

export const WHY_ACCREDITED_REASONS = [
  {
    title: 'Legal Aid police-station eligibility',
    body: 'Under the Police Station Register Arrangements and the Standard Crime Contract, Legal Aid station advice is done by people on the right qualification path. Accreditation (with register status for non-solicitor reps) is how you become eligible to do that work for real — not as a passenger.',
  },
  {
    title: 'Police Station Register and duty pathway',
    body: 'Non-solicitor reps need Police Station Register status via the DSCC. Local duty solicitor rotas are a separate Law Society climb (Criminal Litigation Accreditation) that sits on top of station competence — station first, duty later if that’s your goal.',
  },
  {
    title: 'Confidence in custody',
    body: 'Accreditation doesn’t make custody easy — but assessed competence, supervised cases, and the CIT give you a structured way to earn confidence. Most people feel sharper after real attendances than after reading alone.',
  },
  {
    title: 'Stepping stone toward criminal solicitor work',
    body: 'Plenty of defence solicitors started as police station representatives or trainees grinding this route. Accreditation doesn’t admit you as a solicitor (SQE / QWE and related routes still apply) — it puts you inside the work and the progression story.',
  },
  {
    title: 'Firm cover capacity',
    body: 'National crime practices need reliable accredited attenders across England and Wales. Finish the assessments and you stop competing as “enthusiastic” and start competing as “ready to instruct.”',
  },
  {
    title: 'Professional identity',
    body: 'You’re no longer “helping out at the station.” You’re an accredited police station representative (or a solicitor with PSRAS/PSQ) — a recognised competence, with standards and a register behind it.',
  },
] as const;

/** Honest drawback — portfolio is often where people stall. No invented LAA/PSRAS rules. */
export const WHY_ACCREDITED_PORTFOLIO_WHY_HARD = [
  'Nine assessed case studies (Part A then Part B under the common provider structure) demand real attendances, contemporaneous notes, and reflective write-ups — not a weekend essay.',
  'You need a supervising solicitor for the observed stages, and register / probationary rules constrain what you can lead before full accreditation.',
  'Provider deadlines, case-age rules, and feedback rounds mean progress depends on both your write-up quality and firm workflow — easy to lose momentum between attendances.',
  'Breadth matters: assessors look for range across offences and issues, so repeating the same easy summary matter stalls the portfolio even when you’ve “done enough” attendances in raw numbers.',
] as const;

export const WHY_ACCREDITED_PORTFOLIO_WHY_STALL = [
  {
    title: 'Waiting for the “perfect” cases',
    body: 'People delay write-ups hoping the next custody will be cleaner. Portfolios reward honest, complete case studies — not a mythical perfect file. Start drafting while facts are fresh.',
  },
  {
    title: 'Supervisor bottleneck',
    body: 'Observed cases and feedback need your supervising solicitor’s time. If you don’t ask early and book slots, Part A Stage 2 drifts for months.',
  },
  {
    title: 'Day job crowding out write-ups',
    body: 'Attendances feel productive; quiet evenings of disclosure analysis feel optional. Protect weekly writing slots the way you’d protect a rota commitment.',
  },
  {
    title: 'Fear of assessor feedback',
    body: 'First submissions often need amendment. That’s normal. Treat feedback as the path through — not proof you should quit.',
  },
] as const;

export const WHY_ACCREDITED_PORTFOLIO_THROUGH = [
  {
    title: 'Use the stage guides',
    body: 'Follow the portfolio blueprint, then the written-exam and CIT guides so you’re not inventing process. Mechanics live there — this page is the why.',
  },
  {
    title: 'One case at a time',
    body: 'Aim for the next compliant case study, not the finished nine. Chronology, anonymisation, and reflection beat binge-writing after six months of silence.',
  },
  {
    title: 'Keep the supervisor in the loop',
    body: 'Share drafts early. Signed feedback for observed advising cases is part of the provider workflow — don’t discover that the week before a submission window.',
  },
  {
    title: 'Pair portfolio with CIT prep',
    body: 'Each strong case report trains the same judgment the CIT tests. Structured practice (for example on PSR Train) helps once you’ve got real cases under your belt.',
  },
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
    body: 'No supervising solicitor arrangement means register status can’t be maintained as the Arrangements require. The directory and supervising-solicitor guide help you find that relationship — don’t wait forever in limbo.',
  },
] as const;

export const WHY_ACCREDITED_FAQS = [
  {
    q: 'Is this the same as the how-to-become-a-rep guide?',
    a: 'No. This page is motivation and firm-value context — why finish, why firms care, and how to push through the hard parts. For mechanics — written exam, portfolio, CIT, DSCC — use the <a href="/HowToBecomePoliceStationRep" class="font-semibold underline">full PSRAS guide</a> and the stage guides linked below.',
  },
  {
    q: 'Why is the portfolio the hardest part for so many people?',
    a: 'Because it needs real attendances, supervisor time, reflective write-ups, and breadth across cases — not just exam evenings. Deadlines and feedback rounds stretch over months, so momentum dies easily. Use the <a href="/BuildPortfolioGuide" class="font-semibold underline">portfolio guide</a> for Part A / Part B structure; don’t invent extra LAA rules from forums.',
  },
  {
    q: 'Will firms pay me more once I’m accredited?',
    a: 'Accreditation turns you into a fee earner in your own right for police-station work under Legal Aid frameworks — deployable capacity rather than “just a paralegal.” Pay arrangements vary by firm and employment model. We don’t invent salary figures; ask firms directly and compare roles that require accreditation versus support-only posts.',
  },
  {
    q: 'Does accreditation make me a solicitor?',
    a: 'No. PSRAS / PSQ accredit competence for police-station advice under the relevant schemes. Becoming a solicitor still requires the SRA qualification route (for example SQE and qualifying work experience). Many criminal solicitors started with station work; accreditation puts you inside that progression story — it does not replace admission.',
  },
  {
    q: 'I’m stuck mid-portfolio — what should I do this week?',
    a: 'Pick one concrete next step: finish one case write-up, book a supervisor observation slot, or re-read the <a href="/BuildPortfolioGuide" class="font-semibold underline">portfolio requirements</a> against your draft. If the CIT or written paper is the blocker instead, open that stage guide and book a prep session.',
  },
  {
    q: 'Where do Tuckers fit in?',
    a: 'Tuckers Solicitors LLP is an example of a major national criminal defence practice already referenced on this site (for example in the supervising-solicitor guide). We do not invent vacancies here — use firm careers pages, the directory, and professional networks if you’re exploring employment pathways.',
  },
] as const;

export const WHY_ACCREDITED_RELATED = [
  {
    href: '/BuildPortfolioGuide',
    label: 'Portfolio guide',
    desc: 'Part A / Part B case studies — the stage where most people stall',
  },
  {
    href: '/HowToBecomePoliceStationRep',
    label: 'How to become a rep (full route)',
    desc: 'Written exam, portfolio, CIT, costs, and timelines',
  },
  {
    href: '/PrepareForWrittenExam',
    label: 'Written exam guide',
    desc: 'First assessment stage before Part A cases',
  },
  {
    href: '/PrepareForCIT',
    label: 'CIT preparation',
    desc: 'Critical Incidents Test format and prep plan',
  },
  {
    href: '/AccreditedRepresentativeGuide',
    label: 'Accredited representative guide',
    desc: 'What PSRAS and the Police Station Register mean',
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
    href: '/CriminalLawCareerGuide',
    label: 'Criminal law career guide',
    desc: 'SQE, CILEX, and broader solicitor pathways',
  },
  {
    href: '/DutySolicitorVsRep',
    label: 'Duty solicitor vs rep',
    desc: 'Station competence vs duty-rota accreditation',
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
