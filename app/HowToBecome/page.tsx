import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { CrawlContent } from '@/components/CrawlContent';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'How to Become a Police Station Representative | Complete PSRAS Guide',
  description:
    'A comprehensive, step-by-step roadmap to becoming a police station representative in England & Wales. Covers PSRAS accreditation, SRA requirements, the written exam, portfolio, and CIT.',
  path: '/HowToBecome',
});

export default function HowToBecomePage() {
  return (
    <>
      <section className="bg-[var(--navy)] py-12 sm:py-16">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'How to Become a Rep' },
            ]}
          />
          <h1 className="mt-4 text-h1 text-white">
            Complete Guide: How to Become a Police Station Representative
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-300">
            A comprehensive, step-by-step roadmap to PSRAS accreditation in England &amp; Wales.
            Based on current SRA Assessment Guidelines, LAA Police Station Register Arrangements 2025,
            and Cardiff University PSRAS requirements.
          </p>
        </div>
      </section>

      <div className="page-container">
        <div className="mx-auto max-w-4xl">
          <CrawlContent slug="HowToBecome" />

          <section className="mt-10 rounded-[var(--radius-lg)] bg-[var(--navy)] p-8 text-center">
            <h2 className="text-xl font-bold text-white">Ready to Get Started?</h2>
            <p className="mt-3 text-slate-300">
              Find an accredited police station representative or explore our training resources.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link href="/directory" className="btn-gold no-underline">
                Find a Rep
              </Link>
              <Link href="/BeginnersGuide" className="btn-outline !border-slate-500 !text-white hover:!border-[var(--gold)] hover:!text-[var(--gold)] no-underline">
                Beginner&apos;s Guide
              </Link>
              <Link href="/Contact" className="btn-outline !border-slate-500 !text-white hover:!border-[var(--gold)] hover:!text-[var(--gold)] no-underline">
                Contact Us
              </Link>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
