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
import { forceMatchesCounty } from '@/lib/police-force-to-counties';

type ScoredRep = Representative & { _score: number };

interface DirectorySearchProps {
  reps: Representative[];
  counties: County[];
  stations: PoliceStation[];
  urlBase?: string;
  defaultCounty?: string;
  defaultStation?: string;
  defaultAvailability?: string;
  defaultAccreditation?: string;
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

    setQuery(nextQuery);
    setDebouncedQuery(nextQuery);
    setCounty(nextCounty);
    setStation(nextStation);
    setAvailability(nextAvailability);
    setPage(1);
  }, [pathname, searchParams]);

  const syncUrl = useCallback(() => {
    const params = new URLSearchParams();
    const qTrim = debouncedQuery.trim();
    if (qTrim) params.set('q', qTrim);
    if (county) params.set('county', county);
    if (station) params.set('station', station);
    if (availability) params.set('availability', availability);
    const qs = params.toString();
    const path = qs ? `${urlBase}?${qs}` : urlBase;
    const currentQs = searchParams.toString();
    const currentPath = currentQs ? `${pathname}?${currentQs}` : pathname;
    if (currentPath === path) return;
    internalNavigationRef.current = true;
    router.replace(path, { scroll: false });
  }, [router, pathname, searchParams, urlBase, debouncedQuery, county, station, availability]);

  useEffect(() => {
    const timer = setTimeout(syncUrl, 400);
    return () => clearTimeout(timer);
  }, [syncUrl]);

  const hasTextQuery = debouncedQuery.trim().length > 0;

  const countyCanonicalMap = useMemo(
    () => buildCountyCanonicalMap(counties.map((c) => c.name)),
    [counties],
  );

  const searchRows = useMemo(
    () => reps.map((r) => representativeToSearchRow(r, countyCanonicalMap)),
    [reps, countyCanonicalMap],
  );

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
        (r.stations || []).some((s) => s.toLowerCase().includes(st)),
      );
    }

    if (availability) {
      result = result.filter((r) => normalizeAvailability(r.availability) === availability);
    }

    const featured = result.filter((r) => r.featured);
    const nonFeatured = result.filter((r) => !r.featured);

    const sortFn = (a: ScoredRep, b: ScoredRep) => {
      if (hasTextQuery) return b._score - a._score;
      return (a.name || '').localeCompare(b.name || '');
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
    hasTextQuery,
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
    setPage(1);
  }

  const hasActiveFilters =
    query.trim() || county || station || availability;

  const countyStations = county
    ? stations.filter((s) => forceMatchesCounty(s.forceName || '', county))
    : [];

  return (
    <div>
      {/* Search bar */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-white p-5 shadow-[var(--card-shadow)] sm:p-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Text search */}
          <div className="sm:col-span-2 lg:col-span-2">
            <input
              type="text"
              placeholder="Search by county, station, name..."
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-base text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)] sm:text-sm"
            />
          </div>

          {/* County filter */}
          <select
            value={county}
            onChange={(e) => { setCounty(e.target.value); setStation(''); setPage(1); }}
            className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] px-3 py-3 text-base text-[var(--foreground)] sm:text-sm"
          >
            <option value="">All counties</option>
            {counties.map((c) => (
              <option key={c.slug} value={c.name}>{c.name}</option>
            ))}
          </select>

          {/* Availability filter */}
          <select
            value={availability}
            onChange={(e) => { setAvailability(e.target.value); setPage(1); }}
            className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] px-3 py-3 text-base text-[var(--foreground)] sm:text-sm"
          >
            {AVAILABILITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Second row: station filter only */}
        <div className="mt-3">
          {county && countyStations.length > 0 ? (
            <select
              value={station}
              onChange={(e) => { setStation(e.target.value); setPage(1); }}
              className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] px-3 py-3 text-base text-[var(--foreground)] sm:text-sm"
            >
              <option value="">All stations in {county}</option>
              {countyStations.map((s) => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              placeholder="Filter by station name..."
              value={station}
              onChange={(e) => { setStation(e.target.value); setPage(1); }}
              className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] px-3 py-3 text-base text-[var(--foreground)] placeholder:text-[var(--muted)] sm:text-sm"
            />
          )}
        </div>

        {/* Active filters / results count */}
        <div className="mt-4 flex items-center justify-between">
          <p role="status" className="text-sm text-[var(--muted)]">
            Showing <strong className="font-semibold text-[var(--navy)]">{filtered.length}</strong> representative{filtered.length !== 1 ? 's' : ''}
          </p>
          <div className="flex items-center gap-3">
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="text-sm font-medium text-[var(--gold-hover)] transition-colors hover:text-[var(--gold)]"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Featured Representatives section */}
      {featuredReps.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[var(--navy)]">Featured Representatives</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Featured placements are promoted listings and are shown separately from standard directory results.
              </p>
            </div>
            <Link href="/GoFeatured" className="btn-gold !min-h-[36px] !px-4 !py-1.5 !text-sm hidden sm:inline-flex no-underline">
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

      {/* Directory heading */}
      {nonFeaturedReps.length > 0 && (
        <h2 className="mt-10 text-xl font-bold text-[var(--navy)]">Directory</h2>
      )}

      {/* Results grid */}
      {pagedNonFeatured.length > 0 ? (
        <>
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {pagedNonFeatured.map((rep) => (
              <DirectoryCard key={rep.id} rep={rep} />
            ))}
          </div>

          {/* Load more */}
          {hasMoreNonFeatured && (
            <div className="mt-10 text-center">
              <button
                onClick={() => setPage((p) => p + 1)}
                className="btn-outline"
              >
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
