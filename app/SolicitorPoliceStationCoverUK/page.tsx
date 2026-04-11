import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Police Station Cover for Law Firms UK | Rep Directory',
  description:
    'Find reliable police station rep cover across England and Wales. Outsource custody attendance to accredited representatives — browse the free rep directory for overnight, weekend, and overflow cover.',
  path: '/SolicitorPoliceStationCoverUK',
});

const COVER_TYPES = [
  {
    title: 'Overnight cover',
    detail: 'Representatives available when your own team is off duty or at capacity.',
  },
  {
    title: 'Weekends and bank holidays',
    detail: 'Cover when offices are closed but custody suites are not.',
  },
  {
    title: 'Geographic expansion',
    detail: 'Short-term or ongoing cover outside your usual patch.',
  },
  {
    title: 'Overflow',
    detail: 'Extra capacity when multiple arrests land at once.',
  },
];

const REGIONS = [
  { href: '/directory/kent', label: 'Kent' },
  { href: '/directory/london', label: 'London' },
  { href: '/directory/essex', label: 'Essex' },
  { href: '/directory/surrey', label: 'Surrey' },
  { href: '/directory/sussex', label: 'Sussex' },
  { href: '/directory/hampshire', label: 'Hampshire' },
];

export default function SolicitorPoliceStationCoverUKPage() {
  return (
    <>
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Police station cover for solicitors' },
            ]}
          />
          <h1 className="mt-3 text-h1 text-white">Police station cover for solicitors</h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-slate-200">
            Find accredited representatives and agents across England and Wales for overnight, weekend, and overflow
            custody attendance — free to search; firms complete their own checks before instructing.
          </p>
        </div>
      </section>

      <div className="page-container">
        <div className="mx-auto max-w-4xl space-y-10 pb-12 pt-8">
          <section className="space-y-3">
            <h2 className="text-h2 text-[var(--navy)]">Agent cover for criminal defence firms</h2>
            <p className="text-[var(--muted)] leading-relaxed">
              Reliable police station cover should not depend on a single WhatsApp chain. Our directory lists
              representatives who publish areas, availability signals, and contact routes so you can shortlist quickly,
              then complete conflicts and terms in the usual way.
            </p>
            <p className="text-[var(--muted)] leading-relaxed">
              Use it for regular rota gaps, one-off overflow, or emergency cover — always confirm the rep is free and
              suitable for your matter before instruction.
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--navy)]">Types of cover</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {COVER_TYPES.map((c) => (
                <li
                  key={c.title}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <span className="font-bold text-[var(--navy)]">{c.title}</span>
                  <p className="mt-1 text-sm text-[var(--muted)] leading-relaxed">{c.detail}</p>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--navy)]">Browse by area</h2>
            <p className="text-[var(--muted)] leading-relaxed">
              Open a county hub, then filter and contact reps. Not every county has a hub yet — use{' '}
              <Link href="/search" className="font-semibold text-[var(--navy)] underline decoration-[var(--gold)] underline-offset-2">
                search
              </Link>{' '}
              or the full{' '}
              <Link href="/directory" className="font-semibold text-[var(--navy)] underline decoration-[var(--gold)] underline-offset-2">
                directory
              </Link>{' '}
              for other regions.
            </p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {REGIONS.map((r) => (
                <li key={r.href}>
                  <Link
                    href={r.href}
                    className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-[var(--navy)] no-underline transition-colors hover:border-[var(--gold)]"
                  >
                    {r.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/directory/counties"
                  className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-[var(--navy)] no-underline transition-colors hover:border-[var(--gold)]"
                >
                  All counties →
                </Link>
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-h2 text-[var(--navy)]">Why use the directory</h2>
            <ul className="list-disc space-y-2 pl-5 text-[var(--muted)] leading-relaxed marker:text-[var(--gold)]">
              <li>Reps register with accreditation and coverage information you can see before you call.</li>
              <li>Direct contact details where the rep chooses to publish them.</li>
              <li>Filter by area and availability-style fields to narrow the list.</li>
              <li>Free to browse — PoliceStationRepUK does not take a booking fee.</li>
            </ul>
            <p className="text-sm text-[var(--muted)]">
              Your firm remains responsible for instruction, conflicts, insurer rules, and supervision.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-h2 text-[var(--navy)]">Frequently asked questions</h2>
            <dl className="space-y-4 text-[var(--muted)] leading-relaxed">
              <div>
                <dt className="font-bold text-[var(--navy)]">What is police station cover for solicitors?</dt>
                <dd className="mt-1">
                  It is arranged attendance at custody on your firm&apos;s behalf — usually by an accredited rep or another
                  solicitor — often used for unsocial hours, volume spikes, or geography.
                </dd>
              </div>
              <div>
                <dt className="font-bold text-[var(--navy)]">How do I find cover nationally?</dt>
                <dd className="mt-1">
                  Use the{' '}
                  <Link href="/directory" className="font-semibold text-[var(--navy)] underline">
                    directory
                  </Link>{' '}
                  and search by county or station names relevant to your case.
                </dd>
              </div>
              <div>
                <dt className="font-bold text-[var(--navy)]">Are listed reps accredited?</dt>
                <dd className="mt-1">
                  Listings are self-declared. You should verify accreditation, insurance, and experience for every
                  instruction.
                </dd>
              </div>
            </dl>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--navy)]">Find cover now</h2>
            <p className="text-[var(--muted)] leading-relaxed">
              <Link href="/directory" className="btn-gold inline-flex no-underline">
                Browse full directory
              </Link>
            </p>
          </section>

          <section className="rounded-[var(--radius-lg)] bg-[var(--navy)] p-8 text-center">
            <h2 className="text-xl font-bold text-white">Need help?</h2>
            <p className="mt-2 text-slate-300">
              Find an accredited police station representative or get in touch with our team.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Link href="/directory" className="btn-gold no-underline">
                Find a rep
              </Link>
              <Link href="/Contact" className="btn-outline no-underline">
                Contact us
              </Link>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
