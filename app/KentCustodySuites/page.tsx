import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'KentCustodySuites | PoliceStationRepUK',
  description: 'KentCustodySuites — PoliceStationRepUK',
  path: '/KentCustodySuites',
});

export default function KentCustodySuitesPage() {
  return (
    <>
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'KentCustodySuites' },
            ]}
          />
          <h1 className="mt-3 text-h1 text-white">KentCustodySuites | PoliceStationRepUK — Find Accredited Police Station Reps</h1>

        </div>
      </section>

      <div className="page-container">
        <div className="mx-auto max-w-4xl space-y-10">

          <section>
            <h2 className="text-h2 text-[var(--navy)]">Main Custody Suites</h2>
            <p className="text-[var(--muted)] leading-relaxed">Maidstone CustodyPalace Avenue, Maidstone ME15 6NF(01622) 690690Main custody suite for Mid KentMedway CustodyPurser Way, Gillingham ME7 1NE(01634) 792277Serves Medway Towns and North KentFolkestone CustodyBouverie Road West, Folkestone CT20 2RX(01303) 289555Serves East Kent coastMargate CustodyFort Hill, Margate CT9 1HL(01843) 222222Serves Thanet areaTonbridge CustodyPembury Road, Tonbridge TN9 2HS(01732) 354545Serves West Kent.</p>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--navy)]">All Kent Police Stations</h2>
            <p className="text-[var(--muted)] leading-relaxed">Ashford Police StationTN23 1BT(01233) 896000Bexleyheath Police StationDA7 4QS(02072) 301212Bexleyheath Police StationDA7 4QS(02072) 301212Canterbury Police StationCT1 3JQColdharbourME20 7SL (01622) 690690Dover Police StationCT16 1DJ(01304) 240055Folkestone Police StationCT20 2SG(01303) 850550Kent HeadquartersME15 9BZ(01622) 690690Kentish Town Police StationNW5 3AE(02073) 881212Maidstone Police StationME15 6NF(01622) 690690Margate Police StationCT9 1HL(01843) 222222Medway Police StationME7 1NE(01634) 792000North Kent Police StationDA11 8BD(01474) 564100SevenoaksTN13 1HG(01622) 690690Sheerness Police StationME12 2PF(01795) 477111View All Kent Stations.</p>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--navy)]">Frequently Asked Questions</h2>
            <p className="text-[var(--muted)] leading-relaxed">Where are Kent Police custody suites?Kent Police operates main custody suites at Maidstone, Medway (Gillingham), Folkestone, Margate, and Tonbridge.</p>
            <p className="text-[var(--muted)] leading-relaxed">These facilities are open 24/7 and handle most arrests in the county.Can I visit someone in Kent Police custody?Visits to custody are not normally permitted.</p>
            <p className="text-[var(--muted)] leading-relaxed">However, detained persons can have someone informed of their arrest and can receive visits from their solicitor or legal representative.How do I contact Kent Police custody?You can contact Kent Police custody suites directly using the phone numbers listed on this page.</p>
            <p className="text-[var(--muted)] leading-relaxed">For general enquiries, call 101 or visit your local police station.</p>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--navy)]">Need Legal Help?</h2>
            <p className="text-[var(--muted)] leading-relaxed">Find a Kent RepAccredited representatives in KentYour RightsPACE rights at the police stationArrested?What to do if you&apos;re arrested.</p>
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
