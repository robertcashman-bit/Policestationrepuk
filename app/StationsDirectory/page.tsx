import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAllReps, getAllStations } from '@/lib/data';
import { countRepsForStation } from '@/lib/station-indexing';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { JsonLd } from '@/components/JsonLd';
import { StationsDataContributeCta } from '@/components/StationsDataContributeCta';
import { StationsDirectoryExplorer } from '@/components/StationsDirectoryExplorer';
import {
  buildMetadata,
  breadcrumbSchema,
  faqPageSchema,
  stationDirectoryItemListSchema,
} from '@/lib/seo';
import { STATIONS_DIRECTORY_FAQS } from '@/lib/stations-seo';
import { buildStationPhonePublicStats } from '@/lib/station-phone-stats-server';
import { StationContactDisclaimer } from '@/components/StationPhone';
import { GuideFaqs } from '@/components/StructuredGuideLayout';
import { buildFindStationSearchUrl } from '@/lib/station-directory-links';

export const metadata = buildMetadata({
  title: 'UK Police Station Phone Numbers & Addresses Directory',
  description:
    'Browse UK police stations by force or county. Open a station page for custody desk and main telephone numbers.',
  path: '/StationsDirectory',
  keywords: [
    'police station phone numbers UK',
    'custody suite telephone number',
    'police station address directory',
    'police force station contacts',
  ],
});

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams?: Promise<{ [key: string]: string | undefined }>;
}

export default async function StationsDirectoryPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const searchQuery = params.q?.trim() ?? '';

  // Text search lives on /find-station — one station page at a time.
  if (searchQuery) {
    redirect(buildFindStationSearchUrl(searchQuery));
  }

  const [stations, reps] = await Promise.all([getAllStations(), getAllReps()]);
  const repCountBySlug = Object.fromEntries(
    stations.map((s) => [s.slug, countRepsForStation(s, reps, stations)]),
  );
  const stationListSample = stations.map((s) => ({ name: s.name, slug: s.slug }));
  const stats = buildStationPhonePublicStats(stations);

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Police Station Directory', url: '/StationsDirectory' },
        ])}
      />
      <JsonLd data={faqPageSchema([...STATIONS_DIRECTORY_FAQS])} />
      <JsonLd data={stationDirectoryItemListSchema(stationListSample, stations.length)} />

      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Station Directory', href: '/StationsDirectory' },
            ]}
          />
          <div className="mb-3 mt-3 inline-flex items-center gap-2 rounded-full border border-white bg-[var(--navy-light)] px-3 py-1 text-xs font-medium text-white">
            <span>✓</span> Help us to help you — community-maintained contacts
          </div>
          <h1 className="text-h1 text-white">Browse UK police stations</h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-white">
            A–Z and force browse. Open a station to see Call &amp; Copy phone numbers.
            {stations.length > 0 ? ` ${stations.length} stations listed.` : ''}
          </p>
          <p className="mt-4">
            <Link
              href="/find-station"
              className="inline-flex min-h-[48px] items-center rounded-xl bg-[var(--gold)] px-6 text-sm font-extrabold text-[var(--navy)] no-underline hover:bg-[var(--gold-hover)]"
            >
              Search for a station →
            </Link>
          </p>
          {stats.total > 0 ? (
            <p className="mt-3 text-xs text-slate-300">
              {stats.directLine} direct lines
              {stats.verifiedCustodyCount > 0
                ? ` · ${stats.verifiedCustodyCount} verified custody suites`
                : ''}
              {stats.needsHelp > 0 ? ` · ${stats.needsHelp} need your help` : ''}
            </p>
          ) : null}
        </div>
      </section>

      <div className="page-container">
        <StationsDataContributeCta variant="slim" className="mb-6" />
        <StationsDirectoryExplorer
          stations={stations}
          repCountBySlug={repCountBySlug}
          initialForce={params.force ?? ''}
          initialCounty={params.county ?? ''}
        />

        <StationsDataContributeCta variant="prominent" className="mt-10" />

        <div className="mt-10 rounded-xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="text-lg font-bold text-[var(--navy)]">Help us keep telephone numbers accurate</h2>
          <p className="mt-1.5 text-sm text-[var(--muted)]">
            Reps and firms rely on correct custody desk and main line numbers. Submit the number you use
            today — we review every correction before it goes live.
          </p>
          <Link
            href="/UpdateStation"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--gold-link)] no-underline hover:text-[var(--gold)] hover:underline"
          >
            Report an updated phone number or address &rarr;
          </Link>
        </div>

        <div className="mt-10 rounded-xl border border-slate-200 bg-slate-50 p-5">
          <StationContactDisclaimer />
        </div>

        <div className="mt-14 border-t border-[var(--border)] pt-10">
          <h2 className="text-h2 text-[var(--navy)]">Frequently asked questions</h2>
          <GuideFaqs faqs={STATIONS_DIRECTORY_FAQS.map((f) => ({ q: f.q, a: f.a }))} />
        </div>

        <div className="mt-14 border-t border-[var(--border)] pt-10">
          <h2 className="text-h2 text-[var(--navy)]">Find a Representative</h2>
          <p className="mt-2 text-[var(--muted)]">
            Search our directory of accredited police station representatives covering these stations.
          </p>
          <div className="mt-4 flex gap-3">
            <Link href="/directory" className="btn-gold">
              Search Directory
            </Link>
            <Link href="/directory/counties" className="btn-outline">
              Browse by County
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
