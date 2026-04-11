import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Kent Police Station Representatives — Find Reps in Kent',
  description:
    'Browse accredited police station representatives covering Kent. Free directory — filter by area and contact reps for custody attendance.',
  path: '/KentPoliceStationReps',
});

const AREAS = ['Maidstone', 'Medway', 'Tonbridge', 'Gravesend', 'Sevenoaks', 'Swanley', 'Canterbury', 'Folkestone'];

export default function KentPoliceStationRepsPage() {
  return (
    <>
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Kent police station reps' },
            ]}
          />
          <h1 className="mt-3 text-h1 text-white">Kent police station representatives</h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-slate-200">
            Find accredited representatives covering Kent custody suites and police stations. Search the free directory,
            then contact reps directly to agree cover.
          </p>
          <p className="mt-6">
            <Link href="/directory/kent" className="btn-gold inline-flex no-underline">
              Open Kent directory
            </Link>
          </p>
        </div>
      </section>

      <div className="page-container">
        <div className="mx-auto max-w-4xl space-y-10 pb-12 pt-8">
          <section>
            <h2 className="text-h2 text-[var(--navy)]">Browse by area</h2>
            <p className="mt-2 text-[var(--muted)] leading-relaxed">
              These labels match common search terms — use the directory for live coverage and contact details.
            </p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {AREAS.map((a) => (
                <li key={a}>
                  <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-[var(--navy)]">
                    {a}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-h2 text-[var(--navy)]">Frequently asked questions</h2>
            <dl className="space-y-4 text-[var(--muted)] leading-relaxed">
              <div>
                <dt className="font-bold text-[var(--navy)]">How do I find a rep in Kent?</dt>
                <dd className="mt-1">
                  Use the{' '}
                  <Link href="/directory/kent" className="font-semibold text-[var(--navy)] underline">
                    Kent directory hub
                  </Link>{' '}
                  or{' '}
                  <Link href="/search" className="font-semibold text-[var(--navy)] underline">
                    search
                  </Link>{' '}
                  for a station or town name.
                </dd>
              </div>
              <div>
                <dt className="font-bold text-[var(--navy)]">Is advice at the police station free?</dt>
                <dd className="mt-1">
                  For those who qualify for legal aid, advice at the police station is funded through legal aid subject to
                  means and merits. Others pay privately. This site does not give legal advice.
                </dd>
              </div>
              <div>
                <dt className="font-bold text-[var(--navy)]">Which custody suites are in Kent?</dt>
                <dd className="mt-1">
                  Kent Police operates several main custody hubs (including Maidstone, Medway, Folkestone, Margate, and
                  Tonbridge). See{' '}
                  <Link href="/KentCustodySuites" className="font-semibold text-[var(--navy)] underline">
                    Kent custody suites
                  </Link>{' '}
                  for an overview and phone numbers.
                </dd>
              </div>
            </dl>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--navy)]">Useful resources</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-[var(--muted)] marker:text-[var(--gold)]">
              <li>
                <Link href="/KentCustodySuites" className="font-semibold text-[var(--navy)] underline">
                  Kent custody suites
                </Link>{' '}
                — locations and contact numbers
              </li>
              <li>
                <Link href="/PACE" className="font-semibold text-[var(--navy)] underline">
                  PACE overview
                </Link>{' '}
                — rights and procedure
              </li>
              <li>
                <Link href="/KentAgentCover" className="font-semibold text-[var(--navy)] underline">
                  Kent agent cover
                </Link>{' '}
                — for firms needing cover
              </li>
              <li>
                <Link href="/StationsDirectory" className="font-semibold text-[var(--navy)] underline">
                  Station numbers directory
                </Link>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--navy)]">Are you a Kent rep?</h2>
            <p className="text-[var(--muted)] leading-relaxed">
              <Link href="/register" className="font-semibold text-[var(--navy)] underline decoration-[var(--gold)] underline-offset-2">
                Register for free
              </Link>{' '}
              to appear in the directory (subject to verification steps).
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
