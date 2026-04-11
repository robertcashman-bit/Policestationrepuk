import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Advertisers | PoliceStationRepUK',
  description:
    'Promote legal tech, training, and professional services to criminal defence professionals. Banner placements, sponsored content, and partnership options.',
  path: '/Advertisers',
});

export default function AdvertisersPage() {
  return (
    <>
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Advertisers' },
            ]}
          />
          <h1 className="mt-3 text-h1 text-white">Partner advertising</h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-slate-200">
            Reach an engaged audience of criminal defence solicitors, duty solicitors, and accredited police station
            representatives across England and Wales.
          </p>
          <ul className="mt-6 flex flex-wrap gap-3 text-sm text-slate-300">
            <li className="rounded-full border border-white/20 px-3 py-1">Nationwide coverage</li>
            <li className="rounded-full border border-white/20 px-3 py-1">Legal sector focus</li>
            <li className="rounded-full border border-white/20 px-3 py-1">Analytics available</li>
          </ul>
        </div>
      </section>

      <div className="page-container">
        <div className="mx-auto max-w-4xl space-y-10 pb-12 pt-8">
          <section className="space-y-6">
            <h2 className="text-h2 text-[var(--navy)]">Advertising options</h2>
            <p className="text-[var(--muted)] leading-relaxed">
              Formats can be combined. Exact placements and rates are confirmed when you request a media kit.
            </p>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="font-bold text-[var(--navy)]">Banner &amp; display</h3>
                <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
                  Premium positions on high-traffic pages such as the homepage, directory, and resources. Responsive
                  layouts; monthly performance summaries available.
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="font-bold text-[var(--navy)]">Sponsored content</h3>
                <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
                  Articles, case studies, and thought leadership aligned with our editorial standards. Blog integration,
                  newsletter mentions, and social amplification where agreed.
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-[var(--navy)]">Who advertises with us</h3>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-[var(--muted)] leading-relaxed marker:text-[var(--gold)]">
                <li>Legal technology — case management, billing, practice tools</li>
                <li>Training providers — CPD, accreditation pathways, professional development</li>
                <li>Professional services — experts, translators, forensics</li>
                <li>Publishers — law books, journals, research</li>
              </ul>
            </div>

            <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-[var(--muted)]">
              Ready to reach your audience?{' '}
              <Link href="/Contact" className="font-semibold text-[var(--navy)] underline decoration-[var(--gold)] underline-offset-2">
                Contact us
              </Link>{' '}
              for a media kit, audience analytics, and custom pricing.
            </p>
          </section>

          <section className="rounded-[var(--radius-lg)] bg-[var(--navy)] p-8 text-center">
            <h2 className="text-xl font-bold text-white">Need help?</h2>
            <p className="mt-2 text-slate-300">
              Find an accredited police station representative or get in touch with our team.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Link href="/directory" className="btn-gold no-underline">
                Find a rep
              </Link>
              <Link href="/Contact" className="btn-outline no-underline">
                Contact us
              </Link>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
