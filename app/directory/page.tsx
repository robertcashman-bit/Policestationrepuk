import Link from 'next/link';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getAllReps, getAllCounties, getAllStations, stripPrivateFieldsAll } from '@/lib/data';
import { DirectorySearch } from '@/components/DirectorySearch';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { DirectoryComplianceNotice } from '@/components/DirectoryComplianceNotice';
import { SisterToolsSlimBar } from '@/components/SisterToolsSlimBar';
import { SITE_NAME, SITE_URL, socialPreviewImageUrl } from '@/lib/seo-layer/config';
import { JsonLd } from '@/components/JsonLd';
import { breadcrumbSchema, directoryItemListSchema } from '@/lib/seo';
import { ResultsGridSkeleton } from '@/components/directory/ResultsGrid';
import { JoinCTA } from '@/components/directory/JoinCTA';
import { FeaturedListingAdvert } from '@/components/FeaturedListingAdvert';
import { DIRECTORY_LISTING_TRUST_SENTENCE } from '@/lib/directory-trust-copy';
import { repMatchesAnyCounty } from '@/lib/county-matching';

const directoryTitle = 'Police Station Rep Directory — County & Station';
const directoryDescription =
  'Accredited police station reps across England and Wales. Search by county, force, station, postcode, and availability. Free for firms and reps.';

export const metadata: Metadata = {
  title: directoryTitle,
  description: directoryDescription,
  alternates: { canonical: `${SITE_URL}/directory` },
  openGraph: {
    title: directoryTitle,
    description: directoryDescription,
    url: `${SITE_URL}/directory`,
    type: 'website',
    siteName: SITE_NAME,
    locale: 'en_GB',
    images: [
      {
        url: socialPreviewImageUrl(),
        width: 1200,
        height: 630,
        alt: 'Search the UK police station representative directory',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: directoryTitle,
    description: directoryDescription,
    images: [socialPreviewImageUrl()],
  },
};

export const dynamic = 'force-dynamic';

export default async function DirectoryPage() {
  const [repsRaw, counties, stations] = await Promise.all([
    getAllReps(),
    getAllCounties(),
    getAllStations(),
  ]);

  const reps = stripPrivateFieldsAll(repsRaw);

  const countyCards = counties
    .map((c) => ({
      ...c,
      listedRepCount: reps.filter((r) => repMatchesAnyCounty(r, c.name)).length,
    }))
    .filter((c) => c.listedRepCount > 0)
    .sort((a, b) => b.listedRepCount - a.listedRepCount)
    .slice(0, 8);

  const bc = breadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Directory', url: '/directory' },
  ]);
  const itemList = directoryItemListSchema(reps.map((r) => ({ name: r.name, slug: r.slug })));

  return (
    <>
      <JsonLd data={bc} />
      <JsonLd data={itemList} />

      <section className="relative overflow-hidden bg-[var(--navy)]">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--navy)] via-[#0f1d45] to-[#0a1633]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 pb-6 pt-6 sm:px-6 sm:pb-8 sm:pt-8 lg:px-8">
          <Breadcrumbs
            light
            className="!mb-0"
            items={[{ label: 'Home', href: '/' }, { label: 'Directory' }]}
          />
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0 max-w-2xl">
              <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl lg:text-4xl">
                Police station rep directory
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-300 sm:text-base">
                Search accredited representatives by name, county, force, or station. Contact details
                are on each profile — instruct the rep directly.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
              <span className="rounded-lg bg-white/10 px-3 py-1.5 font-semibold text-white">
                <span className="font-extrabold text-[var(--gold)]">{reps.length}</span> reps
              </span>
              <span className="rounded-lg bg-white/10 px-3 py-1.5 font-semibold text-white">
                <span className="font-extrabold text-[var(--gold)]">{counties.length}</span> counties
              </span>
              <span className="rounded-lg bg-white/10 px-3 py-1.5 font-semibold text-white">
                <span className="font-extrabold text-[var(--gold)]">{stations.length}</span> stations
              </span>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/Map"
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white no-underline hover:bg-white/20 sm:text-sm"
            >
              Map
            </Link>
            <Link
              href="/Forces"
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white no-underline hover:bg-white/20 sm:text-sm"
            >
              By force
            </Link>
            <Link
              href="/StationsDirectory"
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white no-underline hover:bg-white/20 sm:text-sm"
            >
              Stations
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--gold)]/40 bg-[var(--gold)]/15 px-3 py-1.5 text-xs font-semibold text-[var(--gold)] no-underline hover:bg-[var(--gold)]/25 sm:text-sm"
            >
              Join free
            </Link>
          </div>
        </div>
      </section>

      <SisterToolsSlimBar />

      <section className="border-b border-yellow-200 bg-yellow-50 py-2.5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs leading-relaxed text-yellow-800">
            <strong className="font-bold">Accredited listings only.</strong> Profiles are reviewed
            before publication. {DIRECTORY_LISTING_TRUST_SENTENCE}{' '}
            <Link
              href="/AccreditedRepresentativeGuide"
              className="font-semibold text-yellow-900 no-underline hover:underline"
            >
              Requirements →
            </Link>
          </p>
        </div>
      </section>

      {countyCards.length > 0 && (
        <section
          className="border-b border-[var(--border)] bg-white py-5"
          aria-label="Browse by county"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-sm font-bold text-[var(--navy)]">Browse by area</h2>
              <Link
                href="/directory/counties"
                className="text-xs font-semibold text-[var(--gold-link)] no-underline hover:underline"
              >
                All counties →
              </Link>
            </div>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
              {countyCards.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/directory/${c.slug}`}
                    className="flex flex-col rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 no-underline transition-colors hover:border-[var(--gold)]/50 hover:bg-white"
                  >
                    <span className="truncate text-xs font-bold text-[var(--navy)]">{c.name}</span>
                    <span className="mt-0.5 text-[10px] text-[var(--muted)]">
                      {c.listedRepCount} listed
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <DirectoryComplianceNotice className="mb-5" />

        <Suspense fallback={<ResultsGridSkeleton />}>
          <DirectorySearch reps={reps} counties={counties} stations={stations} />
        </Suspense>

        <div className="mt-8 space-y-4">
          <JoinCTA variant="inline" totalReps={reps.length} />
          <FeaturedListingAdvert />
        </div>

        <p className="mt-8 text-xs text-[var(--muted)]">
          Listings are based on information provided at registration. Availability and station
          coverage may change. {DIRECTORY_LISTING_TRUST_SENTENCE} Firms must satisfy their own
          compliance checks before instructing. If you spot an inaccuracy, please report it and we
          will review it promptly.
        </p>
      </div>
    </>
  );
}
