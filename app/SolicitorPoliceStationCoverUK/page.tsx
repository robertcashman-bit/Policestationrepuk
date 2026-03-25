import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Police Station Cover for Solicitors — Find Rep Cover UK',
  description: 'Find reliable police station agent cover across England and Wales. Outsource custody attendance to accredited reps — maintain duty solicitor compliance without attending every call-out yourself.',
  path: '/SolicitorPoliceStationCoverUK',
});

export default function SolicitorPoliceStationCoverUKPage() {
  return (
    <>
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Solicitorpolicestationcoveruk' },
            ]}
          />
          <h1 className="mt-3 text-h1 text-white">Police Station Cover for Solicitors</h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-white">UKPolice Station Cover for SolicitorsFind reliable agent cover across England &amp; Wales</p>
        </div>
      </section>

      <div className="page-container">
        <div className="mx-auto max-w-4xl space-y-10">

          <section>
            <h2 className="text-h2 text-[var(--navy)]">Agent Cover for Criminal Defence Firms</h2>
            <p className="text-[var(--muted)] leading-relaxed">Finding reliable police station cover shouldn&apos;t be difficult.</p>
            <p className="text-[var(--muted)] leading-relaxed">Our directory connects solicitor firms with accredited representatives across England and Wales, available for overnight, weekend, and bank holiday coverage.Whether you need regular cover arrangements or emergency support, browse our directory to find the right rep for your firm&apos;s needs.</p>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--navy)]">Types of Cover Available</h2>
            <p className="text-[var(--muted)] leading-relaxed">Overnight CoverRepresentatives available through the night when your team is restingWeekend &amp; Bank HolidaysFull coverage during periods when offices are closedGeographical ExpansionCover areas beyond your usual catchmentOverflow SupportAdditional capacity during busy periods.</p>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--navy)]">Browse by Region</h2>
            <p className="text-[var(--muted)] leading-relaxed">Kent→London→Essex→Surrey→Sussex→Hampshire→View All Counties.</p>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--navy)]">Why Use Our Directory</h2>
            <p className="text-[var(--muted)] leading-relaxed">For Solicitor FirmsAll reps are registered and state accreditationDirect contact details availableFilter by area, availability, and accreditationFree to browse and contactQuality AssurancePSRAS accredited representativesDuty solicitors with PS qualificationExperienced in police station workProfessional and reliable service.</p>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--navy)]">Frequently Asked Questions</h2>
            <p className="text-[var(--muted)] leading-relaxed">What is police station cover for solicitors?Police station cover is when a solicitor firm arranges for an accredited representative or another solicitor to attend custody on their behalf.</p>
            <p className="text-[var(--muted)] leading-relaxed">This is commonly used for unsociable hours, high-volume periods, or geographical coverage.How do I find police station cover across England &amp; Wales?Our directory lists accredited police station representatives across all counties in England and Wales.</p>
            <p className="text-[var(--muted)] leading-relaxed">You can search by county or station to find available reps in your area.Are all representatives in the directory accredited?All representatives listed state they are either PSRAS accredited representatives or duty solicitors with police station qualifications.</p>
            <p className="text-[var(--muted)] leading-relaxed">Details are verified at registration.</p>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--navy)]">Find Cover Now</h2>
            <p className="text-[var(--muted)] leading-relaxed">Browse our national directory of accredited police station representatives.Browse Full Directory.</p>
          </section>

          <section className="rounded-[var(--radius-lg)] bg-[var(--navy)] p-8 text-center">
            <h2 className="text-xl font-bold text-white">Need Help?</h2>
            <p className="mt-2 text-white">
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
