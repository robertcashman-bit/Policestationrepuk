import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Kent Police Station Representatives — Find Reps in Kent',
  description: 'Browse accredited police station representatives covering Kent. Experienced reps available 24/7 for duty solicitor cover at all Kent custody suites. Free directory — no fees.',
  path: '/KentPoliceStationReps',
});

export default function KentPoliceStationRepsPage() {
  return (
    <>
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Kentpolicestationreps' },
            ]}
          />
          <h1 className="mt-3 text-h1 text-white">Kentpolicestationreps | PoliceStationRepUK</h1>

        </div>
      </section>

      <div className="page-container">
        <div className="mx-auto max-w-4xl space-y-10">

          <section>
            <h2 className="text-h2 text-[var(--navy)]">All Kent Representatives</h2>
            <p className="text-[var(--muted)] leading-relaxed">Aaron RegelousAccredited Police Station RepShow Contact Details•••• •••••••KentStations Covered (1):Medway Margate Maidstone Ashford Sittingbourne North Kent Dover Folkestone Bromley Croydon Tonbridge Tunbridge WellsAvailability: Any TimeDonna WildeDUTY SOLICITORShow Contact Details•••• •••••••KentStations Covered (3):Margate Police StationFolkestone Police StationCanterbury Police StationAvailability: FlexibleKatie MayAccredited RepresentativeShow Contact Details•••• •••••••KentStations Covered (3):Folkestone Police StationAshford Police StationCanterbury Police StationAvailability: Thurs, Fri, Sat, SundayMark ChesterAccredited Police Station RepShow Contact Details•••• •••••••KentStations Covered (4):BromleySidcupTonbridgeDartfordAvailability: 24 HoursMark DavisAccredited RepresentativeS.</p>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--navy)]">Browse by Kent Area</h2>
            <p className="text-[var(--muted)] leading-relaxed">MaidstoneMedwayTonbridgeGravesendSevenoaksSwanley.</p>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--navy)]">Frequently Asked Questions</h2>
            <p className="text-[var(--muted)] leading-relaxed">How do I find a police station rep in Kent?You can find accredited police station representatives in Kent through our directory above.</p>
            <p className="text-[var(--muted)] leading-relaxed">All reps listed are verified and cover Kent police stations including Maidstone, Medway, Tonbridge, and more.Is legal advice at Kent police stations free?Yes, legal advice at police stations is free under legal aid.</p>
            <p className="text-[var(--muted)] leading-relaxed">You have the right to a solicitor or accredited representative at no cost when detained or attending a voluntary interview.Which police stations are in Kent?Kent Police operates custody suites at Maidstone, Medway (Gillingham), Folkestone, Margate, and Tonbridge.</p>
            <p className="text-[var(--muted)] leading-relaxed">Our directory lists representatives who cover these and other Kent stations.</p>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--navy)]">Useful Resources</h2>
            <p className="text-[var(--muted)] leading-relaxed">Kent Custody SuitesLocations and contact detailsYour RightsPACE rights explainedKent Agent CoverFor solicitors needing cover.</p>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--navy)]">Are You a Kent Rep?</h2>
            <p className="text-[var(--muted)] leading-relaxed">Join our directory and connect with solicitors across Kent.Register (Free).</p>
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
