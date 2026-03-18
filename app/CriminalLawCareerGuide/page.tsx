import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { CrawlContent } from '@/components/CrawlContent';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Criminallawcareerguide | PoliceStationRepUK',
  description: 'A comprehensive guide to becoming a criminal solicitor or fee-earner — covering the SQE, apprenticeships, CILEX pathways, and practical steps to launch you',
  path: '/CriminalLawCareerGuide',
});

export default function CriminalLawCareerGuidePage() {
  return (
    <>
      <section className="bg-[var(--navy)] py-12 sm:py-16">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Criminallawcareerguide' },
            ]}
          />
          <h1 className="mt-4 text-h1 text-white">How to Get Into Criminal Law in England &amp; Wales</h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-300">
            A comprehensive guide to becoming a criminal solicitor or fee-earner — covering the SQE, apprenticeships, CILEX pathways, and practical steps to launch your career. Based on current SRA regulations [1], Law Society guidance [2], and CILEX pathways [5]
          </p>
        </div>
      </section>

      <div className="page-container">
        <div className="mx-auto max-w-4xl">
          <CrawlContent slug="CriminalLawCareerGuide" />

          <section className="mt-10 rounded-[var(--radius-lg)] bg-[var(--navy)] p-8 text-center">
            <h2 className="text-xl font-bold text-white">Need Help?</h2>
            <p className="mt-3 text-slate-300">
              Find an accredited police station representative or get in touch.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link href="/directory" className="btn-gold no-underline">Find a Rep</Link>
              <Link href="/Contact" className="btn-outline !border-slate-500 !text-white hover:!border-[var(--gold)] hover:!text-[var(--gold)] no-underline">Contact Us</Link>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
