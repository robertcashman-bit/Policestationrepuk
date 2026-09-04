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
import { NotPoliceDeflectBanner } from '@/components/NotPoliceDeflectBanner';
import { InstructRepPrimaryCta } from '@/components/InstructRepPrimaryCta';
import { STATIONS_DIRECTORY_TITLE } from '@/lib/gsc-harness-copy';

export const metadata = buildMetadata({
  title: STATIONS_DIRECTORY_TITLE,
  description:
    'Browse UK police stations by force or county. Find accredited police station representatives covering each station. Not the police — call 101 or 999 for police contact.',
  path: '/StationsDirectory',
  keywords: [
    'police station directory UK',
    'find police station representative',
    'custody suite representatives',
    'police station cover directory',
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
            A–Z and force browse for solicitors and accredited reps. Open a station to find representatives covering that suite.
            {stations.length > 0 ? ` ${stations.length} stations listed.` : ''}
          </p>
          <div className="mt-5 max-w-2xl">
            <NotPoliceDeflectBanner variant="hero" />
          </div>
          <p className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/directory"
              className="inline-flex min-h-[48px] items-center rounded-xl bg-[var(--gold)] px-6 text-sm font-extrabold text-[var(--navy)] no-underline hover:bg-[var(--gold-hover)]"
            >
              Instruct a police station rep →
            </Link>
            <Link
              href="/find-station"
              className="inline-flex min-h-[48px] items-center rounded-xl border-2 border-white/40 bg-white/10 px-6 text-sm font-bold text-white no-underline hover:border-[var(--gold)]"
            >
              Search stations →
            </Link>
          </p>
          {stats.total > 0 ? (
            <p className="mt-3 text-xs text-slate-300">
              {stats.directLine} professional contact lines listed
              {stats.verifiedCustodyCount > 0
                ? ` · ${stats.verifiedCustodyCount} verified custody suites`
                : ''}
              {stats.needsHelp > 0 ? ` · ${stats.needsHelp} need your help` : ''}
            </p>
          ) : null}
        </div>
      </section>

      <div className="page-container">
        <div className="mb-6">
          <InstructRepPrimaryCta />
        </div>
        <div className="mb-6">
          <NotPoliceDeflectBanner variant="compact" />
        </div>
        <StationsDataContributeCta variant="slim" className="mb-6" />
        <StationsDirectoryExplorer
          stations={stations}
          repCountBySlug={repCountBySlug}
          initialForce={params.force ?? ''}
          initialCounty={params.county ?? ''}
        />

        <StationsDataContributeCta variant="prominent" className="mt-10" />

        <div className="mt-10 rounded-xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="text-lg font-bold text-[var(--navy)]">Help keep professional contacts accurate</h2>
          <p className="mt-1.5 text-sm text-[var(--muted)]">
            Reps and firms rely on correct custody desk and main line numbers. Public callers should use 101 or 999.
            Submit the number you use today — we review every correction before it goes live.
          </p>
          <Link
            href="/UpdateStation"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--gold-link)] no-underline hover:text-[var(--gold)] hover:underline"
          >
            Report an updated contact or address &rarr;
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
          <InstructRepPrimaryCta />
        </div>
      </div>
    </>
  );
}
