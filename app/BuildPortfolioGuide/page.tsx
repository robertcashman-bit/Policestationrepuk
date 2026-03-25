import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { CrawlContent } from '@/components/CrawlContent';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Build Your PSRAS Portfolio — Step-by-Step Rep Guide',
  description: 'Step-by-step guide to completing your PSRAS accreditation portfolio and preparing for the Critical Incidents Test. Evidence requirements, supervisor sign-off, and tips from experienced reps.',
  path: '/BuildPortfolioGuide',
});

export default function BuildPortfolioGuidePage() {
  return (
    <>
      <section className="bg-[var(--navy)] py-12 sm:py-16">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Buildportfolioguide' },
            ]}
          />
          <h1 className="mt-4 text-h1 text-white">How to Build Your Accreditation Portfolio</h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-300">
            A step-by-step guide to completing your PSRAS portfolio and preparing for the Critical Incidents Test.
          </p>
        </div>
      </section>

      <div className="page-container">
        <div className="mx-auto max-w-4xl">
          <CrawlContent slug="BuildPortfolioGuide" />

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
