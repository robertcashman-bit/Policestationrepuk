import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Regional Demand Heatmap — Police Station Rep Coverage',
  description: 'Visual heatmap of police station representative demand across England and Wales. See which regions have the most solicitor cover requests and where rep capacity is needed most.',
  path: '/RegionalDemandHeatmap',
  noIndex: true,
});

export default function RegionalDemandHeatmapPage() {
  return (
    <>
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Regional Demand Heatmap' },
            ]}
          />
          <h1 className="mt-3 text-h1 text-white">Regional Demand Heatmap</h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-slate-300">
            A live visual map of police station representative demand across England and Wales.
          </p>
        </div>
      </section>

      <div className="page-container">
        <div className="mx-auto max-w-4xl space-y-10">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-8 text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
              COMING SOON
            </div>
            <h2 className="text-xl font-bold text-[var(--navy)]">We are building a live demand heatmap</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[var(--muted)]">
              This page will show a real-time interactive map highlighting which regions have the
              highest demand for police station representatives, where capacity gaps exist, and
              where cover is most needed. Check back soon.
            </p>
          </div>

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
