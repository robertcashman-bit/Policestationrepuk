/**
 * One-off: append deep wiki-style articles to data/wiki-articles.json
 * Run: node scripts/add-wiki-deep-articles.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const wikiPath = path.join(root, 'data', 'wiki-articles.json');

const NEW_ARTICLES = [
  {
    id: '692f5c10a1b2c3d4e5f6a001',
    title: 'Adverse inference from silence: Section 34 and interview strategy',
    slug: 'adverse-inference-section-34-guide',
    category: 'Interview Techniques',
    difficulty: 'Advanced',
    tags: [
      'Section 34',
      'CJPOA 1994',
      'no comment',
      'prepared statement',
      'adverse inference',
      'PACE',
    ],
    views: 0,
    helpfulCount: 0,
    factCheckStatus: 'pending',
    publishedDate: '2026-04-11T12:00:00.000Z',
    lastImprovedDate: '2026-04-11T12:00:00.000Z',
    excerpt:
      'Practical guide for reps: when courts may draw adverse inferences from silence, how special warnings work, prepared statements, and how this interacts with your interview advice — general information, not case-specific advice.',
    wordCount: 3200,
    content: `# Adverse inference from silence: Section 34 and interview strategy

This article explains **why** "no comment" is not a free pass, how **Section 34** of the Criminal Justice and Public Order Act 1994 fits with police station interviews, and how to document advice. It is **general education** for accredited representatives — not a substitute for supervision, insurer rules, or case-specific counsel advice.

---

## 1. What reps need to know in one minute

- In criminal proceedings, **silence can sometimes be used against a defendant** if they rely in court on a fact they could reasonably have mentioned in interview when questioned under caution.
- That risk is often discussed using the shorthand **"Section 34"** (CJPOA 1994).
- Your job in custody is to ensure the client **understands the framework**, makes an **informed choice**, and that **your advice and their decision** are recorded clearly.
- A **prepared statement** is a common way to put a defence "on the record" while still answering **no comment** to questions.

For the regulatory framework, cross-read [PACE Code C](/PACE) and your firm's interview policy. For tactics, see also [No comment strategy](/Wiki/no-comment-strategy) and [Interview techniques that actually work](/Wiki/interview-techniques-work).

---

## 2. Legal backdrop (high level)

### 2.1 Section 34 — the core idea

In outline, **Section 34** allows a court to draw such inferences as appear proper from a defendant's **failure to mention facts** when questioned under caution, where they later **rely on those facts in their defence** in court, and where it was **reasonable** to mention them earlier.

The statute is dense; the **Criminal Procedure Rules** and **judicial directions** (such as those on adverse inferences) govern how juries are directed. Representatives are **not** expected to lecture clients on appellate case law — but you **are** expected to flag that silence carries **risks as well as protections**, and to encourage **informed decisions**.

### 2.2 Not the same as the "right to silence"

Clients still have a **right to silence**. Section 34 does not abolish it. It changes what **may** happen **if** they later advance a positive case at trial that they did not mention when questioned.

### 2.3 Special warnings (Sections 36 and 37)

Separate provisions allow **special warnings** about failure to account for **objects, substances, marks, or presence**. These are **not identical** to Section 34, but they are part of the same tactical landscape. If officers give such warnings, note them **verbatim** in your attendance note where possible.

---

## 3. Practical advice stages

### 3.1 Disclosure first (so far as you have it)

You cannot sensibly advise on silence vs account without knowing **what the client is said to have done** and **what material the police have disclosed** (even if summary). If disclosure is thin, say so plainly and record it.

See [Reading disclosure](/Wiki/reading-disclosure).

### 3.2 Explain options in plain English

Most clients need:

1. **Full answers** — highest engagement, may help if the case is weak or explanation is simple; may harm if the client is confused, tired, or the account is incomplete.
2. **No comment** — protects against inconsistent answers and fishing; carries **Section 34 risk** if they later advance facts they could reasonably have mentioned.
3. **Prepared statement + no comment** — often used to set out a **core account** once, then refuse cross-examination style questioning in interview.

### 3.3 Document the advice

Your attendance note should record, at minimum:

- What options were explained (in substance, not a transcript of every word).
- What the client decided.
- Whether they understood they could seek **further advice** before answering.
- Any **vulnerability** factors (health, age, AA present, language).

This protects the client, the firm, and you if competence or instructions are later questioned.

---

## 4. Common scenarios (illustrative)

### 4.1 "I'll explain everything at court"

Explain that waiting until court can carry **inference risk** if those facts could reasonably have been mentioned under caution. It is the client's choice — but it must be an **informed** choice.

### 4.2 Overwhelming evidence

Where evidence is genuinely strong, tactical discussions may include early admissions, **credit** for guilty pleas, or focusing on **mitigation**. That is **solicitor-led** strategic territory — stay within your accreditation and supervision.

### 4.3 Vulnerable clients

If the client may not **fully understand** the caution or the consequences of silence, consider **fitness for interview**, appropriate adults, and whether interview should be **delayed**. A "no comment" interview conducted when the client cannot follow questions is a **professional risk** for everyone involved.

---

## 5. Links and further reading on this site

- [PACE Code C — custody](/Wiki/pace-code-c-custody)
- [Voluntary police interview guide](/Wiki/voluntary-police-interview-guide)
- [Sentencing Act 2026 — key changes (blog)](/Blog/sentencing-act-2026-key-changes) — for **sentencing context** after charge (not interview stage)

---

## 6. Disclaimer

Information only. Laws and guidance change. Always follow **PACE codes**, **firm policy**, **insurer conditions**, and **supervising solicitor** instructions on live cases.`,
  },
  {
    id: '692f5c10a1b2c3d4e5f6a002',
    title: 'Fitness for interview: intoxication, mental health, and delays',
    slug: 'fitness-for-interview-custody',
    category: 'At The Station',
    difficulty: 'Intermediate',
    tags: ['fitness for interview', 'FME', 'appropriate adult', 'mental health', 'PACE', 'vulnerability'],
    views: 0,
    helpfulCount: 0,
    factCheckStatus: 'pending',
    publishedDate: '2026-04-11T12:00:00.000Z',
    lastImprovedDate: '2026-04-11T12:00:00.000Z',
    excerpt:
      'When to challenge interview timing: intoxication, mental crisis, learning disability, and the role of the forensic medical examiner (FME) and appropriate adult — structured wiki notes for reps.',
    wordCount: 2800,
    content: `# Fitness for interview: intoxication, mental health, and delays

Custody interviews should only proceed when the detainee is **fit to be interviewed** under PACE and Code C. This article gives reps a **structured checklist** and language for challenging rushed interviews — without pretending to be a doctor.

---

## 1. Why fitness matters

If a client answers questions while **intoxicated**, in **severe mental health crisis**, or unable to **understand** the caution, the reliability of answers is compromised and professional risk increases for the client, the firm, and police.

Your role is to **raise the issue clearly**, request **medical / AA** involvement as appropriate, and **record** what you said and what happened.

---

## 2. Warning signs (non-exhaustive)

- Slurred speech, strong smell of alcohol, unsteadiness, vomiting (intoxication).
- Disorientation, inability to track questions, paranoia, self-harm statements (mental health crisis).
- Known diagnosis where communication needs adjustment (learning disability, autism, brain injury).
- Extreme fatigue after long detention — fatigue alone may not stop an interview, but **combined** with other factors it can matter.

---

## 3. Forensic medical examiner (FME)

Forces arrange medical assessment in custody. If you have concerns, **ask for an FME assessment** and record the time of the request.

You are not diagnosing — you are **flagging observable concern** that falls within Code expectations.

---

## 4. Appropriate adults (AA)

For **juveniles**, an AA is routinely required. For **vulnerable adults**, an AA may be required where the rules apply.

Reps should know **who** is present, ensure the client understands the AA's role, and avoid any suggestion that the AA is there to **pressure** the client to answer.

See [Youth suspects procedures](/Wiki/youth-suspects-procedures) and [Mental health in custody](/Wiki/mental-health-custody).

---

## 5. What to say (professional examples)

Use calm, factual language:

> "I am not satisfied my client can follow questions safely in their current state. I am asking for medical assessment before interview."

> "Please record that I have raised fitness concerns based on [observations]."

Avoid diagnosing: say what you **observe** and what you **request**.

---

## 6. If police proceed anyway

- Keep a **clear note** of your objections and the officer's response.
- In interview, you may need to **interrupt** if questions become oppressive or the client's condition deteriorates — follow your firm's stance on interventions.
- After attendance, **supervision** and a full **attendance note** matter.

---

## 7. Related wiki articles

- [First attendance walkthrough](/Wiki/first-attendance-walkthrough)
- [Dealing with police custody](/Wiki/dealing-with-police-custody)
- [Difficult custody staff](/Wiki/difficult-custody-staff)

---

## Disclaimer

General information only. Follow current **PACE codes**, **force policies**, and your **supervising solicitor** on live cases.`,
  },
  {
    id: '692f5c10a1b2c3d4e5f6a003',
    title: 'Digital evidence at the police station: downloads, passwords, and disclosure basics',
    slug: 'digital-evidence-police-station-basics',
    category: 'At The Station',
    difficulty: 'Intermediate',
    tags: ['digital evidence', 'mobile phones', 'disclosure', 'PACE', 'encryption', 'investigation'],
    views: 0,
    helpfulCount: 0,
    factCheckStatus: 'pending',
    publishedDate: '2026-04-11T12:00:00.000Z',
    lastImprovedDate: '2026-04-11T12:00:00.000Z',
    excerpt:
      'Wiki-depth primer for reps: phone downloads, passwords, specimen procedures at a high level, and how disclosure issues surface early in custody — not legal advice for any specific case.',
    wordCount: 2600,
    content: `# Digital evidence at the police station: downloads, passwords, and disclosure basics

Police investigations increasingly turn on **phones, messages, images, location data, and cloud accounts**. Representatives are not forensic experts — but you need enough literacy to **spot issues early**, ask sensible questions, and ensure the **client understands** what is at stake.

---

## 1. What "digital" usually means in custody

Officers may seek:

- **Consent** to examine devices.
- **Passwords / PINs** (legal frameworks apply — this is **not** a wiki for bypassing law; it is for **awareness**).
- **Specimens** (e.g. breath, blood) in road traffic or serious cases — different legal routes apply.

If you are unsure which regime applies, **pause** and get **supervising solicitor** direction.

---

## 2. Disclosure at the police station

Early disclosure is often **summary**. Your questions should aim to clarify:

- What **allegation** is being put?
- What **material** do police say they already have?
- What **further** enquiries are planned?

Tie this into interview strategy with [Reading disclosure](/Wiki/reading-disclosure) and [Handling disclosure — police station](/Blog/handling-disclosure-police-station) (blog).

---

## 3. Passwords and compulsion

The law on compulsion to disclose keys/passwords is **technical** and **fact-specific**. Representatives should **not** improvise legal conclusions.

**Practical rule:** if passwords or encryption arise, treat it as a **red flag** for **solicitor advice** and record the issue precisely in your note.

---

## 4. Chain of continuity (why reps should care)

If you observe sloppy handling of devices or unclear seizure times, note it. It may matter later — not always, but **defence teams** need accurate facts.

---

## 5. Client communication tips

Clients often underestimate how much data phones retain. Plain-language points:

- Deleted items are not always gone.
- Messaging apps may sync across devices.
- Location metadata can exist even when the user did not "mean" to share it.

You are helping the client make **informed** decisions, not scaring them — stay factual.

---

## 6. Related reading

- [PACE codes quick reference](/Wiki/pace-codes-quick-reference)
- [Police warrants guide](/Wiki/police-warrants-guide)
- [Seized property guide](/Wiki/seized-property-guide)

---

## Disclaimer

Information only. Digital law changes quickly with legislation and case law. Escalate novel issues to a **solicitor** and follow **firm policy**.`,
  },
];

function wordCountApprox(s) {
  return s.trim().split(/\s+/).length;
}

const raw = fs.readFileSync(wikiPath, 'utf8');
const data = JSON.parse(raw);

const existing = new Set(data.map((x) => x.slug));
const toAdd = NEW_ARTICLES.filter((a) => !existing.has(a.slug));
if (toAdd.length === 0) {
  console.log('Wiki deep articles already present — skipping.');
  process.exit(0);
}

for (const a of toAdd) {
  const wc = wordCountApprox(a.content);
  data.push({ ...a, wordCount: wc });
}

fs.writeFileSync(wikiPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
console.log('Added', toAdd.length, 'articles. Total wiki articles:', data.length);
