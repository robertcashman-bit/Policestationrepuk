'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { DirectoryCard, type MatchHighlight } from '@/components/DirectoryCard';
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
import {
  computeSmartRank,
  matchesExperienceTier,
  isUrgentCoverCapable,
  isFullProfileListing,
  type ExperienceTier,
} from '@/lib/directory-ranking';

type ScoredRep = Representative & { _score: number };

type SortKey = 'smart' | 'relevance' | 'name' | 'county';

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
  { value: 'evenings-nights', label: 'Evenings & nights' },
  { value: 'weekends', label: 'Weekends' },
  { value: 'daytime', label: 'Daytime' },
  { value: 'flexible', label: 'Flexible / by arrangement' },
];

const ACCREDITATION_OPTIONS: { value: AccreditationFilterKey; label: string }[] = [
  { value: '', label: 'All accreditation types' },
  { value: 'duty', label: 'Duty solicitor' },
  { value: 'accredited', label: 'Accredited rep (excl. probationary)' },
  { value: 'probationary', label: 'Probationary only' },
];

const EXPERIENCE_OPTIONS: { value: ExperienceTier; label: string }[] = [
  { value: '', label: 'Any experience level' },
  { value: 'senior', label: '15+ years' },
  { value: 'mid', label: '5–14 years' },
  { value: 'junior', label: '1–4 years' },
  { value: 'unspecified', label: 'Not stated' },
];

const PAGE_SIZE = 24;

