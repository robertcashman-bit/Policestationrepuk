import Link from 'next/link';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getAllReps, getAllCounties, getAllStations } from '@/lib/data';
import { DirectorySearch } from '@/components/DirectorySearch';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { SITE_URL } from '@/lib/seo-layer/config';

export const metadata: Metadata = {
  title: 'Search Police Station Representatives | PoliceStationRepUK',
  description:
    'Advanced search: filter the same live PoliceStationRepUK listings by county, custody suite, accreditation, availability, and free-text query. Use this page when you need extra filters; use Find a Rep for quick browsing.',
  alternates: { canonical: `${SITE_URL}/search` },
};

interface PageProps {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function SearchPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const [reps, counties, stations] = await Promise.all([
    getAllReps(),
    getAllCounties(),
    getAllStations(),
  ]);

  return (
    <>
      <section className="section-pad-compact border-b border-[var(--border)] bg-white">
        <div className="page-container !py-0">
          <h1 className="text-h1 mt-0 max-w-5xl text-[var(--navy)]">Search representatives</h1>
          <p className="mt-3 max-w-4xl text-base leading-relaxed text-[var(--muted)] sm:text-[1.0625rem]">
            Filter live directory listings by county, custody suite, accreditation, availability, or free-text
            search — same network as Find Reps, with extra filters for firms and solicitors.
          </p>
          <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Search directory' }]} />
        </div>
      </section>

      <section className="hero-band hero-gradient-source">
        <div className="page-container !py-0">
          <p className="text-sm text-white">
            <Link href="/directory" className="font-semibold text-white no-underline hover:underline">
              Full directory hub →
            </Link>
          </p>
        </div>
      </section>

      <div className="page-container">
        <Suspense fallback={<p className="text-[var(--muted)]">Loading search…</p>}>
          <DirectorySearch
            reps={reps}
            counties={counties}
            stations={stations}
            urlBase="/search"
            defaultCounty={params.county ?? ''}
            defaultStation={params.station ?? ''}
            defaultAvailability={params.availability ?? ''}
            defaultAccreditation={params.accreditation ?? ''}
            defaultQuery={params.q ?? ''}
          />
        </Suspense>
      </div>
    </>
  );
}
