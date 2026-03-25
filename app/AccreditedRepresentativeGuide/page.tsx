import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { CrawlContent } from '@/components/CrawlContent';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Accredited Representative Guide | How to Get Accredited',
  description: 'Step-by-step guide to becoming an accredited police station representative in England and Wales. Covers PSRAS requirements, portfolio evidence, and how to register on the Law Society scheme.',
  path: '/AccreditedRepresentativeGuide',
});

export default function AccreditedRepresentativeGuidePage() {
  return (
    <>
      <section className="bg-[var(--navy)] py-12 sm:py-16">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'AccreditedRepresentativeGuide' },
            ]}
          />
          <h1 className="mt-4 text-h1 text-white">AccreditedRepresentativeGuide</h1>
        </div>
      </section>

      <div className="page-container">
        <div className="mx-auto max-w-4xl">
          <CrawlContent slug="AccreditedRepresentativeGuide" />

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
