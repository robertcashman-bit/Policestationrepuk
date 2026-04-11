import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Tonbridge Police Station Representatives | West Kent Cover',
  description:
    'Find accredited police station representatives for Tonbridge and west Kent. Use the free directory to contact reps for Tonbridge custody suite and surrounding stations.',
  path: '/TonbridgePoliceStationReps',
});

export default function TonbridgePoliceStationRepsPage() {
  return (
    <>
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Tonbridge police station reps' },
            ]}
          />
          <h1 className="mt-3 text-h1 text-white">Tonbridge police station representatives</h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-slate-200">
            West Kent custody cover — search the directory for reps who list Tonbridge and nearby stations, then contact
            them to confirm availability.
          </p>
          <p className="mt-6 flex flex-wrap gap-3">
            <Link href="/directory/kent" className="btn-gold inline-flex no-underline">
              Kent directory
            </Link>
            <Link href="/search?q=Tonbridge" className="btn-outline inline-flex border-white/40 !text-white hover:!border-[var(--gold)] hover:!text-[var(--gold)]">
              Search Tonbridge
            </Link>
          </p>
        </div>
      </section>

      <div className="page-container">
        <div className="mx-auto max-w-4xl space-y-10 pb-12 pt-8">
          <section className="rounded-xl border border-slate-200 bg-slate-50/80 p-5">
            <h2 className="text-h2 text-[var(--navy)]">Tonbridge custody suite</h2>
            <p className="mt-2 text-[var(--muted)] leading-relaxed">
              Pembury Road, Tonbridge TN9 2HS — serves much of west Kent. Phone numbers and updates change; confirm on the
              force website or custody desk before relying on any number for operational use.
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--navy)]">Representatives covering Tonbridge</h2>
            <p className="text-[var(--muted)] leading-relaxed">
              We do not embed live directory data on this landing page — it goes out of date quickly. Use the{' '}
              <Link href="/directory/kent" className="font-semibold text-[var(--navy)] underline">
                Kent hub
              </Link>{' '}
              or{' '}
              <Link href="/police-station/tonbridge-police-station" className="font-semibold text-[var(--navy)] underline">
                Tonbridge station page
              </Link>{' '}
              (where available) for rep counts and links.
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--navy)]">Other Kent areas</h2>
            <p className="text-[var(--muted)] leading-relaxed">
              <Link href="/KentPoliceStationReps" className="font-semibold text-[var(--navy)] underline">
                Kent reps overview
              </Link>
              {' · '}
              <Link href="/directory/kent" className="font-semibold text-[var(--navy)] underline">
                Full Kent list
              </Link>
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--navy)]">Rights and procedure</h2>
            <p className="text-[var(--muted)] leading-relaxed">
              For clients, see{' '}
              <Link href="/PACE" className="font-semibold text-[var(--navy)] underline">
                PACE rights
              </Link>{' '}
              and the general{' '}
              <Link href="/Wiki" className="font-semibold text-[var(--navy)] underline">
                wiki
              </Link>
              . This site does not give case-specific legal advice.
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