const QUICK_COUNTIES = ['Kent', 'London', 'Essex', 'Greater Manchester', 'West Midlands'];

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
  const [experience, setExperience] = useState<ExperienceTier>('');
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [completeOnly, setCompleteOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>('smart');
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(true);

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
    const nextExp = (searchParams.get('experience') ?? '') as ExperienceTier;
    const nextUrgent = searchParams.get('urgent') === '1';
    const nextComplete = searchParams.get('complete') === '1';
    const nextSortRaw = searchParams.get('sort') ?? '';
    const allowedAcc: AccreditationFilterKey[] = ['', 'duty', 'accredited', 'probationary'];
    const allowedExp: ExperienceTier[] = ['', 'senior', 'mid', 'junior', 'unspecified'];
    const allowedSort: SortKey[] = ['smart', 'relevance', 'name', 'county'];

    setQuery(nextQuery);
    setDebouncedQuery(nextQuery);
    setCounty(nextCounty);
    setStation(nextStation);
    setAvailability(nextAvailability);
    setAccreditation(allowedAcc.includes(nextAcc) ? nextAcc : '');
    setForce(nextForce);
    setExperience(allowedExp.includes(nextExp) ? nextExp : '');
    setUrgentOnly(nextUrgent);
    setCompleteOnly(nextComplete);

    const nextSort = nextSortRaw as SortKey;
    if (allowedSort.includes(nextSort)) {
      setSort(nextSort);
    } else {
      setSort('smart');
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
    if (experience) params.set('experience', experience);
    if (urgentOnly) params.set('urgent', '1');
    if (completeOnly) params.set('complete', '1');
    if (sort !== 'smart') params.set('sort', sort);

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
    experience,
    urgentOnly,
    completeOnly,
    sort,
  ]);

  useEffect(() => {
    const timer = setTimeout(syncUrl, 400);
    return () => clearTimeout(timer);
  }, [syncUrl]);

  const hasTextQuery = debouncedQuery.trim().length > 0;

  useEffect(() => {
    if (!debouncedQuery.trim() && sort === 'relevance') {
      setSort('smart');
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
      const matched = searchDirectory(searchRows, q, counties.map((c) => c.name));
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

    if (experience) {
      result = result.filter((r) => matchesExperienceTier(r, experience));
    }

    if (urgentOnly) {
      result = result.filter((r) => isUrgentCoverCapable(r));
    }

    if (completeOnly) {
      result = result.filter((r) => isFullProfileListing(r));
    }

    const ctxBase = {
      countySelected: county || undefined,
      stationFilter: station || undefined,
    };

    const featured = result.filter((r) => r.featured);
    const nonFeatured = result.filter((r) => !r.featured);

    const sortKey = sort;

    const rankCtx = (rep: ScoredRep) => ({
      ...ctxBase,
      textScore: rep._score,
    });

    const sortFn = (a: ScoredRep, b: ScoredRep) => {
      if (sortKey === 'smart') {
        return computeSmartRank(b, rankCtx(b)) - computeSmartRank(a, rankCtx(a));
      }
      if (sortKey === 'relevance') {
        if (!hasTextQuery) {
          return computeSmartRank(b, rankCtx(b)) - computeSmartRank(a, rankCtx(a));
        }
        const d = b._score - a._score;
        if (d !== 0) return d;
        return (a.name || '').localeCompare(b.name || '', 'en-GB');
      }
      if (sortKey === 'name') {
        if (hasTextQuery) {
          const d = b._score - a._score;
          if (d !== 0) return d;
        }
        return (a.name || '').localeCompare(b.name || '', 'en-GB');
      }
      if (sortKey === 'county') {
        const c = (a.county || '').localeCompare(b.county || '', 'en-GB');
        if (c !== 0) return c;
        if (hasTextQuery) return b._score - a._score;
        return (a.name || '').localeCompare(b.name || '', 'en-GB');
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
    experience,
    urgentOnly,
    completeOnly,
    stations,
    counties,
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
    setExperience('');
    setUrgentOnly(false);
    setCompleteOnly(false);
    setSort('smart');
    setPage(1);
  }

  const sortIsNonDefault = sort !== 'smart';
  const hasActiveFilters =
    query.trim() ||
    county ||
    station ||
    availability ||
    accreditation ||
    force ||
    experience ||
    urgentOnly ||
    completeOnly ||
    sortIsNonDefault;

  const countyStations = county
    ? stations.filter((s) => forceMatchesCounty(s.forceName || '', county))
    : [];

  /** Preset links — full URL replace so quick actions don’t inherit stale filters. */
  function goQuick(entries: [string, string][]) {
    setPage(1);
    const p = new URLSearchParams();
    for (const [k, v] of entries) {
      if (v) p.set(k, v);
    }
    if (!p.get('sort')) p.set('sort', 'smart');
    router.replace(`${urlBase}?${p.toString()}`, { scroll: false });
  }

  const filterGrid = (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-2">
          <label htmlFor="dir-q" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Smart search
          </label>
          <input
            id="dir-q"
            type="search"
            placeholder="Name, county, station, town, force or postcode…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/80 px-4 py-3 text-base text-[var(--foreground)] placeholder:text-slate-400 focus:border-[var(--gold)] focus:bg-white focus:ring-2 focus:ring-[var(--gold)]/30 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="dir-county" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
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
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-[var(--foreground)]"
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
          <label htmlFor="dir-availability" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Availability
          </label>
          <select
            id="dir-availability"
            value={availability}
            onChange={(e) => {
              setAvailability(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm"
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
          <label htmlFor="dir-force" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Police force
          </label>
          <select
            id="dir-force"
            value={force}
            onChange={(e) => {
              setForce(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm"
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
          <label htmlFor="dir-accreditation" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Accreditation
          </label>
          <select
            id="dir-accreditation"
            value={accreditation}
            onChange={(e) => {
              setAccreditation(e.target.value as AccreditationFilterKey);
              setPage(1);
            }}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm"
          >
            {ACCREDITATION_OPTIONS.map((o) => (
              <option key={o.value || 'all'} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="dir-experience" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Experience
          </label>
          <select
            id="dir-experience"
            value={experience}
            onChange={(e) => {
              setExperience(e.target.value as ExperienceTier);
              setPage(1);
            }}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm"
          >
            {EXPERIENCE_OPTIONS.map((o) => (
              <option key={o.value || 'any'} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="dir-sort" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Rank results by
          </label>
          <select
            id="dir-sort"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as SortKey);
              setPage(1);
            }}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm"
          >
            <option value="smart">Recommended (signals + match)</option>
            {hasTextQuery ? <option value="relevance">Text match only</option> : null}
            <option value="name">Name (A–Z)</option>
            <option value="county">County, then name</option>
          </select>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="min-w-0 flex-1 sm:max-w-md">
          <label htmlFor="dir-station" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
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
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm"
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
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm placeholder:text-slate-400"
            />
          )}
        </div>

        <div className="flex flex-wrap gap-4 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2 sm:py-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-[var(--navy)]">
            <input
              type="checkbox"
              checked={urgentOnly}
              onChange={(e) => {
                setUrgentOnly(e.target.checked);
                setPage(1);
              }}
              className="h-4 w-4 rounded border-slate-300 text-[var(--navy)]"
            />
            Out-of-hours ready
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-[var(--navy)]">
            <input
              type="checkbox"
              checked={completeOnly}
              onChange={(e) => {
                setCompleteOnly(e.target.checked);
                setPage(1);
              }}
              className="h-4 w-4 rounded border-slate-300 text-[var(--navy)]"
            />
            Full profiles only
          </label>
        </div>
      </div>
    </>
  );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-white to-slate-50/80 p-4 shadow-[0_8px_40px_-12px_rgba(30,58,138,0.15)] sm:p-5">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-[var(--navy)] sm:text-xl">Quick actions</h2>
            <p className="text-xs text-slate-600 sm:text-sm">One tap to common discovery paths — you can still refine below.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => goQuick([
              ['urgent', '1'],
              ['sort', 'smart'],
            ])}
            className="rounded-full border-2 border-rose-200 bg-rose-50 px-4 py-2 text-sm font-bold text-rose-950 transition hover:bg-rose-100"
          >
            Urgent cover
          </button>
          <button
            type="button"
            onClick={() => goQuick([
              ['availability', '24-7'],
              ['sort', 'smart'],
            ])}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[var(--navy)] shadow-sm hover:border-[var(--gold)]"
          >
            Find a rep now (24/7)
          </button>
          <Link
            href="/directory/counties"
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[var(--navy)] no-underline shadow-sm hover:border-[var(--gold)]"
          >
            Browse by county
          </Link>
          <Link
            href="/Forces"
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[var(--navy)] no-underline shadow-sm hover:border-[var(--gold)]"
          >
            Browse by force
          </Link>
          <Link
            href="/StationsDirectory"
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[var(--navy)] no-underline shadow-sm hover:border-[var(--gold)]"
          >
            Station directory
          </Link>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="w-full text-[11px] font-bold uppercase tracking-wider text-slate-500 sm:w-auto sm:mr-1">Try:</span>
          {QUICK_COUNTIES.filter((n) => counties.some((c) => c.name === n)).map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => goQuick([
                ['county', name],
                ['availability', 'evenings-nights'],
                ['sort', 'smart'],
              ])}
              className="rounded-full bg-[var(--navy)]/8 px-3 py-1 text-xs font-semibold text-[var(--navy)] hover:bg-[var(--navy)]/15"
            >
              {name} · evenings
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[var(--card-shadow)]">
        <button
          type="button"
          className="flex w-full items-center justify-between border-b border-slate-100 px-4 py-3 text-left lg:hidden"
          aria-expanded={filtersOpen}
          onClick={() => setFiltersOpen((o) => !o)}
        >
          <span className="font-bold text-[var(--navy)]">Filters & ranking</span>
          <span className="text-slate-500" aria-hidden>
            {filtersOpen ? '▲' : '▼'}
          </span>
        </button>
        <div className={`${filtersOpen ? 'block' : 'hidden'} p-4 sm:p-6 lg:block`}>
          {filterGrid}
          <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p role="status" className="text-sm text-slate-600">
              <strong className="font-bold text-[var(--navy)]">{filtered.length}</strong> listing
              {filtered.length !== 1 ? 's' : ''} match your criteria
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-sm font-bold text-[var(--gold-hover)] hover:text-[var(--gold)]"
              >
                Reset everything
              </button>
            )}
          </div>
        </div>
      </div>

      {featuredReps.length > 0 && (
        <div className="mt-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-[var(--navy)] sm:text-2xl">Featured listings</h2>
              <p className="mt-1 max-w-2xl text-sm text-slate-600">
                Promoted placements — same compliance rules apply; firms should still run their own checks before instructing.
              </p>
            </div>
            <Link href="/GoFeatured" className="btn-gold !min-h-[40px] shrink-0 !px-5 !text-sm no-underline">
              Promote your listing
            </Link>
          </div>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {featuredReps.map((rep) => (
              <DirectoryCard key={rep.id} rep={rep} />
            ))}
          </div>
        </div>
      )}

      {nonFeaturedReps.length > 0 && (
        <h2 className="mt-12 text-xl font-bold text-[var(--navy)] sm:text-2xl">All listings</h2>
      )}

      {pagedNonFeatured.length > 0 ? (
        <>
          <p className="mt-2 text-sm text-slate-600">
            {sort === 'smart'
              ? 'Recommended order uses location match, availability signals, profile depth, and contact options — not a quality guarantee.'
              : null}
          </p>
          <div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {pagedNonFeatured.map((rep, i) => {
              let matchHighlight: MatchHighlight = null;
              if (sort === 'smart' && i < 3) {
                matchHighlight = i === 0 ? 'top' : 'runner';
              }
              return <DirectoryCard key={rep.id} rep={rep} matchHighlight={matchHighlight} />;
            })}
          </div>

          {hasMoreNonFeatured && (
            <div className="mt-10 text-center">
              <button type="button" onClick={() => setPage((p) => p + 1)} className="btn-outline !min-h-[48px] !px-8 font-semibold">
                Load more ({nonFeaturedReps.length - pagedNonFeatured.length} remaining)
              </button>
            </div>
          )}
        </>
      ) : filtered.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 px-6 py-14 text-center">
          <p className="text-xl font-bold text-[var(--navy)]">No listings match</p>
          <p className="mx-auto mt-2 max-w-lg text-slate-600">
            {hasActiveFilters ? (
              <>
                Widen your search, turn off &ldquo;out-of-hours ready&rdquo; or &ldquo;full profiles only&rdquo;, or explore counties and forces.
              </>
            ) : (
              <>No representatives are in the dataset yet for this view.</>
            )}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={resetFilters} className="btn-gold !text-sm">
              Reset filters
            </button>
            <Link href="/directory/counties" className="btn-outline !text-sm no-underline">
              Browse counties
            </Link>
            <Link href="/Forces" className="btn-outline !text-sm no-underline">
              Police forces
            </Link>
            <Link href="/register" className="btn-outline !text-sm no-underline">
              Join the directory
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
