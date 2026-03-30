'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { DirectoryCard } from '@/components/DirectoryCard';
import type { Representative, County, PoliceStation } from '@/lib/types';
import { repMatchesCountyName } from '@/lib/county-matching';
import {
  buildCountyCanonicalMap,
  representativeToSearchRow,
  searchDirectory,
} from '@/lib/directory-search-engine';
import {
  repMatchesPoliceForce,
  repMatchesAccreditationFilter,
  type AccreditationFilterKey,
} from '@/lib/directory-rep-filters';
import { forceMatchesCounty } from '@/lib/police-force-to-counties';

type ScoredRep = Representative & { _score: number };

type SortKey = 'relevance' | 'name' | 'county';

interface DirectorySearchProps {
  reps: Representative[];
  counties: County[];
  stations: PoliceStation[];
  urlBase?: string;
  defaultCounty?: string;
  defaultStation?: string;
  defaultAvailability?: string;
  defaultQuery?: string;
}

function normalizeAvailability(raw: string): string {
  const lower = (raw || '').toLowerCase().trim();
  if (!lower) return 'unknown';

  if (/24\s*[\/\s]?\s*7|24\s*hour|all\s*hour|anytime|any\s*time|full\s*time|any$|all$|all\s*day|mon-sun\s*24|at any time|most\s*days/i.test(lower))
    return '24-7';
  if (/evening|night|after\s*(5|6|7|8)|out\s*of\s*hours|18:30|pm\s*onwards|17:00\s*onwards/i.test(lower))
    return 'evenings-nights';
  if (/weekend|sat|sun|fri.*sat.*sun/i.test(lower))
    return 'weekends';
  if (/day(time|s)|morning|afternoon|mon.*fri|9.*5|8.*6|9am|08\.|09\./i.test(lower))
    return 'daytime';
  if (/flexi|arrangement|please\s*call|call\s*to|usually|general|most|majority/i.test(lower))
    return 'flexible';

  return 'flexible';
}

const AVAILABILITY_OPTIONS = [
  { value: '', label: 'All availability' },
  { value: '24-7', label: '24/7 / Full-time' },
  { value: 'evenings-nights', label: 'Evenings & Nights' },
  { value: 'weekends', label: 'Weekends' },
  { value: 'daytime', label: 'Daytime' },
  { value: 'flexible', label: 'Flexible / By arrangement' },
];

const ACCREDITATION_OPTIONS: { value: AccreditationFilterKey; label: string }[] = [
  { value: '', label: 'All accreditation types' },
  { value: 'duty', label: 'Duty solicitor' },
  { value: 'accredited', label: 'Accredited rep (excl. probationary)' },
  { value: 'probationary', label: 'Probationary only' },
];

const PAGE_SIZE = 24;

