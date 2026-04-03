'use client';

import { useState, useMemo } from 'react';
import { FirmCard } from '@/components/FirmCard';
import type { LawFirm } from '@/lib/types';

interface FirmDirectoryProps {
  firms: LawFirm[];
}

const SORT_OPTIONS = [
  { value: 'name', label: 'Name (A-Z)' },
  { value: 'county', label: 'County (A-Z)' },
];

const PAGE_SIZE = 24;

export function FirmDirectory({ firms }: FirmDirectoryProps) {
  const [query, setQuery] = useState('');
  const [county, setCounty] = useState('');
  const [sort, setSort] = useState('name');
  const [psOnly, setPsOnly] = useState(false);
  const [page, setPage] = useState(1);

  const counties = useMemo(() => {
    const set = new Set(firms.map((f) => f.county));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [firms]);

  const filtered = useMemo(() => {
    let result = [...firms];

    const qRaw = query.trim();
    if (qRaw) {
      const q = qRaw.toLowerCase();
      result = result.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.address.toLowerCase().includes(q) ||
          f.county.toLowerCase().includes(q) ||
          f.specialisms.some((s) => s.toLowerCase().includes(q)),
      );
    }

    if (county) {
      result = result.filter((f) => f.county === county);
    }

    if (psOnly) {
      result = result.filter((f) => f.policeStationWork);
    }

    if (sort === 'county') {
      result.sort((a, b) => a.county.localeCompare(b.county) || a.name.localeCompare(b.name));
    } else {
      result.sort((a, b) => {
        const aPs = a.policeStationWork ? 0 : 1;
        const bPs = b.policeStationWork ? 0 : 1;
        if (aPs !== bPs) return aPs - bPs;
        return a.name.localeCompare(b.name);
      });
    }

    return result;
  }, [firms, query, county, sort, psOnly]);

  const paged = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = paged.length < filtered.length;
  const hasActiveFilters = query.trim() || county || psOnly;

  function resetFilters() {
    setQuery('');
    setCounty('');
    setPsOnly(false);
    setSort('name');
    setPage(1);
  }

  return (
    <div>
      {/* Search & filter bar */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-white p-5 shadow-[var(--card-shadow)] sm:p-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <input
              type="text"
              placeholder="Search by firm name, address, or specialism..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-base text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)] sm:text-sm"
            />
          </div>

          <select
            value={county}
            onChange={(e) => {
              setCounty(e.target.value);
              setPage(1);
            }}
            className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] px-3 py-3 text-base text-[var(--foreground)] sm:text-sm"
          >
            <option value="">All counties</option>
            {counties.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] px-3 py-3 text-base text-[var(--foreground)] sm:text-sm"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={psOnly}
              onChange={(e) => { setPsOnly(e.target.checked); setPage(1); }}
              className="h-4 w-4 rounded border-[var(--border)]"
            />
            <span className="font-medium text-[var(--navy)]">Police station work only</span>
          </label>
        </div>

        {/* Results count & clear */}
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-[var(--muted)]">
            <strong className="font-semibold text-[var(--navy)]">{filtered.length}</strong>{' '}
            firm{filtered.length !== 1 ? 's' : ''} found
          </p>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-sm font-medium text-[var(--gold-link)] transition-colors hover:text-[var(--gold)]"
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
            {paged.map((firm) => (
              <FirmCard key={firm.id} firm={firm} />
            ))}
          </div>

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
          <p className="text-xl font-bold text-[var(--navy)]">No firms found</p>
          <p className="mt-2 text-[var(--muted)]">
            Try adjusting your filters or{' '}
            <button
              onClick={resetFilters}
              className="font-medium text-[var(--gold-link)] hover:text-[var(--gold)]"
            >
              clear all filters
            </button>
            .
          </p>
        </div>
      )}
    </div>
  );
}
