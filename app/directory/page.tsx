import Link from 'next/link';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getAllReps, getAllCounties, getAllStations } from '@/lib/data';
import { DirectorySearch } from '@/components/DirectorySearch';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { SITE_URL } from '@/lib/seo-layer/config';

export const metadata: Metadata = {
  title: 'Police Station Rep Directory — Search by County & Station',
  description:
    'Free directory of accredited police station representatives across England and Wales. Search by station, county, or availability. No fees for solicitors or reps — completely free.',
  alternates: { canonical: `${SITE_URL}/directory` },
};

export default async function DirectoryPage() {
  const [reps, counties, stations] = await Promise.all([
    getAllReps(),
    getAllCounties(),
    getAllStations(),
  ]);

  return (
    <>
      {/*
        Wix directory hub parity (screenshots/source/directory): white SEO block → breadcrumb band
        → gradient hero with three sub-links (Search lives in the tool below, not in the hero row).
      */}
      <section className="border-b border-[var(--border)] bg-white">
        <div className="page-container !py-8 sm:!py-9">
          <h1 className="mt-0 max-w-5xl text-h1 text-[var(--navy)]">
            Police Station Rep Directory — Find Accredited Reps
          </h1>
          <p className="mt-3 max-w-4xl text-base leading-relaxed text-[var(--muted)] sm:text-[1.0625rem]">
            Directory on PoliceStationRepUK. Free network for criminal defence firms and solicitors to
            find police station cover, post jobs and connect with accredited representatives.
          </p>
        </div>
      </section>

      <div className="border-b border-slate-200 bg-slate-100">
        <div className="page-container !py-2.5 sm:!py-3">
          <Breadcrumbs
            className="!mb-0"
            items={[{ label: 'Home', href: '/' }, { label: 'Police Station Rep Directory' }]}
          />
        </div>
      </div>

      <section className="hero-band hero-gradient-source">
        <div className="page-container !py-0">
          <h2 className="mt-0 text-h1 text-white md:mt-0">
            Police Station Representatives Directory
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-white sm:mt-4 sm:text-[1.0625rem]">
            Find accredited police station representatives across England &amp; Wales
          </p>

          {/* Sub-navigation — matches Wix (three links only) */}
          <div className="mt-5 flex flex-wrap justify-center gap-2.5 sm:mt-6 sm:justify-start sm:gap-3">
            <Link
              href="/Map"
              className="btn-outline !border-white !text-white !text-sm hover:!bg-white hover:!text-[var(--navy)]"
            >
              📍 Map View
            </Link>
            <Link
              href="/Forces"
              className="btn-outline !border-white !text-white !text-sm hover:!bg-white hover:!text-[var(--navy)]"
            >
              🛡️ Browse by Force
            </Link>
            <Link
              href="/StationsDirectory"
              className="btn-outline !border-white !text-white !text-sm hover:!bg-white hover:!text-[var(--navy)]"
            >
              📊 Stations Directory
            </Link>
          </div>
        </div>
      </section>

      {/* Accreditation notice */}
      <section className="border-b border-yellow-200 bg-yellow-50 py-4">
        <div className="page-container !py-0">
          <div className="flex gap-3">
            <span className="text-2xl leading-none text-yellow-600" aria-hidden>
              ⚠️
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold text-yellow-800">
                Important: Full Accreditation Required
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-yellow-700">
                You must be a fully accredited police station representative (or Duty Solicitor) to be
                listed in this directory. Probationary representatives are{' '}
                <strong className="font-bold text-yellow-900">not eligible</strong> to work as freelance
                agents. Under the Standard Crime Contract Specification and LAA Police Station Register
                Arrangements, a Probationary Representative must be registered under a specific
                Supervising Solicitor at a specific provider (firm).
              </p>
              <p className="mt-2">
                <Link
                  href="/AccreditedRepresentativeGuide"
                  className="text-xs font-semibold text-yellow-800 no-underline hover:text-yellow-600"
                >
                  Standard Crime Contract Specification →
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="page-container">
        {/* CustodyNote banner */}
        <div className="mb-6 rounded-[var(--radius-lg)] border border-[var(--navy-light)] bg-[var(--navy)] p-[var(--card-padding)] text-center shadow-[var(--card-shadow)]">
          <Link href="https://custodynote.com" target="_blank" rel="noopener noreferrer" className="no-underline">
            <p className="text-sm font-bold text-white">
              Custody Note — Desktop software for police station attendance notes
            </p>
            <p className="mt-1 text-xs text-white">
              30-day free trial · From £9.99/mo · Use code A2MJY2NQ for 25% off
            </p>
          </Link>
        </div>

        <Suspense fallback={<p className="text-[var(--muted)]">Loading directory...</p>}>
          <DirectorySearch
            reps={reps}
            counties={counties}
            stations={stations}
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
