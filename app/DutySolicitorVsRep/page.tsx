import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { CrawlContent } from '@/components/CrawlContent';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Rota Duty Scheme vs Freelance Police Station Rep | Comparison',
  description: 'Compare the rota duty scheme with freelance accredited police station representatives — qualifications, roles, custody attendance, and how firms use rep cover alongside rota arrangements.',
  path: '/DutySolicitorVsRep',
});

export default function DutySolicitorVsRepPage() {
  return (
    <>
      <section className="bg-[var(--navy)] py-12 sm:py-16">
        <div className="page-container !py-0">
          <Breadcrumbs light items={[{ label: 'Home', href: '/' }, { label: 'Duty Solicitor vs Rep' }]} />
          <h1 className="mt-4 text-h1 text-white">Duty Solicitor vs Police Station Representative</h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-white">Understanding the key differences between duty solicitors and accredited representatives - qualifications, roles, and how they work together in criminal de</p>
        </div>
      </section>
      <div className="page-container">
        <div className="mx-auto max-w-4xl">
          <CrawlContent slug="DutySolicitorVsRep" />
          <section className="mt-10 rounded-[var(--radius-lg)] bg-[var(--navy)] p-8 text-center">
            <h2 className="text-xl font-bold text-white">Need Help?</h2>
            <p className="mt-3 text-white">Find an accredited police station representative or get in touch.</p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link href="/directory" className="btn-gold no-underline">Find a Rep</Link>
              <Link href="/Contact" className="btn-outline !border-slate-500 !text-white hover:!border-[var(--gold)] hover:!text-[var(--gold)] no-underline">Contact Us</Link>
            </div>
            <p className="mt-5 text-sm text-slate-300">
              Need a solicitor at the police station?{' '}
              <a href="https://www.policestationagent.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-[var(--gold)] underline">
                Visit policestationagent.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
