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
    <div className="space-y-4" aria-label="Choose a station">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-[var(--navy)] sm:text-xl">
            {stations.length} match{stations.length === 1 ? '' : 'es'}
          </h2>
          <p className="text-sm text-[var(--muted)]">
            for “{query}” — open one station for Call &amp; Copy numbers
          </p>
        </div>
      </div>
      <ul className="overflow-hidden rounded-2xl border border-[var(--card-border)] bg-white shadow-sm">
        {stations.map((station, index) => {
          const custody = isCustodyStation(station);
          const place = [station.postcode, station.forceName || station.county]
            .filter(Boolean)
            .join(' · ');
          return (
            <li
              key={station.id}
              className={index > 0 ? 'border-t border-[var(--border)]' : undefined}
            >
              <Link
                href={`/police-station/${station.slug}`}
                className="flex min-h-[56px] items-start gap-3 px-3 py-3.5 no-underline transition-colors hover:bg-slate-50 active:bg-[var(--gold-pale)] sm:min-h-[64px] sm:items-center sm:gap-4 sm:px-5 sm:py-4"
              >
                <span
                  className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--navy)]/5 text-[var(--navy)] sm:h-10 sm:w-10"
                  aria-hidden
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 21s7-4.5 7-11a7 7 0 10-14 0c0 6.5 7 11 7 11z" />
                    <circle cx="12" cy="10" r="2.5" />
                  </svg>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-[15px] font-bold leading-snug text-[var(--navy)] sm:text-lg">
                      {station.name}
                    </span>
                    {custody ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-800">
                        Custody
                      </span>
                    ) : null}
                  </span>
                  {place ? (
                    <span className="mt-0.5 block text-sm text-[var(--muted)]">{place}</span>
                  ) : null}
                  {station.address ? (
                    <span className="mt-0.5 block text-xs leading-snug text-[var(--muted)] line-clamp-2 sm:truncate sm:leading-normal">
                      {station.address}
                    </span>
                  ) : null}
                </span>
                <span className="shrink-0 self-center text-sm font-bold text-[var(--gold-link)]" aria-hidden>
                  →
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      <p className="text-center text-xs text-[var(--muted)] sm:text-sm">
        Numbers are on each station page — one station at a time.
      </p>
    </div>
  );
}
