import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'CustodyNote — The Custody Note App for Freelance Reps',
  description:
    'CustodyNote is the digital custody record app for police station representatives. One app for attendances, advice and billing. Designed to support LAA record-keeping.',
  path: '/CustodyNote',
});

const CUSTODYNOTE_URL = 'https://custodynote.com';
const DISCOUNT_CODE = 'A2MJY2NQ';

const RECORD_TYPES = [
  {
    name: 'Attendance',
    subtitle: 'Full attendance form',
    desc: 'Complete police station attendance record with all 16 sections — from arrival through to billing.',
    detail: '16 sections',
  },
  {
    name: 'Telephone Advice',
    subtitle: 'INVB / Telephone',
    desc: 'Streamlined form for telephone advice sessions with LAA code support built in.',
    detail: 'LAA code support',
  },
  {
    name: 'Quick Capture',
    subtitle: 'Grab details on the go',
    desc: 'Rapid note-taking when you need to capture essential details quickly.',
    detail: 'Fast entry',
  },
];

const FEATURE_CARDS = [
  {
    name: 'Telephone Advice',
    desc: 'Dedicated form for INVB telephone advice sessions. Captures all required LAA fields in a streamlined layout designed for speed.',
  },
  {
    name: 'Quick Capture',
    desc: 'When you need to grab client details, offence information, or case notes on the go — without filling in a full attendance form.',
  },
  {
    name: 'Full Attendance',
    desc: 'The complete police station attendance record. 16 structured sections covering every aspect of your attendance from arrival to billing.',
  },
];

const FORM_SECTIONS = [
  'Case Reference & Arrival',
  'Journey to Station',
  'Custody Record',
  'Offences',
  'Disclosure & Evidence',
  'Consultation',
  'Interview',
  'Outcome',
  'Time Recording & Fees',
  'LAA Declaration',
  'Admin & Billing',
  'Consents & Retainer',
  'Third Party Authority',
  'Authorities',
  'Communications Log',
  'Supervisor Review',
];

const LAA_FEATURES = [
  'LAA outcome codes, stage reached & fee codes built in',
  'Structured notes mapped to LAA requirements',
  'Sufficient benefit test',
  'PACE reviews (1st / 2nd / 3rd)',
  'Fee rates updated to 2025 — £320 fixed fee, £650 escape',
  'DSCC PIN included in PDF export',
  'Client and fee earner declarations',
  'Automatic escape fee detection',
  'Editable fee rates',
  'Local encrypted backup of all records',
];

const SECURITY_FEATURES = [
  {
    title: 'Encrypted Backup',
    desc: 'All records are encrypted at rest and in transit. Your client data is protected at every stage.',
  },
  {
    title: 'Fully Offline',
    desc: 'Works without internet — perfect for police station custody areas with no signal. No connection required.',
  },
  {
    title: 'Your Data, Your Machine',
    desc: 'Records stay on your device. No cloud dependency required. You control where your data lives.',
  },
  {
    title: 'Cloud Backup (£19.99/mo)',
    desc: 'Optional cloud sync with AWS Object Lock for immutable backups. Multi-device access and automatic backups.',
  },
];

const BILLING_FEATURES = [
  {
    title: 'Firm Tracking & Billing',
    desc: 'Track which firm instructed you and manage billing per firm. See at a glance what you are owed.',
  },
  {
    title: 'Bill Every Firm Accurately',
    desc: 'Automatic time tracking and fee calculation based on LAA rates. No more spreadsheets or guesswork.',
  },
  {
    title: 'Reports & Analytics',
    desc: 'Generate reports for your attendances, earnings, and firm breakdown. Understand your business at a glance.',
  },
  {
    title: 'Save Hours Every Week',
    desc: 'Structured forms mean less time writing up notes and more time for clients. One form, one workflow.',
  },
  {
    title: 'PDF Export',
    desc: 'Export attendance records as professional PDF documents — ready to send to firms or archive.',
  },
];

const PRICING_FEATURES = [
  'Full attendance notes with all 16 sections',
  'Telephone advice & quick capture modes',
  'LAA-ready with built-in codes & declarations',
  'Secure & offline — works without internet',
  'PDF export with DSCC PIN',
  'Firm tracking & billing',
  'Reports & analytics',
  'Local encrypted backup included',
];

