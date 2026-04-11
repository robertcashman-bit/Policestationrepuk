import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Gravesend Police Station Representatives | North Kent Cover',
  description:
    'Find accredited police station representatives covering Gravesend and north Kent. Custody work is often handled at Medway — browse the directory for live listings.',
  path: '/GravesendPoliceStationReps',
});

export default function GravesendPoliceStationRepsPage() {
  return (
    <>
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Gravesend police station reps' },
            ]}
          />
          <h1 className="mt-3 text-h1 text-white">Gravesend police station representatives</h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-slate-200">
            North Kent and Thames-side arrests are often processed through regional custody hubs. Use the directory to find
            reps who cover Gravesend, Medway, and surrounding areas.
          </p>
          <p className="mt-6">
            <Link href="/directory/kent" className="btn-gold inline-flex no-underline">
              Kent directory
            </Link>
          </p>
        </div>
      </section>

      <div className="page-container">
        <div className="mx-auto max-w-4xl space-y-10 pb-12 pt-8">
          <section className="rounded-xl border border-slate-200 bg-slate-50/80 p-5">
            <h2 className="text-h2 text-[var(--navy)]">Gravesend and custody</h2>
            <p className="mt-2 text-[var(--muted)] leading-relaxed">
              Many arrests in the Gravesend area are booked into Medway (Gillingham) or other Kent hubs depending on
              operational routing. Always confirm the live custody location with the custody officer or duty desk — do
              not rely on a landing page for operational addresses.
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--navy)]">Representatives covering the area</h2>
            <p className="text-[var(--muted)] leading-relaxed">
              Browse{' '}
              <Link href="/directory/kent" className="font-semibold text-[var(--navy)] underline">
                Kent representatives
              </Link>{' '}
              and filter by stations or availability text that matches your need. For station-specific context, try{' '}
              <Link href="/police-station/medway-police-station" className="font-semibold text-[var(--navy)] underline">
                Medway
              </Link>{' '}
              or{' '}
              <Link href="/police-station/north-kent-police-station" className="font-semibold text-[var(--navy)] underline">
                North Kent
              </Link>{' '}
              station pages if present in the directory.
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--navy)]">Nearby hubs</h2>
            <p className="text-[var(--muted)] leading-relaxed">
              <Link href="/KentCustodySuites" className="font-semibold text-[var(--navy)] underline">
                Kent custody suites
              </Link>
              {' · '}
              <Link href="/KentPoliceStationReps" className="font-semibold text-[var(--navy)] underline">
                Kent reps hub
              </Link>
              {' · '}
              <Link href="/StationsDirectory" className="font-semibold text-[var(--navy)] underline">
                Station numbers
              </Link>
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--navy)]">Need help in the Gravesend area?</h2>
            <p className="text-[var(--muted)] leading-relaxed">
              Instruct a solicitor or accredited representative for your case — this website only lists professionals; it
              does not provide emergency dispatch.
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
