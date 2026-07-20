import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAllStations } from '@/lib/data';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { JsonLd } from '@/components/JsonLd';
import { FindStationSearch } from '@/components/stations/FindStationSearch';
import { StationSearchPickList } from '@/components/stations/StationSearchPickList';
import { buildMetadata, breadcrumbSchema } from '@/lib/seo';
import { findClearStationMatch, searchStations } from '@/lib/station-search';

export const metadata = buildMetadata({
  title: 'Find a Police Station Phone Number — UK',
  description:
    'Search for a UK police station by name, town, postcode or phone number. Opens one station page with custody desk and main contact numbers.',
  path: '/find-station',
  keywords: [
    'find police station phone number',
    'custody desk telephone UK',
    'police station search',
  ],
});

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams?: Promise<{ [key: string]: string | undefined }>;
}

const PICK_LIST_CAP = 40;

export default async function FindStationPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const query = params.q?.trim() ?? '';
  const stations = await getAllStations();

  let results = query ? searchStations(query, stations) : [];
  // searchStations with empty query returns all stations scored 0 — never use that as results.
  if (!query) results = [];

  if (query) {
    const clear = findClearStationMatch(results);
    if (clear) {
      redirect(`/police-station/${clear.slug}`);
    }
  }

  const pickList = results.slice(0, PICK_LIST_CAP);

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Find a station', url: '/find-station' },
        ])}
      />

      <section className="relative overflow-hidden bg-gradient-to-br from-[var(--navy)] via-[#1e3a5f] to-[#0f2744] py-10 sm:py-14">
        <div
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              'radial-gradient(circle at 15% 30%, var(--gold) 0, transparent 45%), radial-gradient(circle at 85% 15%, #34d399 0, transparent 40%)',
          }}
          aria-hidden
        />
        <div className="page-container relative !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Find a station' },
            ]}
          />
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Find a police station
          </h1>
          <p className="mt-3 max-w-2xl text-base text-[var(--gold-light)] sm:text-lg">
            Search by name, town, postcode or phone — then open <strong className="text-white">one</strong>{' '}
            station page for Call &amp; Copy numbers.
          </p>
          <div className="mt-8 max-w-2xl rounded-3xl border-2 border-[var(--gold)] bg-[var(--gold-pale)] p-4 shadow-xl sm:p-6">
            <FindStationSearch initialQuery={query} variant="hero" />
          </div>
          {!query ? (
            <p className="mt-4 text-sm text-white/75">
              Try{' '}
              <Link href="/find-station?q=Maidstone" className="font-semibold text-[var(--gold)] underline">
                Maidstone
              </Link>
              ,{' '}
              <Link href="/find-station?q=ME15%206NF" className="font-semibold text-[var(--gold)] underline">
                ME15 6NF
              </Link>
              , or a phone number.
            </p>
          ) : null}
        </div>
      </section>

      <div className="page-container">
        <div className="mx-auto max-w-3xl py-8 sm:py-10">
          {query && pickList.length > 0 ? (
            <StationSearchPickList stations={pickList} query={query} />
          ) : null}

          {query && pickList.length === 0 ? (
            <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-6 text-center">
              <p className="font-semibold text-amber-950">No stations matched “{query}”.</p>
              <p className="mt-2 text-sm text-amber-900/80">
                Try a town name, postcode, or browse the full list.
              </p>
              <Link href="/StationsDirectory" className="btn-gold mt-4 inline-flex !text-sm">
                Browse all stations
              </Link>
            </div>
          ) : null}

          {!query ? (
            <div className="rounded-2xl border border-[var(--card-border)] bg-white p-6 text-center shadow-[var(--card-shadow)]">
              <p className="text-[var(--muted)]">
                Enter a search above. Numbers are shown on each station’s own page — not in a list of many
                stations.
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
                <Link href="/StationsDirectory" className="btn-outline !text-sm">
                  Browse A–Z
                </Link>
                <Link href="/Forces" className="btn-outline !text-sm">
                  Browse by force
                </Link>
              </div>
            </div>
          ) : null}

          {query && pickList.length > 0 ? (
            <p className="mt-6 text-center text-sm text-[var(--muted)]">
              <Link href="/StationsDirectory" className="font-semibold text-[var(--gold-link)] hover:underline">
                Browse all stations A–Z
              </Link>
              {' · '}
              <Link href="/UpdateStation" className="font-semibold text-[var(--gold-link)] hover:underline">
                Report a number
              </Link>
            </p>
          ) : null}
        </div>
      </div>
    </>
  );
}
