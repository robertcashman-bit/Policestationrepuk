import Link from 'next/link';
import type { PoliceStation } from '@/lib/types';
import { isCustodyStation } from '@/lib/custody-station';

export type StationDirectoryCardVariant = 'browse' | 'search';

export interface StationDirectoryCardProps {
  station: PoliceStation;
  repCount: number;
  variant?: StationDirectoryCardVariant;
  highlight?: boolean;
}

/**
 * Browse cards always link to the station page.
 * Phones are not shown here — only on /police-station/[slug].
 */
export function StationDirectoryCard({
  station,
  repCount: _repCount,
  highlight = false,
}: StationDirectoryCardProps) {
  const custody = isCustodyStation(station);
  const updateHref = `/UpdateStation?station=${encodeURIComponent(station.id)}`;
  const href = `/police-station/${station.slug}`;
  const highlightClass = highlight ? 'ring-2 ring-[var(--gold)] border-[var(--gold)]' : '';

  return (
    <article
      className={`flex flex-col rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] shadow-[var(--card-shadow)] transition-all hover:border-[var(--gold)]/40 hover:shadow-[var(--card-shadow-hover)] ${highlightClass}`}
    >
      <Link href={href} className="group flex flex-1 flex-col p-4 no-underline">
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium text-[var(--navy)] group-hover:text-[var(--gold-link)]">
            {station.name}
          </p>
          {custody ? (
            <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
              Custody
            </span>
          ) : null}
        </div>
        {station.address ? (
          <p className="mt-1 text-xs text-[var(--muted)] line-clamp-2">{station.address}</p>
        ) : null}
        {station.postcode ? (
          <p className="mt-0.5 text-xs text-[var(--muted)]">{station.postcode}</p>
        ) : null}
        {station.forceName || station.county ? (
          <p className="mt-1 text-xs font-medium text-[var(--navy)]/80">
            {station.forceName || station.county}
          </p>
        ) : null}
        <p className="mt-3 text-xs font-semibold text-[var(--gold-link)]">
          View station &amp; numbers →
        </p>
      </Link>
      <div className="border-t border-[var(--card-border)] px-4 py-2.5">
        <Link
          href={updateHref}
          className="text-xs font-semibold text-[var(--gold-link)] no-underline hover:text-[var(--gold)] hover:underline"
        >
          Help us to help you — report number →
        </Link>
      </div>
    </article>
  );
}
