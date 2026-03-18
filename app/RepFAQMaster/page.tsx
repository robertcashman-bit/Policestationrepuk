import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Police Station Representative FAQ | PoliceStationRepUK',
  description: 'Comprehensive answers to the most common questions about becoming and working as an accredited police station representative.',
  path: '/RepFAQMaster',
});

export default function RepFAQMasterPage() {
  return (
    <>
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Police Station Representative FAQ' },
            ]}
          />
          <h1 className="mt-3 text-h1 text-white">Police Station Representative FAQs</h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-slate-300">Comprehensive answers to the most common questions about becoming and working as an accredited police station representative.</p>
        </div>
      </section>

      <div className="page-container">
        <div className="mx-auto max-w-4xl space-y-10">

          <section>
            <h2 className="text-h2 text-[var(--navy)]">The Basics</h2>
            <p className="text-[var(--muted)] leading-relaxed">4 questions</p>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--navy)]">Becoming a Rep</h2>
            <p className="text-[var(--muted)] leading-relaxed">4 questions</p>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--navy)]">Working as a Rep</h2>
            <p className="text-[var(--muted)] leading-relaxed">4 questions</p>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--navy)]">At the Police Station</h2>
            <p className="text-[var(--muted)] leading-relaxed">4 questionsThe BasicsWhat is a police station representative?What is the difference between a rep and a duty solicitor?Can a police station rep go to court?Is advice from a police station rep free?Becoming a RepHow do I become a police station representative?What qualifications do I need?How much does accreditation cost?How long does accreditation take?Working as a RepHow much do police station representatives earn?Do I need a DSCC PIN number?Can I work for multiple firms?What hours do police station reps work?At the Police StationWhat happens when I arrive at the station?What is disclosure?Can I intervene during interview?What if my client wants to make no comment?How to Become a RepFind a RepresentativeWritten by Robert Cashman, Duty Solicitor.</p>
            <p className="text-[var(--muted)] leading-relaxed">Last updated: March 2026.</p>
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
