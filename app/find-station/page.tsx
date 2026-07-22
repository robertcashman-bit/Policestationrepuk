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

const QUICK_SEARCHES = [
  { label: 'Maidstone', q: 'Maidstone' },
  { label: 'London', q: 'London' },
  { label: 'Manchester', q: 'Manchester' },
  { label: 'Birmingham', q: 'Birmingham' },
  { label: 'Leeds', q: 'Leeds' },
  { label: 'ME15 6NF', q: 'ME15 6NF' },
] as const;

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
  const stationCount = stations.length;

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Find a station', url: '/find-station' },
        ])}
      />

      <section className="overflow-x-clip bg-[var(--navy)] px-0 py-7 sm:py-12">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Find a station' },
            ]}
          />

          <div className="mx-auto mt-5 max-w-3xl text-center sm:mt-8">
            <p className="px-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--gold)] sm:text-xs sm:tracking-[0.14em]">
              England &amp; Wales · {stationCount.toLocaleString('en-GB')} stations
            </p>
            <h1 className="mt-2 text-[1.65rem] font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
              Find a police station number
            </h1>
            <p className="mx-auto mt-3 max-w-xl px-1 text-sm leading-relaxed text-white/75 sm:text-base">
              Search once, open one station page, then Call or Copy the custody desk or main line.
            </p>
          </div>

          <div className="mx-auto mt-6 w-full max-w-2xl sm:mt-10">
            <FindStationSearch initialQuery={query} variant="hero" />
          </div>

          {!query ? (
            <div className="mx-auto mt-5 max-w-2xl">
              <p className="mb-2 text-center text-xs text-white/55">Popular searches</p>
              <div className="-mx-3 flex gap-2 overflow-x-auto overscroll-x-contain px-3 pb-1 touch-pan-x [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0 sm:pb-0">
                {QUICK_SEARCHES.map((item) => (
                  <Link
                    key={item.q}
                    href={`/find-station?q=${encodeURIComponent(item.q)}`}
                    className="inline-flex min-h-[40px] shrink-0 items-center rounded-full border border-white/20 bg-white/5 px-3.5 py-2 text-xs font-semibold text-white no-underline transition-colors hover:border-[var(--gold)]/50 hover:bg-white/10"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <p className="mx-auto mt-4 max-w-2xl px-1 text-center text-sm text-white/70">
              Showing matches for{' '}
              <span className="break-words font-semibold text-white">“{query}”</span>
              <span className="mx-1.5 text-white/40" aria-hidden>
                ·
              </span>
              <Link
                href="/find-station"
                className="inline-block font-semibold text-[var(--gold)] underline-offset-2 hover:underline"
              >
                Clear
              </Link>
            </p>
          )}
        </div>
      </section>

      <div className="overflow-x-clip border-b border-[var(--border)] bg-slate-50">
        <div className="page-container !py-6 sm:!py-10">
          <div className="mx-auto w-full max-w-3xl">
            {query && pickList.length > 0 ? (
              <StationSearchPickList stations={pickList} query={query} />
            ) : null}

            {query && pickList.length === 0 ? (
              <div className="rounded-2xl border border-amber-200/80 bg-white p-5 text-center shadow-sm sm:p-8">
                <div
                  className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-800"
                  aria-hidden
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="7" />
                    <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
                  </svg>
                </div>
                <h2 className="mt-4 text-lg font-bold text-[var(--navy)]">
                  No stations matched “{query}”
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted)]">
                  Try a shorter town name, a postcode district (e.g. ME15), or browse the full directory.
                </p>
                <div className="mt-6 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
                  <Link href="/StationsDirectory" className="btn-gold w-full !text-sm sm:w-auto">
                    Browse all stations
                  </Link>
                  <Link href="/find-station" className="btn-outline w-full !text-sm sm:w-auto">
                    Try another search
                  </Link>
                </div>
              </div>
            ) : null}

            {!query ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                <Link
                  href="/StationsDirectory"
                  className="group rounded-2xl border border-[var(--card-border)] bg-white p-4 no-underline shadow-sm transition-shadow hover:shadow-md sm:p-5"
                >
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--gold-link)]">
                    Browse
                  </p>
                  <p className="mt-2 text-base font-bold text-[var(--navy)] group-hover:text-[var(--gold-link)]">
                    All stations A–Z
                  </p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    Full list with filters — then open one page for numbers.
                  </p>
                </Link>
                <Link
                  href="/Forces"
                  className="group rounded-2xl border border-[var(--card-border)] bg-white p-4 no-underline shadow-sm transition-shadow hover:shadow-md sm:p-5"
                >
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--gold-link)]">
                    By force
                  </p>
                  <p className="mt-2 text-base font-bold text-[var(--navy)] group-hover:text-[var(--gold-link)]">
                    Police forces
                  </p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    Pick a force area, then drill into custody suites.
                  </p>
                </Link>
                <Link
                  href="/UpdateStation"
                  className="group rounded-2xl border border-[var(--card-border)] bg-white p-4 no-underline shadow-sm transition-shadow hover:shadow-md sm:col-span-2 sm:p-5 lg:col-span-1"
                >
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--gold-link)]">
                    Contribute
                  </p>
                  <p className="mt-2 text-base font-bold text-[var(--navy)] group-hover:text-[var(--gold-link)]">
                    Report a number
                  </p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    Help keep custody desk lines accurate for everyone.
                  </p>
                </Link>
              </div>
            ) : null}

            {query && pickList.length > 0 ? (
              <p className="mt-8 text-center text-sm text-[var(--muted)]">
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
      </div>
    </>
  );
}
