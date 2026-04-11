import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Kent Custody Suites — Police Station Locations & Cover',
  description:
    'Overview of Kent Police custody hubs and how to find accredited representatives who cover them. Confirm operational details with the force.',
  path: '/KentCustodySuites',
});

const MAIN_SUITES = [
  {
    name: 'Maidstone',
    address: 'Palace Avenue, Maidstone ME15 6NF',
    tel: '(01622) 690690',
    note: 'Main custody suite for mid Kent — verify on Kent Police website for changes.',
  },
  {
    name: 'Medway (Gillingham)',
    address: 'Purser Way, Gillingham ME7 1NE',
    tel: '(01634) 792277',
    note: 'Serves Medway towns and much of north Kent.',
  },
  {
    name: 'Folkestone',
    address: 'Bouverie Road West, Folkestone CT20 2RX',
    tel: '(01303) 289555',
    note: 'East Kent coast.',
  },
  {
    name: 'Margate',
    address: 'Fort Hill, Margate CT9 1HL',
    tel: '(01843) 222222',
    note: 'Thanet area.',
  },
  {
    name: 'Tonbridge',
    address: 'Pembury Road, Tonbridge TN9 2HS',
    tel: '(01732) 354545',
    note: 'West Kent.',
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
            Overview of main Kent Police custody hubs. Phone numbers and routing change — confirm operational details with
            Kent Police or the custody desk before relying on them for time-critical work.
          </p>
        </div>
      </section>

      <div className="page-container">
        <div className="mx-auto max-w-4xl space-y-10 pb-12 pt-8">
          <section>
            <h2 className="text-h2 text-[var(--navy)]">Main custody hubs</h2>
            <ul className="mt-4 space-y-4">
              {MAIN_SUITES.map((s) => (
                <li
                  key={s.name}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <h3 className="font-bold text-[var(--navy)]">{s.name}</h3>
                  <p className="mt-1 text-sm text-[var(--muted)]">{s.address}</p>
                  <p className="mt-1 text-sm">
                    <span className="text-[var(--muted)]">Tel: </span>
                    <span className="font-medium text-[var(--navy)]">{s.tel}</span>
                  </p>
                  <p className="mt-2 text-xs text-[var(--muted)]">{s.note}</p>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--navy)]">Other stations and full directory</h2>
            <p className="text-[var(--muted)] leading-relaxed">
              Kent has many local police stations; not all hold custody. For a wider list of station contact numbers, use
              the{' '}
              <Link href="/StationsDirectory" className="font-semibold text-[var(--navy)] underline">
                stations directory
              </Link>
              . Operational use of any number remains your responsibility to verify.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-h2 text-[var(--navy)]">Frequently asked questions</h2>
            <dl className="space-y-4 text-[var(--muted)] leading-relaxed">
              <div>
                <dt className="font-bold text-[var(--navy)]">Where are Kent custody suites?</dt>
                <dd className="mt-1">
                  Main hubs include Maidstone, Medway (Gillingham), Folkestone, Margate, and Tonbridge — routing depends on
                  where someone was arrested and operational capacity.
                </dd>
              </div>
              <div>
                <dt className="font-bold text-[var(--navy)]">Can I visit someone in custody?</dt>
                <dd className="mt-1">
                  Visits are tightly controlled. Detained persons can usually have legal advice; private visits follow
                  force policy. Ask custody staff — this page is not operational guidance.
                </dd>
              </div>
              <div>
                <dt className="font-bold text-[var(--navy)]">How do I contact custody?</dt>
                <dd className="mt-1">
                  Use the numbers above as a starting point, or call 101 for general enquiries. For legal representatives,
                  follow your firm&apos;s usual custody contact procedures.
                </dd>
              </div>
            </dl>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--navy)]">Need a rep?</h2>
            <p className="text-[var(--muted)] leading-relaxed">
              <Link href="/directory/kent" className="font-semibold text-[var(--navy)] underline">
                Find Kent representatives
              </Link>
              {' · '}
              <Link href="/PACE" className="font-semibold text-[var(--navy)] underline">
                PACE rights overview
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
