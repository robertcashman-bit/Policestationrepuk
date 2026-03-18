import Link from 'next/link';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getAllReps, getAllCounties, getAllStations } from '@/lib/data';
import { DirectorySearch } from '@/components/DirectorySearch';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Police Station Representative Directory | PoliceStationRepUK',
  description:
    'Search our free directory of accredited police station representatives across England & Wales. Filter by county, station, availability, or name.',
  path: '/directory',
});

interface PageProps {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function DirectoryPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const [reps, counties, stations] = await Promise.all([
    getAllReps(),
    getAllCounties(),
    getAllStations(),
  ]);

  return (
    <>
      {/* Hero banner */}
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[{ label: 'Home', href: '/' }, { label: 'Directory' }]}
          />
          <h1 className="mt-4 text-h1 text-white">
            Find a Police Station Representative
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-slate-300">
            Search {reps.length}+ accredited representatives across {counties.length} counties
            and {stations.length}+ police stations in England &amp; Wales.
          </p>
        </div>
      </section>

      <div className="page-container">
        <Suspense fallback={<p className="text-[var(--muted)]">Loading directory...</p>}>
          <DirectorySearch
            reps={reps}
            counties={counties}
            stations={stations}
            defaultCounty={params.county ?? ''}
            defaultStation={params.station ?? ''}
            defaultAvailability={params.availability ?? ''}
            defaultAccreditation={params.accreditation ?? ''}
            defaultQuery={params.q ?? ''}
          />
        </Suspense>

        {/* County browse section */}
        <section className="mt-16">
          <h2 className="text-h2 text-[var(--navy)]">Browse by county</h2>
          <div className="mt-6 flex flex-wrap gap-2">
            {counties.map((county) => (
              <Link
                key={county.slug}
                href={`/directory/${county.slug}`}
                className="rounded-full border border-[var(--card-border)] bg-white px-4 py-2 text-sm font-medium text-[var(--navy)] no-underline shadow-sm transition-all hover:border-[var(--gold)]/40 hover:shadow-md"
              >
                {county.name}
              </Link>
            ))}
          </div>
          <p className="mt-4">
            <Link href="/directory/counties" className="text-sm font-semibold text-[var(--gold-hover)] no-underline hover:text-[var(--gold)]">
              View all counties →
            </Link>
          </p>
        </section>
      </div>
    </>
  );
}
