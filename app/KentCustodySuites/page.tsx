import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { buildMetadata } from '@/lib/seo';
import { NotPoliceDeflectBanner } from '@/components/NotPoliceDeflectBanner';
import { InstructRepPrimaryCta } from '@/components/InstructRepPrimaryCta';

export const metadata = buildMetadata({
  title: 'Kent Custody Suites — Find a Police Station Representative',
  description:
    'Overview of Kent Police custody hubs and how to find accredited representatives who cover them. Not the police — call 101 or 999 for police contact.',
  path: '/KentCustodySuites',
});

const MAIN_SUITES = [
  {
    name: 'Maidstone',
    address: 'Palace Avenue, Maidstone ME15 6NF',
    note: 'Main custody suite for mid Kent — verify operational details with Kent Police.',
    slugHint: 'maidstone',
  },
  {
    name: 'Medway (Gillingham)',
    address: 'Purser Way, Gillingham ME7 1NE',
    note: 'Serves Medway towns and much of north Kent.',
    slugHint: 'medway',
  },
  {
    name: 'Folkestone',
    address: 'Bouverie Road West, Folkestone CT20 2RX',
    note: 'East Kent coast.',
    slugHint: 'folkestone',
  },
  {
    name: 'Margate',
    address: 'Fort Hill, Margate CT9 1HL',
    note: 'Thanet area.',
    slugHint: 'margate',
  },
  {
    name: 'Tonbridge',
    address: 'Pembury Road, Tonbridge TN9 2HS',
    note: 'West Kent.',
    slugHint: 'tonbridge',
  },
];

export default function KentCustodySuitesPage() {
  return (
    <>
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Kent custody suites' },
            ]}
          />
          <h1 className="mt-3 text-h1 text-white">Kent custody suites</h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-slate-200">
            Overview of main Kent Police custody hubs for solicitors and accredited representatives arranging
            cover — not a public police switchboard directory.
          </p>
          <div className="mt-5 max-w-2xl">
            <NotPoliceDeflectBanner variant="hero" />
          </div>
        </div>
      </section>

      <div className="page-container">
        <div className="mx-auto max-w-4xl space-y-10 pb-12 pt-8">
          <InstructRepPrimaryCta areaHint="Kent" showKent />

          <section>
            <h2 className="text-h2 text-[var(--navy)]">Main custody hubs</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              We do not publish custody switchboard numbers for public use. Call{' '}
              <a href="tel:101" className="font-semibold text-[var(--navy)] underline">
                101
              </a>{' '}
              (non-emergency) or{' '}
              <a href="tel:999" className="font-semibold text-[var(--navy)] underline">
                999
              </a>{' '}
              (emergency). Firms needing attendance should instruct a listed representative.
            </p>
            <ul className="mt-4 space-y-4">
              {MAIN_SUITES.map((s) => (
                <li
                  key={s.name}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <h3 className="font-bold text-[var(--navy)]">{s.name}</h3>
                  <p className="mt-1 text-sm text-[var(--muted)]">{s.address}</p>
                  <p className="mt-2 text-xs text-[var(--muted)]">{s.note}</p>
                  <p className="mt-3">
                    <Link
                      href={`/find-station?q=${encodeURIComponent(s.slugHint)}`}
                      className="text-sm font-semibold text-[var(--gold-link)] underline"
                    >
                      Open station page / find reps →
                    </Link>
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--navy)]">Other stations and full directory</h2>
            <p className="text-[var(--muted)] leading-relaxed">
              Kent has many local police stations; not all hold custody. Browse the{' '}
              <Link href="/StationsDirectory" className="font-semibold text-[var(--navy)] underline">
                stations directory
              </Link>{' '}
              or{' '}
              <Link href="/directory/kent" className="font-semibold text-[var(--navy)] underline">
                Kent reps
              </Link>
              .
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-h2 text-[var(--navy)]">Frequently asked questions</h2>
            <dl className="space-y-4 text-[var(--muted)] leading-relaxed">
              <div>
                <dt className="font-bold text-[var(--navy)]">Can I get the custody suite phone number here?</dt>
                <dd className="mt-1">
                  No. This site does not publish custody switchboard numbers for public use. Call 101 or 999.
                  Criminal defence firms should instruct an accredited representative via the directory.
                </dd>
              </div>
              <div>
                <dt className="font-bold text-[var(--navy)]">How do I arrange Kent police station cover?</dt>
                <dd className="mt-1">
                  Use{' '}
                  <Link href="/KentAgentCover" className="font-semibold text-[var(--navy)] underline">
                    Kent agency cover
                  </Link>{' '}
                  or search the{' '}
                  <Link href="/directory/kent" className="font-semibold text-[var(--navy)] underline">
                    Kent directory
                  </Link>
                  .
                </dd>
              </div>
            </dl>
          </section>

          <InstructRepPrimaryCta areaHint="Kent" showKent />
        </div>
      </div>
    </>
  );
}