export default function CustodyNotePage() {
  return (
    <>
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'CustodyNote' },
            ]}
          />
          <div className="mb-4 mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-slate-400/50 bg-white/10 px-3 py-1 text-xs font-medium text-slate-200">
              Available Now
            </span>
            <span className="inline-flex items-center rounded-full border border-slate-400/50 bg-white/10 px-3 py-1 text-xs font-medium text-slate-200">
              Desktop App
            </span>
            <span className="inline-flex items-center rounded-full bg-green-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wide text-green-300">
              30-Day Free Trial
            </span>
          </div>

          <h1 className="text-h1 text-white">
            The custody note app for freelance reps
          </h1>

          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-slate-300">
            Built for freelance police station representatives and criminal solicitors who need a
            reliable, structured way to record attendances, telephone advice and billing — all in one
            offline-capable desktop app.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-400/50 bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-200">
              <span className="text-green-400">✓</span> Supports LAA codes
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-400/50 bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-200">
              <span className="text-green-400">✓</span> Works offline
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-400/50 bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-200">
              <span className="text-green-400">✓</span> Encrypted backup
            </span>
          </div>

          <div className="mt-8 rounded-[var(--radius-lg)] border-2 border-[var(--gold)]/40 bg-[var(--gold)]/10 p-5">
            <p className="text-sm font-semibold uppercase tracking-wider text-[var(--gold)]">
              Exclusive Discount
            </p>
            <p className="mt-2 text-base font-semibold text-white">
              25% off your subscription — Enter code{' '}
              <span className="rounded bg-[var(--gold)] px-2.5 py-0.5 font-mono text-sm text-[var(--navy)]">
                {DISCOUNT_CODE}
              </span>{' '}
              at checkout on custodynote.com
            </p>
          </div>

          <div className="mt-8">
            <a
              href={CUSTODYNOTE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold inline-flex min-h-[44px] items-center no-underline"
            >
              Start 30-Day Free Trial →
            </a>
            <p className="mt-3 text-xs text-slate-300">
              No credit card for trial · Windows 10+ · From £15.99/mo · Cancel any time
            </p>
          </div>
        </div>
      </section>

      <div className="page-container">

      {/* 3 Record Types */}
      <section className="mb-14">
        <h2 className="text-h2 mb-2 text-[var(--navy)]">3 record types</h2>
        <p className="mb-6 max-w-2xl text-[var(--muted)]">
          Choose the right form for the job. Each record type is designed for a specific workflow.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {RECORD_TYPES.map((rt) => (
            <div
              key={rt.name}
              className="group flex flex-col rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)] transition-all hover:-translate-y-0.5 hover:border-[var(--gold)]/40 hover:shadow-[var(--card-shadow-hover)]"
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[var(--navy)]">{rt.name}</h3>
                <span className="rounded-full bg-[var(--gold)]/10 px-2.5 py-0.5 text-xs font-medium text-[var(--gold-hover)]">
                  {rt.detail}
                </span>
              </div>
              <p className="mb-2 text-sm font-medium text-[var(--navy)]">{rt.subtitle}</p>
              <p className="flex-1 text-sm leading-relaxed text-[var(--muted)]">{rt.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* One app for attendances, advice & billing */}
      <section className="mb-14">
        <h2 className="text-h2 mb-2 text-[var(--navy)]">
          One app for attendances, advice &amp; billing
        </h2>
        <p className="mb-6 max-w-2xl text-[var(--muted)]">
          Stop juggling spreadsheets, Word documents and paper forms. CustodyNote brings everything
          into a single, structured workflow.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {FEATURE_CARDS.map((fc) => (
            <div
              key={fc.name}
              className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)]"
            >
              <h3 className="text-base font-semibold text-[var(--navy)]">{fc.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{fc.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 16 sections */}
      <section className="mb-14">
        <div className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-8 shadow-[var(--card-shadow)]">
          <h2 className="text-h2 text-center text-[var(--navy)]">
            16 sections. One form. No switching.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-[var(--muted)]">
            Every aspect of a police station attendance covered in a single, logical flow — from
            initial instructions through to billing and supervisor review.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {FORM_SECTIONS.map((section, i) => (
              <div
                key={section}
                className="flex items-start gap-3 rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--background)] p-3"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--gold)]/10 text-xs font-bold text-[var(--gold-hover)]">
                  {i + 1}
                </span>
                <span className="text-sm font-medium text-[var(--navy)]">{section}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LAA record-keeping */}
      <section className="mb-14">
        <h2 className="text-h2 mb-2 text-[var(--navy)]">
          Designed to support LAA record-keeping
        </h2>
        <p className="mb-6 max-w-2xl text-[var(--muted)]">
          CustodyNote captures the information you need for Legal Aid Agency compliance. Every field
          is mapped to LAA requirements so your records are audit-ready from day one.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {LAA_FEATURES.map((feature) => (
            <div
              key={feature}
              className="flex items-start gap-3 rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-4 shadow-[var(--card-shadow)]"
            >
              <span className="mt-0.5 text-green-600">✓</span>
              <span className="text-sm text-[var(--navy)]">{feature}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Security */}
      <section className="mb-14">
        <h2 className="text-h2 mb-2 text-[var(--navy)]">
          Your records are too important to risk
        </h2>
        <p className="mb-6 max-w-2xl text-[var(--muted)]">
          Client records demand the highest levels of security. CustodyNote is built with data
          protection at its core.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {SECURITY_FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)]"
            >
              <h3 className="font-semibold text-[var(--navy)]">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why Freelance Reps Use Custody Note */}
      <section className="mb-14">
        <h2 className="text-h2 mb-2 text-[var(--navy)]">
          Why Freelance Reps Use Custody Note
        </h2>
        <p className="mb-6 max-w-2xl text-[var(--muted)]">
          Less admin, more organised records, more time for clients.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BILLING_FEATURES.map((f) => (
            <div
              key={f.title}
              className="group flex flex-col rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)] transition-all hover:-translate-y-0.5 hover:border-[var(--gold)]/40 hover:shadow-[var(--card-shadow-hover)]"
            >
              <h3 className="font-semibold text-[var(--navy)]">{f.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--muted)]">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Simple Pricing */}
      <section className="mb-14">
        <div className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-8 shadow-[var(--card-shadow)] sm:p-10">
          <h2 className="text-h2 text-center text-[var(--navy)]">Simple Pricing</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-[var(--muted)]">
            Subscription only — no per-seat charges, no hidden fees, no firm approval needed. Cancel
            any time.
          </p>
          <div className="mx-auto mt-8 max-w-md">
            <div className="rounded-[var(--radius-lg)] border-2 border-[var(--gold)]/40 bg-[var(--gold)]/5 p-6">
              <p className="text-center text-2xl font-bold text-[var(--navy)]">
                From £15.99<span className="text-base font-normal text-[var(--muted)]">/mo</span>
              </p>
              <p className="mt-1 text-center text-sm text-[var(--muted)]">
                30-day free trial included
              </p>
              <ul className="mt-6 space-y-3">
                {PRICING_FEATURES.map((pf) => (
                  <li key={pf} className="flex items-start gap-2 text-sm text-[var(--navy)]">
                    <span className="mt-0.5 text-green-600">✓</span>
                    {pf}
                  </li>
                ))}
              </ul>
              <a
                href={CUSTODYNOTE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-gold mt-6 flex min-h-[44px] items-center justify-center no-underline"
              >
                Start 30-Day Free Trial →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="mb-14 rounded-[var(--radius-lg)] bg-[var(--navy)] p-8 text-center sm:p-10">
        <h2 className="text-h2 text-white">Ready to try Custody Note?</h2>
        <p className="mx-auto mt-3 max-w-xl text-slate-300">
          Start your 30-day free trial today. No credit card required. Use discount code{' '}
          <span className="rounded bg-[var(--gold)] px-2.5 py-0.5 font-mono text-sm text-[var(--navy)]">
            {DISCOUNT_CODE}
          </span>{' '}
          for 25% off your subscription.
        </p>
        <a
          href={CUSTODYNOTE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-gold mt-6 inline-flex min-h-[44px] items-center no-underline"
        >
          Start 30-Day Free Trial →
        </a>
        <p className="mt-3 text-xs text-[var(--muted)]">
          No credit card for trial · Windows 10+ · From £15.99/mo · Cancel any time
        </p>
      </section>

      {/* Related */}
      <section className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/directory"
          className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 no-underline shadow-[var(--card-shadow)] transition-colors hover:border-[var(--gold)]/40"
        >
          <p className="font-medium text-[var(--navy)]">Find a Rep</p>
          <p className="mt-1 text-sm text-[var(--muted)]">Browse accredited representatives</p>
        </Link>
        <Link
          href="/register"
          className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 no-underline shadow-[var(--card-shadow)] transition-colors hover:border-[var(--gold)]/40"
        >
          <p className="font-medium text-[var(--navy)]">Register Free</p>
          <p className="mt-1 text-sm text-[var(--muted)]">Join the directory</p>
        </Link>
        <Link
          href="/FormsLibrary"
          className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 no-underline shadow-[var(--card-shadow)] transition-colors hover:border-[var(--gold)]/40"
        >
          <p className="font-medium text-[var(--navy)]">Forms Library</p>
          <p className="mt-1 text-sm text-[var(--muted)]">CRM &amp; LAA forms</p>
        </Link>
      </section>
    </div>
    </>
  );
}
