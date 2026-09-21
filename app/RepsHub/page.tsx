import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Reps Hub — Tools & Resources for Police Station Reps',
  description:
    'Central hub for accredited police station representatives. Access training guides, fee calculators, legal updates, the rep knowledge base, and career development resources — all free.',
  path: '/RepsHub',
});

const HUB_SECTIONS = [
  {
    title: 'Get accredited',
    blurb: 'Route overview, exams, portfolio, and supervision.',
    links: [
      { href: '/HowToBecome', label: 'How to become a rep' },
      { href: '/HowToBecomePoliceStationRep', label: 'Full 2026 guide' },
      { href: '/BeginnersGuide', label: "Beginner's guide" },
      { href: '/GettingStarted', label: 'Getting started' },
      { href: '/FindSupervisingSolicitor', label: 'Find a supervising solicitor' },
    ],
  },
  {
    title: 'Practice tools',
    blurb: 'Fees, forms, and custody-desk software.',
    links: [
      { href: '/CustodyNote', label: 'Custody Note (Store + Mac)' },
      { href: '/EscapeFeeCalculator', label: 'Escape fee calculator' },
      { href: '/FormsLibrary', label: 'Forms library' },
      { href: '/PoliceStationRates', label: 'Station rates' },
    ],
  },
  {
    title: 'Knowledge base',
    blurb: 'PACE, wiki, and day-to-day reference.',
    links: [
      { href: '/Wiki', label: 'Rep wiki' },
      { href: '/PACE', label: 'PACE codes' },
      { href: '/Resources', label: 'Knowledge centre' },
      { href: '/DutySolicitorVsRep', label: 'Duty solicitor vs rep' },
      { href: '/WhatDoesRepDo', label: 'What does a rep do?' },
    ],
  },
  {
    title: 'Directory & cover',
    blurb: 'Get found by firms — or instruct cover.',
    links: [
      { href: '/directory', label: 'Browse directory' },
      { href: '/register', label: 'Join free' },
      { href: '/StationsDirectory', label: 'Station numbers' },
      { href: '/KentAgentCover', label: 'Kent agency cover' },
    ],
  },
] as const;

export default function RepsHubPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-[var(--navy)] py-12 sm:py-16">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 70% 55% at 50% -10%, rgba(250,204,21,0.16), transparent 55%)',
          }}
          aria-hidden
        />
        <div className="page-container relative !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'RepsHub' },
            ]}
          />
          <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--gold)]">
            For representatives
          </p>
          <h1 className="font-display mt-2 text-h1 text-white">RepsHub</h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/85 sm:text-lg">
            Training, fees, PACE, and directory tools — one place for accredited police station
            representatives.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/HowToBecome" className="btn-gold no-underline">
              How to become a rep
            </Link>
            <Link
              href="/register"
              className="inline-flex min-h-[44px] items-center rounded-lg border-2 border-white/40 px-5 text-sm font-bold text-white no-underline hover:border-[var(--gold)] hover:bg-white/10"
            >
              Join the directory free
            </Link>
          </div>
        </div>
      </section>

      <div className="page-container">
        <div className="mx-auto max-w-5xl space-y-10">
          <div className="grid gap-5 sm:grid-cols-2">
            {HUB_SECTIONS.map((section) => (
              <section
                key={section.title}
                className="rounded-2xl border border-[var(--card-border)] bg-white p-6 shadow-sm"
              >
                <h2 className="font-display text-lg font-bold text-[var(--navy)]">{section.title}</h2>
                <p className="mt-1 text-sm text-[var(--muted)]">{section.blurb}</p>
                <ul className="mt-4 space-y-2">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm font-semibold text-[var(--navy)] underline decoration-[var(--gold)]/50 underline-offset-2 hover:decoration-[var(--gold)]"
                      >
                        {link.label} →
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <section className="rounded-2xl bg-[var(--navy)] p-8 text-center">
            <h2 className="font-display text-xl font-bold text-white">Need help?</h2>
            <p className="mt-2 text-slate-300">
              Find an accredited police station representative or get in touch with our team.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Link href="/directory" className="btn-gold no-underline">
                Find a Rep
              </Link>
              <Link
                href="/Contact"
                className="inline-flex min-h-[44px] items-center rounded-lg border-2 border-white/40 px-5 text-sm font-bold text-white no-underline hover:border-[var(--gold)]"
              >
                Contact Us
              </Link>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
