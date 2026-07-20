'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { PoliceStation } from '@/lib/types';
import { searchStations, type ScoredStation } from '@/lib/station-search';
import {
  ALL_AREAS,
  areaKey,
  buildAreaIndex,
  filterByArea,
  hasDirectNumber,
  type AreaSelection,
  type AreaType,
} from '@/lib/station-browse';
import { getCustodyPublicDisplay } from '@/lib/station-contacts/publish';
import { deriveRegionForStation } from '@/lib/station-contacts/types';
import { isCustodyStation } from '@/lib/custody-station';
import { MobileFilterDrawer } from '@/components/directory/MobileFilterDrawer';
import { StationsSearchBar } from '@/components/stations/StationsSearchBar';
import { StationsFilterPanel } from '@/components/stations/StationsFilterPanel';
import {
  StationsResultsGrid,
  buildStationTableColumns,
} from '@/components/stations/StationsResultsGrid';
import { buildFindStationSearchUrl } from '@/lib/station-directory-links';
import type {
  StationsCustodyFilter,
  StationsFrontCounterFilter,
  StationsSortBy,
  StationsViewMode,
} from '@/components/stations/stations-filter-types';

const PAGE_SIZE = 60;

/**
 * Browse-only explorer (A–Z / force / county).
 * Text search goes to /find-station — this component redirects if the user types a query.
 */
