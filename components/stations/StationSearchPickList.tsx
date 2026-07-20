import Link from 'next/link';
import type { PoliceStation } from '@/lib/types';
import { isCustodyStation } from '@/lib/custody-station';

export interface StationSearchPickListProps {
  stations: PoliceStation[];
  query: string;
}

/**
 * Ambiguous text-search results: name/address/force only.
 * Phones live on the station page — not in a multi-station grid.
 */
export function StationSearchPickList({ stations, query }: StationSearchPickListProps) {
  return (
    <div className="space-y-3" aria-label="Choose a station">
      <p className="text-sm font-semibold text-[var(--navy)] sm:text-base">
        {stations.length} station{stations.length === 1 ? '' : 's'} match “{query}” — pick one
      </p>
      <ul className="divide-y divide-[var(--border)] overflow-hidden rounded-2xl border-2 border-[var(--gold)]/50 bg-white shadow-[var(--card-shadow)]">
        {stations.map((station) => {
          const custody = isCustodyStation(station);
          return (
            <li key={station.id}>
              <Link
                href={`/police-station/${station.slug}`}
                className="flex min-h-[56px] flex-col gap-0.5 px-4 py-3.5 no-underline transition-colors hover:bg-[var(--gold-pale)] active:bg-[var(--gold)]/20 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5"
              >
                <span className="min-w-0">
                  <span className="block text-base font-bold text-[var(--navy)] sm:text-lg">
                    {station.name}
                  </span>
                  <span className="mt-0.5 block text-sm text-[var(--muted)]">
                    {[station.postcode, station.forceName || station.county].filter(Boolean).join(' · ')}
                  </span>
                  {station.address ? (
                    <span className="mt-0.5 block truncate text-xs text-[var(--muted)] sm:hidden">
                      {station.address}
                    </span>
                  ) : null}
                </span>
                <span className="mt-1 flex shrink-0 items-center gap-2 sm:mt-0">
                  {custody ? (
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold uppercase text-emerald-800">
                      Custody
                    </span>
                  ) : null}
                  <span className="text-sm font-semibold text-[var(--gold-link)]">
                    Open page →
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-[var(--muted)] sm:text-sm">
        Telephone numbers open on the station page — one station at a time.
      </p>
    </div>
  );
}
