import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Kent Agent Cover — Police Station Rep Attendance Kent',
  description: 'Reliable police station agent cover across Kent for criminal defence solicitors. Find experienced reps for duty solicitor shifts, overnight attendance, and private client instructions at Kent custody suites.',
  path: '/KentAgentCover',
});

export default function KentAgentCoverPage() {
  return (
    <>
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'KentAgentCover' },
            ]}
          />
          <h1 className="mt-3 text-h1 text-white">Kent Agent Cover</h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-white">Kent Agent CoverReliable police station representation for solicitors across Kent</p>
        </div>
      </section>

      <div className="page-container">
        <div className="mx-auto max-w-4xl space-y-10">

          <section>
            <h2 className="text-h2 text-[var(--navy)]">For Solicitors Needing Cover in Kent</h2>
            <p className="text-[var(--muted)] leading-relaxed">Whether you need overnight cover, weekend representation, or additional capacity during busy periods, our directory connects you with accredited police station representatives across Kent.All representatives listed are verified, accredited, and experienced in police station work.</p>
            <p className="text-[var(--muted)] leading-relaxed">Browse our directory to find the right rep for your needs.</p>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--navy)]">Why Use Our Directory</h2>
            <p className="text-[var(--muted)] leading-relaxed">24/7 AvailabilityRepresentatives available for overnight and unsociable hoursAll Kent Custody SuitesCoverage across Maidstone, Medway, Tonbridge, and moreAccredited ProfessionalsAll reps are PSRAS accredited or duty solicitorsQuick ResponseImmediate availability for urgent cases.</p>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--navy)]">Custody Suites Covered</h2>
            <p className="text-[var(--muted)] leading-relaxed">Our directory includes representatives who cover all Kent Police custody suites:MaidstoneMedway (Gillingham)FolkestoneMargateTonbridgeView Full Custody Suite Details.</p>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--navy)]">Finding the Right Rep</h2>
            <p className="text-[var(--muted)] leading-relaxed">1Browse DirectoryView all Kent representatives with their availability and contact details2Contact DirectlyCall or message reps directly to arrange cover3Confirm AttendanceRep attends custody suite on your behalf.</p>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--navy)]">Frequently Asked Questions</h2>
            <p className="text-[var(--muted)] leading-relaxed">What is agent cover for police station work?Agent cover is when an accredited police station representative attends on behalf of a solicitor firm.</p>
            <p className="text-[var(--muted)] leading-relaxed">This is commonly used for overnight, weekend, and bank holiday cases, or when firm capacity is stretched.How do I find agent cover in Kent?You can find accredited representatives covering Kent through our directory.</p>
            <p className="text-[var(--muted)] leading-relaxed">All listed reps are verified and available for agent work across Kent custody suites.What custody suites are covered in Kent?Kent Police operates custody suites at Maidstone, Medway (Gillingham), Folkestone, Margate, and Tonbridge.</p>
            <p className="text-[var(--muted)] leading-relaxed">Our directory lists representatives who cover all these locations.</p>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--navy)]">Find Kent Representatives Now</h2>
            <p className="text-[var(--muted)] leading-relaxed">Browse our directory of accredited police station representatives covering all Kent custody suites.View Kent RepsNational Cover Options.</p>
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
