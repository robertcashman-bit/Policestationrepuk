import Link from 'next/link';
import type { County } from '@/lib/types';

export type CountyWithCount = County & { listedRepCount?: number };

interface HomeTopLocationsProps {
  counties: CountyWithCount[];
}

/**
 * Visual county entry points — cards with listed counts, not a wall of pills.
 */
export function HomeTopLocations({ counties }: HomeTopLocationsProps) {
  if (counties.length === 0) return null;

  return (
    <section
      className="border-b border-[var(--border)] bg-white py-10 sm:py-12"
      aria-labelledby="top-locations-heading"
    >
      <div className="page-container">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              id="top-locations-heading"
              className="text-2xl font-extrabold tracking-tight text-[var(--navy)] sm:text-3xl"
            >
              Browse by county
            </h2>
            <p className="mt-2 max-w-xl text-sm text-[var(--muted)]">
              Jump to accredited reps covering each area.
            </p>
          </div>
          <Link
            href="/directory/counties"
            className="text-sm font-semibold text-[var(--gold-link)] no-underline hover:underline"
          >
            All counties →
          </Link>
        </div>

        <nav className="mt-6" aria-label="Popular directory locations">
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {counties
              .filter((c) => c.slug?.trim())
              .map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/directory/${c.slug}`}
                    className="flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-4 no-underline transition-all hover:border-[var(--gold)]/50 hover:bg-white hover:shadow-sm"
                  >
                    <span className="text-sm font-bold text-[var(--navy)]">{c.name}</span>
                    <span className="mt-2 text-xs text-[var(--muted)]">
                      {typeof c.listedRepCount === 'number' && c.listedRepCount > 0
                        ? `${c.listedRepCount} listed`
                        : 'Open listings'}
                    </span>
                  </Link>
                </li>
              ))}
          </ul>
        </nav>

        <p className="mt-6 text-center text-xs text-[var(--muted)]">
          <Link
            href="/directory"
            className="font-semibold text-[var(--gold-link)] no-underline hover:underline"
          >
            Open the full directory
          </Link>
          {' · '}
          <Link
            href="/Map"
            className="font-semibold text-[var(--gold-link)] no-underline hover:underline"
          >
            Map of stations
          </Link>
        </p>
      </div>
    </section>
  );
}