export function DirectorySearch({
  reps,
  counties,
  stations,
  urlBase = '/directory',
  defaultCounty = '',
  defaultStation = '',
  defaultAvailability = '',
  defaultQuery = '',
}: DirectorySearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const internalNavigationRef = useRef(false);
  const [query, setQuery] = useState(defaultQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(defaultQuery);
  const [county, setCounty] = useState(defaultCounty);
  const [station, setStation] = useState(defaultStation);
  const [availability, setAvailability] = useState(defaultAvailability);
  const [accreditation, setAccreditation] = useState<AccreditationFilterKey>('');
  const [force, setForce] = useState('');
  const [sort, setSort] = useState<SortKey>('name');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 200);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (internalNavigationRef.current) {
      internalNavigationRef.current = false;
      return;
    }

    const nextQuery = searchParams.get('q') ?? '';
    const nextCounty = searchParams.get('county') ?? '';
    const nextStation = searchParams.get('station') ?? '';
    const nextAvailability = searchParams.get('availability') ?? '';
    const nextAcc = (searchParams.get('accreditation') ?? '') as AccreditationFilterKey;
    const nextForce = searchParams.get('force') ?? '';
    const nextSortRaw = searchParams.get('sort') ?? '';
    const allowedAcc: AccreditationFilterKey[] = ['', 'duty', 'accredited', 'probationary'];
    const allowedSort: SortKey[] = ['relevance', 'name', 'county'];

    setQuery(nextQuery);
    setDebouncedQuery(nextQuery);
    setCounty(nextCounty);
    setStation(nextStation);
    setAvailability(nextAvailability);
    setAccreditation(allowedAcc.includes(nextAcc) ? nextAcc : '');
    setForce(nextForce);

    const nextSort = nextSortRaw as SortKey;
    if (allowedSort.includes(nextSort)) {
      setSort(nextSort);
    } else if (nextQuery.trim()) {
      setSort('relevance');
    } else {
      setSort('name');
    }
    setPage(1);
  }, [pathname, searchParams]);

  const syncUrl = useCallback(() => {
    const params = new URLSearchParams();
    const qTrim = debouncedQuery.trim();
    if (qTrim) params.set('q', qTrim);
    if (county) params.set('county', county);
    if (station) params.set('station', station);
    if (availability) params.set('availability', availability);
    if (accreditation) params.set('accreditation', accreditation);
    if (force) params.set('force', force);

    const hasQ = qTrim.length > 0;
    if (hasQ) {
      if (sort !== 'relevance') params.set('sort', sort);
    } else if (sort !== 'name') {
      params.set('sort', sort);
    }

    const qs = params.toString();
    const path = qs ? `${urlBase}?${qs}` : urlBase;
    const currentQs = searchParams.toString();
    const currentPath = currentQs ? `${pathname}?${currentQs}` : pathname;
    if (currentPath === path) return;
    internalNavigationRef.current = true;
    router.replace(path, { scroll: false });
  }, [
    router,
    pathname,
    searchParams,
    urlBase,
    debouncedQuery,
    county,
    station,
    availability,
    accreditation,
    force,
    sort,
  ]);

  useEffect(() => {
    const timer = setTimeout(syncUrl, 400);
    return () => clearTimeout(timer);
  }, [syncUrl]);

  const hasTextQuery = debouncedQuery.trim().length > 0;

  useEffect(() => {
    if (!debouncedQuery.trim() && sort === 'relevance') {
      setSort('name');
    }
  }, [debouncedQuery, sort]);

  const countyCanonicalMap = useMemo(
    () => buildCountyCanonicalMap(counties.map((c) => c.name)),
    [counties],
  );

  const searchRows = useMemo(
    () => reps.map((r) => representativeToSearchRow(r, countyCanonicalMap, stations)),
    [reps, countyCanonicalMap, stations],
  );

  const forceOptions = useMemo(() => {
    const s = new Set<string>();
    for (const st of stations) {
      const f = (st.forceName || '').trim();
      if (f) s.add(f);
    }
    return [...s].sort((a, b) => a.localeCompare(b, 'en-GB'));
  }, [stations]);

  const filtered = useMemo(() => {
    let result: ScoredRep[];

    const q = debouncedQuery.trim();
    if (!q) {
      result = reps.map((r) => ({ ...r, _score: 0 }));
    } else {
      const matched = searchDirectory(searchRows, q);
      result = matched.map((row, i) => ({ ...row.rep, _score: 1000 - i }));
    }

    if (county) {
      result = result.filter((r) => repMatchesCountyName(r.county, county));
    }

    const stationTrim = station.trim();
    if (stationTrim) {
      const st = stationTrim.toLowerCase();
      result = result.filter((r) =>
        (r.stations || []).some((s) => s.toLowerCase().includes(st) || st.includes(s.toLowerCase())),
      );
    }

    if (availability) {
      result = result.filter((r) => normalizeAvailability(r.availability) === availability);
    }

    if (accreditation) {
      result = result.filter((r) => repMatchesAccreditationFilter(r, accreditation));
    }

    if (force) {
      result = result.filter((r) => repMatchesPoliceForce(r, force, stations));
    }

    const featured = result.filter((r) => r.featured);
    const nonFeatured = result.filter((r) => !r.featured);

    const sortKey: SortKey = hasTextQuery ? sort : sort === 'relevance' ? 'name' : sort;

    const sortFn = (a: ScoredRep, b: ScoredRep) => {
      if (hasTextQuery && sortKey === 'relevance') return b._score - a._score;
      if (hasTextQuery && sortKey === 'name') {
        const sc = b._score - a._score;
        if (sc !== 0) return sc;
        return (a.name || '').localeCompare(b.name || '', 'en-GB');
      }
      if (hasTextQuery && sortKey === 'county') {
        const c = (a.county || '').localeCompare(b.county || '', 'en-GB');
        if (c !== 0) return c;
        return b._score - a._score;
      }
      if (!hasTextQuery && sortKey === 'county') {
        const c = (a.county || '').localeCompare(b.county || '', 'en-GB');
        return c !== 0 ? c : (a.name || '').localeCompare(b.name || '', 'en-GB');
      }
      return (a.name || '').localeCompare(b.name || '', 'en-GB');
    };

    featured.sort(sortFn);
    nonFeatured.sort(sortFn);

    return [...featured, ...nonFeatured];
  }, [
    reps,
    searchRows,
    debouncedQuery,
    county,
    station,
    availability,
    accreditation,
    force,
    stations,
    hasTextQuery,
    sort,
  ]);

  const featuredReps = filtered.filter((r) => r.featured);
  const nonFeaturedReps = filtered.filter((r) => !r.featured);
  const pagedNonFeatured = nonFeaturedReps.slice(0, page * PAGE_SIZE);
  const hasMoreNonFeatured = pagedNonFeatured.length < nonFeaturedReps.length;

  function resetFilters() {
    setQuery('');
    setDebouncedQuery('');
    setCounty('');
    setStation('');
    setAvailability('');
    setAccreditation('');
    setForce('');
    setSort('name');
    setPage(1);
  }

  const sortIsNonDefault = hasTextQuery ? sort !== 'relevance' : sort !== 'name';
  const hasActiveFilters =
    query.trim() || county || station || availability || accreditation || force || sortIsNonDefault;

  const countyStations = county
    ? stations.filter((s) => forceMatchesCounty(s.forceName || '', county))
    : [];

  return (
    <div>
      {/* Search bar */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-white p-5 shadow-[var(--card-shadow)] sm:p-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-2">
            <label htmlFor="dir-q" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              Search
            </label>
            <input
              id="dir-q"
              type="text"
              placeholder="Name, county, station, town, force or postcode…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
                if (e.target.value.trim()) setSort((s) => (s === 'name' ? 'relevance' : s));
              }}
              className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-base text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)] sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="dir-county" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              County
            </label>
            <select
              id="dir-county"
              value={county}
              onChange={(e) => {
                setCounty(e.target.value);
                setStation('');
                setPage(1);
              }}
              className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] px-3 py-3 text-base text-[var(--foreground)] sm:text-sm"
            >
              <option value="">All counties</option>
              {counties.map((c) => (
                <option key={c.slug} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="dir-availability" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              Availability
            </label>
            <select
              id="dir-availability"
              value={availability}
              onChange={(e) => {
                setAvailability(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] px-3 py-3 text-base text-[var(--foreground)] sm:text-sm"
            >
              {AVAILABILITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="dir-force" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              Police force
            </label>
            <select
              id="dir-force"
              value={force}
              onChange={(e) => {
                setForce(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] px-3 py-3 text-base text-[var(--foreground)] sm:text-sm"
            >
              <option value="">All forces</option>
              {forceOptions.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="dir-accreditation" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              Accreditation
            </label>
            <select
              id="dir-accreditation"
              value={accreditation}
              onChange={(e) => {
                setAccreditation(e.target.value as AccreditationFilterKey);
                setPage(1);
              }}
              className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] px-3 py-3 text-base text-[var(--foreground)] sm:text-sm"
            >
              {ACCREDITATION_OPTIONS.map((o) => (
                <option key={o.value || 'all'} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="dir-sort" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              Sort
            </label>
            <select
              id="dir-sort"
              value={hasTextQuery ? sort : sort === 'relevance' ? 'name' : sort}
              onChange={(e) => {
                setSort(e.target.value as SortKey);
                setPage(1);
              }}
              className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] px-3 py-3 text-base text-[var(--foreground)] sm:text-sm"
            >
              {hasTextQuery ? (
                <>
                  <option value="relevance">Best match</option>
                  <option value="name">Name (A–Z, then match strength)</option>
                  <option value="county">County, then match strength</option>
                </>
              ) : (
                <>
                  <option value="name">Name (A–Z)</option>
                  <option value="county">County, then name</option>
                </>
              )}
            </select>
          </div>

          <div className="flex items-end">
            <div className="w-full">
              <label htmlFor="dir-station" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                Station
              </label>
              {county && countyStations.length > 0 ? (
                <select
                  id="dir-station"
                  value={station}
                  onChange={(e) => {
                    setStation(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] px-3 py-3 text-base text-[var(--foreground)] sm:text-sm"
                >
                  <option value="">All stations in {county}</option>
                  {countyStations.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id="dir-station"
                  type="text"
                  placeholder="Filter by station name…"
                  value={station}
                  onChange={(e) => {
                    setStation(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] px-3 py-3 text-base text-[var(--foreground)] placeholder:text-[var(--muted)] sm:text-sm"
                />
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p role="status" className="text-sm text-[var(--muted)]">
            Showing{' '}
            <strong className="font-semibold text-[var(--navy)]">{filtered.length}</strong> representative
            {filtered.length !== 1 ? 's' : ''}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-sm font-medium text-[var(--gold-hover)] transition-colors hover:text-[var(--gold)]"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>
      </div>

      {featuredReps.length > 0 && (
        <div className="mt-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-[var(--navy)]">Featured Representatives</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Featured placements are promoted listings and are shown separately from standard directory results.
              </p>
            </div>
            <Link
              href="/GoFeatured"
              className="btn-gold !min-h-[36px] !px-4 !py-1.5 !text-sm hidden sm:inline-flex no-underline"
            >
              Become Featured
            </Link>
          </div>
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featuredReps.map((rep) => (
              <DirectoryCard key={rep.id} rep={rep} />
            ))}
          </div>
        </div>
      )}

      {nonFeaturedReps.length > 0 && <h2 className="mt-10 text-xl font-bold text-[var(--navy)]">Directory</h2>}

      {pagedNonFeatured.length > 0 ? (
        <>
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {pagedNonFeatured.map((rep) => (
              <DirectoryCard key={rep.id} rep={rep} />
            ))}
          </div>

          {hasMoreNonFeatured && (
            <div className="mt-10 text-center">
              <button type="button" onClick={() => setPage((p) => p + 1)} className="btn-outline">
                Load More Representatives ({nonFeaturedReps.length - pagedNonFeatured.length} remaining)
              </button>
            </div>
          )}
        </>
      ) : filtered.length === 0 ? (
        <div className="mt-8 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-white p-12 text-center shadow-[var(--card-shadow)]">
          <p className="text-xl font-bold text-[var(--navy)]">No representatives found</p>
          <p className="mt-2 text-[var(--muted)]">
            {hasActiveFilters ? (
              <>
                {debouncedQuery.trim() ? (
                  <>
                    No representatives found for &ldquo;{debouncedQuery.trim()}&rdquo;. Try another search or broaden
                    your terms, or{' '}
                  </>
                ) : null}
                Adjust your filters or{' '}
                <button
                  type="button"
                  onClick={resetFilters}
                  className="font-medium text-[var(--gold-hover)] hover:text-[var(--gold)]"
                >
                  clear all filters
                </button>
                .
              </>
            ) : (
              <>No representatives match the current directory data.</>
            )}
          </p>
        </div>
      ) : null}
    </div>
  );
}
