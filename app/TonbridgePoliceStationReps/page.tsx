import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Tonbridge Police Station Representatives | West Kent Cover',
  description: 'Find accredited police station representatives for Tonbridge and Tunbridge Wells custody suites. Custody rep cover and accredited representative attendance across West Kent.',
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
              { label: 'TonbridgePoliceStationReps' },
            ]}
          />
          <h1 className="mt-3 text-h1 text-white">TonbridgePoliceStationReps | PoliceStationRepUK</h1>

        </div>
      </section>

      <div className="page-container">
        <div className="mx-auto max-w-4xl space-y-10">

          <section>
            <h2 className="text-h2 text-[var(--navy)]">Tonbridge Custody Suite</h2>
            <p className="text-[var(--muted)] leading-relaxed">Pembury Road, Tonbridge TN9 2HSServes West Kent area.</p>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--navy)]">Representatives Covering Tonbridge</h2>
            <p className="text-[var(--muted)] leading-relaxed">Aaron RegelousAccredited Police Station RepShow Contact Details•••• •••••••KentStations Covered (1):Medway Margate Maidstone Ashford Sittingbourne North Kent Dover Folkestone Bromley Croydon Tonbridge Tunbridge WellsAvailability: Any TimeDonna WildeDUTY SOLICITORShow Contact Details•••• •••••••KentStations Covered (3):Margate Police StationFolkestone Police StationCanterbury Police StationAvailability: FlexibleKatie MayAccredited RepresentativeShow Contact Details•••• •••••••KentStations Covered (3):Folkestone Police StationAshford Police StationCanterbury Police StationAvailability: Thurs, Fri, Sat, SundayMark ChesterAccredited Police Station RepShow Contact Details•••• •••••••KentStations Covered (4):BromleySidcupTonbridgeDartfordAvailability: 24 HoursMark DavisAccredited RepresentativeS.</p>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--navy)]">Other Kent Areas</h2>
            <p className="text-[var(--muted)] leading-relaxed">SevenoaksMaidstoneAll Kent Areas.</p>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--navy)]">Need Help at Tonbridge Police Station?</h2>
            <p className="text-[var(--muted)] leading-relaxed">Contact any of the representatives above for immediate assistance.Know Your Rights.</p>
          </section>

          <section className="rounded-[var(--radius-lg)] bg-[var(--navy)] p-8 text-center">
            <h2 className="text-xl font-bold text-white">Need Help?</h2>
            <p className="mt-2 text-slate-300">
              Find an accredited police station representative or get in touch with our team.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Link href="/directory" className="btn-gold no-underline">
                Find a Rep
              </Link>
              <Link href="/Contact" className="btn-outline no-underline">
                Contact Us
              </Link>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
