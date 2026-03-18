'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DirectoryCard } from '@/components/DirectoryCard';
import type { Representative, County, PoliceStation } from '@/lib/types';

interface DirectorySearchProps {
  reps: Representative[];
  counties: County[];
  stations: PoliceStation[];
  defaultCounty?: string;
  defaultStation?: string;
  defaultAvailability?: string;
  defaultAccreditation?: string;
  defaultQuery?: string;
}

function normalizeAvailability(raw: string): string {
  const lower = raw.toLowerCase().trim();
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

const ACCREDITATION_OPTIONS = [
  { value: '', label: 'All accreditations' },
  { value: 'Law Society', label: 'Law Society Accredited' },
  { value: 'Duty Solicitor', label: 'Duty Solicitor' },
  { value: 'Probationary', label: 'Probationary' },
  { value: 'Accredited', label: 'Accredited Representative' },
];

const SORT_OPTIONS = [
  { value: 'name', label: 'Name (A-Z)' },
  { value: 'experience', label: 'Experience' },
  { value: 'stations', label: 'Most stations' },
];

const FORCE_TO_COUNTIES: Record<string, string[]> = {
  'avon and somerset': ['Somerset', 'Bristol'],
  'bedfordshire': ['Bedfordshire'],
  'cambridgeshire': ['Cambridgeshire'],
  'cheshire': ['Cheshire'],
  'city of london': ['London'],
  'cleveland': ['Cleveland'],
  'cumbria': ['Cumbria'],
  'derbyshire': ['Derbyshire'],
  'devon and cornwall': ['Devon', 'Cornwall'],
  'dorset': ['Dorset'],
  'durham': ['County Durham'],
  'dyfed-powys': ['Powys', 'Dyfed'],
  'essex': ['Essex'],
  'gloucestershire': ['Gloucestershire'],
  'greater manchester': ['Greater Manchester'],
  'gwent': ['Gwent'],
  'hampshire': ['Hampshire'],
  'hertfordshire': ['Hertfordshire'],
  'humberside': ['Humberside'],
  'kent': ['Kent'],
  'lancashire': ['Lancashire'],
  'leicestershire': ['Leicestershire'],
  'lincolnshire': ['Lincolnshire'],
  'merseyside': ['Merseyside'],
  'met': ['London'],
  'metropolitan': ['London'],
  'norfolk': ['Norfolk'],
  'north wales': ['North Wales'],
  'north yorkshire': ['North Yorkshire', 'Yorkshire'],
  'northamptonshire': ['Northamptonshire'],
  'northumbria': ['Northumberland', 'Tyne and Wear'],
  'nottinghamshire': ['Nottinghamshire'],
  'south wales': ['South Wales'],
  'south yorkshire': ['South Yorkshire', 'Yorkshire'],
  'staffordshire': ['Staffordshire'],
  'suffolk': ['Suffolk'],
  'surrey': ['Surrey'],
  'sussex': ['Sussex'],
  'thames valley': ['Berkshire', 'Buckinghamshire', 'Oxfordshire'],
  'warwickshire': ['Warwickshire'],
  'west mercia': ['Shropshire', 'Herefordshire', 'Worcestershire'],
  'west midlands': ['West Midlands'],
  'west yorkshire': ['West Yorkshire', 'Yorkshire'],
  'wiltshire': ['Wiltshire'],
};

function forceMatchesCounty(forceName: string, countyName: string): boolean {
  const forceKey = forceName.toLowerCase().replace(/\s*(police|constabulary)\s*/gi, '').trim();
  const counties = FORCE_TO_COUNTIES[forceKey];
  if (counties) return counties.some((c) => c.toLowerCase() === countyName.toLowerCase());
  return forceName.toLowerCase().includes(countyName.toLowerCase()) ||
    countyName.toLowerCase().includes(forceKey);
}

const PAGE_SIZE = 24;

export function DirectorySearch({
  reps,
  counties,
  stations,
  defaultCounty = '',
  defaultStation = '',
  defaultAvailability = '',
  defaultAccreditation = '',
  defaultQuery = '',
}: DirectorySearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultQuery);
  const [county, setCounty] = useState(defaultCounty);
  const [station, setStation] = useState(defaultStation);
  const [availability, setAvailability] = useState(defaultAvailability);
  const [accreditation, setAccreditation] = useState(defaultAccreditation);
  const [sort, setSort] = useState('name');
  const [page, setPage] = useState(1);

  const syncUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (county) params.set('county', county);
    if (station) params.set('station', station);
    if (availability) params.set('availability', availability);
    if (accreditation) params.set('accreditation', accreditation);
    const qs = params.toString();
    router.replace(qs ? `/directory?${qs}` : '/directory', { scroll: false });
  }, [router, query, county, station, availability, accreditation]);

  useEffect(() => {
    const timer = setTimeout(syncUrl, 400);
    return () => clearTimeout(timer);
  }, [syncUrl]);

  const filtered = useMemo(() => {
    let result = [...reps];

    if (query) {
      const q = query.toLowerCase();
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.county.toLowerCase().includes(q) ||
          r.stations.some((s) => s.toLowerCase().includes(q)) ||
          r.specialisms?.some((s) => s.toLowerCase().includes(q))
      );
    }

    if (county) {
      result = result.filter((r) =>
        r.county.toLowerCase() === county.toLowerCase()
      );
    }

    if (station) {
      result = result.filter((r) =>
        r.stations.some((s) => s.toLowerCase().includes(station.toLowerCase()))
      );
    }

    if (availability) {
      result = result.filter((r) => normalizeAvailability(r.availability) === availability);
    }

    if (accreditation) {
      result = result.filter((r) =>
        r.accreditation.toLowerCase().includes(accreditation.toLowerCase())
      );
    }

    const featured = result.filter((r) => r.featured);
    const nonFeatured = result.filter((r) => !r.featured);

    const sortFn = (a: Representative, b: Representative) => {
      if (sort === 'experience') return (b.yearsExperience ?? 0) - (a.yearsExperience ?? 0);
      if (sort === 'stations') return b.stations.length - a.stations.length;
      return a.name.localeCompare(b.name);
    };

    featured.sort(sortFn);
    nonFeatured.sort(sortFn);

    return [...featured, ...nonFeatured];
  }, [reps, query, county, station, availability, accreditation, sort]);

  const paged = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = paged.length < filtered.length;

  function resetFilters() {
    setQuery('');
    setCounty('');
    setStation('');
    setAvailability('');
    setAccreditation('');
    setSort('name');
    setPage(1);
  }

  const hasActiveFilters = query || county || station || availability || accreditation;

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
              placeholder="Search by name, county, station, or specialism..."
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)]"
            />
          </div>

          {/* County filter */}
          <select
            value={county}
            onChange={(e) => { setCounty(e.target.value); setStation(''); setPage(1); }}
            className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] px-3 py-3 text-sm text-[var(--foreground)]"
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
            className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] px-3 py-3 text-sm text-[var(--foreground)]"
          >
            {AVAILABILITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Second row: station filter + accreditation + sort */}
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {county && countyStations.length > 0 ? (
            <select
              value={station}
              onChange={(e) => { setStation(e.target.value); setPage(1); }}
              className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] px-3 py-3 text-sm text-[var(--foreground)]"
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
              className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] px-3 py-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)]"
            />
          )}

          <select
            value={accreditation}
            onChange={(e) => { setAccreditation(e.target.value); setPage(1); }}
            className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] px-3 py-3 text-sm text-[var(--foreground)]"
          >
            {ACCREDITATION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] px-3 py-3 text-sm text-[var(--foreground)]"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Active filters / results count */}
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-[var(--muted)]">
            <strong className="font-semibold text-[var(--navy)]">{filtered.length}</strong> representative{filtered.length !== 1 ? 's' : ''} found
          </p>
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

      {/* Results grid */}
      {paged.length > 0 ? (
        <>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {paged.map((rep) => (
              <DirectoryCard key={rep.id} rep={rep} />
            ))}
          </div>

          {/* Load more */}
          {hasMore && (
            <div className="mt-10 text-center">
              <button
                onClick={() => setPage((p) => p + 1)}
                className="btn-outline"
              >
                Load more ({filtered.length - paged.length} remaining)
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="mt-8 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-white p-12 text-center shadow-[var(--card-shadow)]">
          <p className="text-xl font-bold text-[var(--navy)]">No representatives found</p>
          <p className="mt-2 text-[var(--muted)]">
            Try adjusting your filters or{' '}
            <button onClick={resetFilters} className="font-medium text-[var(--gold-hover)] hover:text-[var(--gold)]">
              clear all filters
            </button>
            .
          </p>
        </div>
      )}
    </div>
  );
}
