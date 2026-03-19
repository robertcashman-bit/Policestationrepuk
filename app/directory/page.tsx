import Link from 'next/link';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getAllReps, getAllCounties, getAllStations } from '@/lib/data';
import { DirectorySearch } from '@/components/DirectorySearch';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { SITE_URL } from '@/lib/seo-layer/config';

export const metadata: Metadata = {
  title: 'Free Rep Directory | Find Police Station Representatives UK — No Fees Ever',
  description:
    '100% free directory of accredited police station representatives for outsourced cover. Search by station, county, or availability. No subscription, no listing fees — completely free for criminal defence firms and solicitors.',
  alternates: { canonical: `${SITE_URL}/directory` },
};

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
      {/* SEO header block */}
      <section className="border-b border-[var(--border)] bg-white py-6">
        <div className="page-container !py-0">
          <h1 className="text-xl font-bold text-[var(--navy)] sm:text-2xl">
            Free Rep Directory | Find Police Station Representatives UK — No Fees Ever
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            100% free directory of accredited police station representatives for outsourced cover.
            Search by station, county, or availability. No subscription, no listing fees — completely
            free for criminal defence firms and solicitors.
          </p>
          <Breadcrumbs
            items={[{ label: 'Home', href: '/' }, { label: 'Police Station Rep Directory' }]}
          />
        </div>
      </section>

      {/* Hero banner */}
      <section className="bg-gradient-to-b from-[#1e40af] via-[#1e3a8a] to-[#312e81] py-10 sm:py-14">
        <div className="page-container !py-0">
          <h1 className="text-h1 text-white">
            Police Station Representatives Directory
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-slate-300">
            Find accredited police station representatives across England &amp; Wales
          </p>

          {/* Sub-navigation */}
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/search" className="btn-outline !border-white/20 !text-white !text-sm hover:!border-white hover:!bg-white/10">
              🔍 Search
            </Link>
            <Link href="/Map" className="btn-outline !border-white/20 !text-white !text-sm hover:!border-white hover:!bg-white/10">
              📍 Map View
            </Link>
            <Link href="/Forces" className="btn-outline !border-white/20 !text-white !text-sm hover:!border-white hover:!bg-white/10">
              📋 Browse by Force
            </Link>
            <Link href="/StationsDirectory" className="btn-outline !border-white/20 !text-white !text-sm hover:!border-white hover:!bg-white/10">
              📊 Stations Directory
            </Link>
          </div>
        </div>
      </section>

      {/* Accreditation notice */}
      <section className="border-b border-amber-200 bg-amber-50 py-4">
        <div className="page-container !py-0">
          <h5 className="text-sm font-bold text-amber-800">
            Important: Full Accreditation Required
          </h5>
          <p className="mt-1 text-xs leading-relaxed text-amber-700">
            You must be a fully accredited police station representative (or Duty Solicitor)
            to be listed in this directory. Probationary representatives are not eligible to
            work as freelance agents. Under the Standard Crime Contract Specification and
            LAA Police Station Register Arrangements, a Probationary Representative must be
            supervised and cannot attend police stations independently.
          </p>
          <p className="mt-2">
            <Link href="/AccreditedRepresentativeGuide" className="text-xs font-semibold text-amber-800 no-underline hover:text-amber-600">
              Standard Crime Contract Specification →
            </Link>
          </p>
        </div>
      </section>

      <div className="page-container">
        {/* CustodyNote banner */}
        <div className="mb-6 rounded-xl border border-[var(--card-border)] bg-gradient-to-r from-slate-900 to-slate-800 p-4 text-center">
          <Link href="https://custodynote.com" target="_blank" rel="noopener noreferrer" className="no-underline">
            <p className="text-sm font-bold text-white">
              Custody Note — The app for freelance reps
            </p>
            <p className="mt-1 text-xs text-slate-400">
              30-day free trial · From £15.99/mo · Use code A2MJY2NQ for 25% off
            </p>
          </Link>
        </div>

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

        <p className="mt-6 text-xs text-[var(--muted)]">
          Listings are based on information provided at registration. Availability and station
          coverage may change. If you spot an inaccuracy, please report it and we will review it promptly.
        </p>
      </div>
    </>
  );
}
