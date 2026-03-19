import Link from 'next/link';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getAllReps, getAllCounties, getAllStations } from '@/lib/data';
import { DirectorySearch } from '@/components/DirectorySearch';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { SITE_URL } from '@/lib/seo-layer/config';

export const metadata: Metadata = {
  title: 'Search police station representatives',
  description:
    'Search the free directory of accredited police station representatives by county, station, name, availability or accreditation.',
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
      <section className="border-b border-[var(--border)] bg-white py-6">
        <div className="page-container !py-0">
          <h1 className="text-xl font-bold text-[var(--navy)] sm:text-2xl">Search representatives</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Filter live directory listings by county, custody suite, accreditation, availability, or free-text
            search. All results are loaded from the Scraped rep pipeline (with reps.json fallback).
          </p>
          <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Search directory' }]} />
        </div>
      </section>

      <section className="bg-gradient-to-b from-[#1e40af] via-[#1e3a8a] to-[#312e81] py-8 sm:py-10">
        <div className="page-container !py-0">
          <p className="text-sm text-slate-300">
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