export function StationsDirectoryExplorer({
  stations,
  repCountBySlug = {},
  initialForce = '',
  initialCounty = '',
}: {
  stations: PoliceStation[];
  repCountBySlug?: Record<string, number>;
  initialForce?: string;
  initialCounty?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [groupBy, setGroupBy] = useState<AreaType>(initialCounty ? 'county' : 'force');
  const [area, setArea] = useState<AreaSelection>(
    initialForce
      ? { type: 'force', value: initialForce }
      : initialCounty
        ? { type: 'county', value: initialCounty }
        : ALL_AREAS,
  );
  const [custodyOnly, setCustodyOnly] = useState(false);
  const [directOnly, setDirectOnly] = useState(false);
  const [regionFilter, setRegionFilter] = useState('');
  const [custodyFilter, setCustodyFilter] = useState<StationsCustodyFilter>('all');
  const [frontCounterFilter, setFrontCounterFilter] = useState<StationsFrontCounterFilter>('all');
  const [viewMode, setViewMode] = useState<StationsViewMode>('cards');
  const [sortBy, setSortBy] = useState<StationsSortBy>('name');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sp = new URLSearchParams(window.location.search);
    const force = sp.get('force');
    const county = sp.get('county');
    if (force) {
      setGroupBy('force');
      setArea({ type: 'force', value: force });
    } else if (county) {
      setGroupBy('county');
      setArea({ type: 'county', value: county });
    }
  }, []);

  // Any typed search → dedicated find-station page (one station at a time).
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) return;
    const handle = window.setTimeout(() => {
      router.push(buildFindStationSearchUrl(trimmed));
    }, 400);
    return () => window.clearTimeout(handle);
  }, [query, router]);

  const hasArea = area.type !== 'all' && area.value.length > 0;
  const isFlat = hasArea;

  const areaIndex = useMemo(() => buildAreaIndex(stations, groupBy), [stations, groupBy]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [custodyOnly, directOnly, regionFilter, custodyFilter, frontCounterFilter, groupBy, sortBy, area]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handle = window.setTimeout(() => {
      const url = new URL(window.location.href);
      url.searchParams.delete('q');
      if (area.type === 'force') url.searchParams.set('force', area.value);
      else url.searchParams.delete('force');
      if (area.type === 'county') url.searchParams.set('county', area.value);
      else url.searchParams.delete('county');
      window.history.replaceState(null, '', url.toString());
    }, 300);
    return () => window.clearTimeout(handle);
  }, [area]);

  const filtered = useMemo(() => {
    let result: ScoredStation[] = searchStations('', stations);

    if (hasArea) {
      result = filterByArea(result, area) as ScoredStation[];
    }
    if (custodyOnly) {
      result = result.filter((s) => isCustodyStation(s));
    }
    if (directOnly) {
      result = result.filter((s) => hasDirectNumber(s));
    }
    if (regionFilter) {
      result = result.filter((s) => deriveRegionForStation(s) === regionFilter);
    }
    if (custodyFilter === 'published') {
      result = result.filter((s) => getCustodyPublicDisplay(s).published);
    } else if (custodyFilter === 'not_published') {
      result = result.filter(
        (s) => isCustodyStation(s) && !getCustodyPublicDisplay(s).published,
      );
    }
    if (frontCounterFilter !== 'all') {
      result = result.filter((s) => s.frontCounterStatus === frontCounterFilter);
    }

    result.sort((a, b) => a.name.localeCompare(b.name, 'en-GB'));
    return result;
  }, [
    stations,
    area,
    hasArea,
    custodyOnly,
    directOnly,
    regionFilter,
    custodyFilter,
    frontCounterFilter,
  ]);

  const total = stations.length;
  const shown = filtered.length;

  const visible = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount],
  );

  const groupedSorted = useMemo(() => {
    if (isFlat) return null;

    const map = filtered.reduce<Record<string, ScoredStation[]>>((acc, station) => {
      const key = areaKey(station, groupBy);
      if (!acc[key]) acc[key] = [];
      acc[key].push(station);
      return acc;
    }, {});
    for (const k of Object.keys(map)) {
      map[k].sort((a, b) => a.name.localeCompare(b.name, 'en-GB'));
    }
    const keys = Object.keys(map).sort((a, b) => a.localeCompare(b, 'en-GB'));

    const visibleKeys: string[] = [];
    let running = 0;
    for (const k of keys) {
      visibleKeys.push(k);
      running += map[k].length;
      if (running >= visibleCount) break;
    }
    return { map, keys, visibleKeys, shownCount: running };
  }, [filtered, groupBy, isFlat, visibleCount]);

  const hasMore = isFlat
    ? visibleCount < shown
    : (groupedSorted?.visibleKeys.length ?? 0) < (groupedSorted?.keys.length ?? 0);

  const renderedCount = isFlat ? visible.length : groupedSorted?.shownCount ?? 0;
  const areaNoun = groupBy === 'county' ? 'county' : 'force';

  const regionOptions = useMemo(() => {
    const set = new Set(stations.map((s) => deriveRegionForStation(s)));
    return [...set].sort((a, b) => a.localeCompare(b, 'en-GB'));
  }, [stations]);

  const tableColumns = useMemo(() => buildStationTableColumns(), []);

  const hasActiveFilters =
    hasArea ||
    custodyOnly ||
    directOnly ||
    Boolean(regionFilter) ||
    custodyFilter !== 'all' ||
    frontCounterFilter !== 'all';

  function selectArea(value: string) {
    setArea(value ? { type: groupBy, value } : ALL_AREAS);
  }

  function changeGroupBy(next: AreaType) {
    setGroupBy(next);
    setArea(ALL_AREAS);
  }

  function clearAll() {
    setQuery('');
    setCustodyOnly(false);
    setDirectOnly(false);
    setRegionFilter('');
    setCustodyFilter('all');
    setFrontCounterFilter('all');
    setArea(ALL_AREAS);
  }

  const filterPanelProps = {
    total,
    shown,
    query: '',
    groupBy,
    area,
    areaIndex,
    areaNoun,
    regionOptions,
    custodyOnly,
    directOnly,
    regionFilter,
    custodyFilter,
    frontCounterFilter,
    sortBy,
    viewMode,
    hasTextQuery: false,
    hasArea,
    onGroupByChange: changeGroupBy,
    onAreaSelect: selectArea,
    onCustodyOnlyChange: setCustodyOnly,
    onDirectOnlyChange: setDirectOnly,
    onRegionFilterChange: setRegionFilter,
    onCustodyFilterChange: setCustodyFilter,
    onFrontCounterFilterChange: setFrontCounterFilter,
    onSortByChange: setSortBy,
    onViewModeChange: setViewMode,
    onClearAll: clearAll,
  };

  if (total === 0) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-8 text-center">
        <p className="text-[var(--muted)]">Station data loading shortly. Check back soon.</p>
      </div>
    );
  }

  return (
    <div id="directory-search" className="space-y-5">
      <div className="sticky top-[var(--site-chrome-offset)] z-20 -mx-[var(--container-gutter)] border-b border-[var(--border)] bg-[var(--background)] px-[var(--container-gutter)] py-3 shadow-sm sm:mx-0 sm:rounded-[var(--radius-lg)] sm:border sm:px-4">
        <StationsSearchBar
          value={query}
          onChange={setQuery}
          resultCount={0}
          onClear={query.trim() ? () => setQuery('') : undefined}
        />
        <p className="mt-2 text-xs text-[var(--muted)]">
          Typing searches one station at a time on the find page — or{' '}
          <button
            type="button"
            className="font-semibold text-[var(--gold-link)] underline"
            onClick={() => router.push('/find-station')}
          >
            open Find a station
          </button>
          .
        </p>
      </div>

      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setMobileFiltersOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-[var(--navy)] shadow-sm"
        >
          Filters &amp; sorting
          {hasActiveFilters ? (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--gold)] text-[10px] font-bold text-[var(--ink)]">
              !
            </span>
          ) : null}
        </button>
      </div>

      <MobileFilterDrawer open={mobileFiltersOpen} onClose={() => setMobileFiltersOpen(false)}>
        <StationsFilterPanel {...filterPanelProps} showViewMode={false} />
      </MobileFilterDrawer>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <aside className="hidden lg:col-span-3 lg:block">
          <div className="sticky top-24">
            <StationsFilterPanel {...filterPanelProps} />
          </div>
        </aside>

        <main id="station-results" className="scroll-mt-station-results lg:col-span-9">
          <StationsResultsGrid
            shown={shown}
            isFlat={isFlat}
            hasArea={hasArea}
            areaValue={hasArea ? area.value : undefined}
            hasTextQuery={false}
            viewMode={viewMode}
            visible={visible}
            groupedSorted={groupedSorted}
            groupBy={groupBy}
            repCountBySlug={repCountBySlug}
            tableColumns={tableColumns}
            hideSingleMatchInGrid={false}
            onClearAll={clearAll}
            hasMore={hasMore}
            renderedCount={renderedCount}
            onLoadMore={() => setVisibleCount((c) => c + PAGE_SIZE)}
          />
        </main>
      </div>
    </div>
  );
}
