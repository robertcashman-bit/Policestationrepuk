import Link from 'next/link';
import type { County } from '@/lib/types';

interface HomeTopLocationsProps {
  counties: County[];
}

/**
 * Internal links to high-value county directory hubs — strengthens crawl paths from homepage.
 */
export function HomeTopLocations({ counties }: HomeTopLocationsProps) {
  if (counties.length === 0) return null;

  return (
    <section className="border-b border-[var(--border)] bg-white py-10 sm:py-14" aria-labelledby="top-locations-heading">
      <div className="page-container">
        <div className="mx-auto max-w-3xl text-center">
          <h2 id="top-locations-heading" className="text-2xl font-extrabold tracking-tight text-[var(--navy)] sm:text-3xl">
            Browse by area
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)] sm:text-base">
            Find accredited police station representatives by county and region. Each hub lists reps and stations in
            that area — jump in from the homepage in one click.
          </p>
        </div>

        <nav className="mx-auto mt-8 max-w-5xl" aria-label="Popular directory locations">
          <ul className="flex flex-wrap justify-center gap-2 sm:gap-3">
            <li>
              <Link
                href="/directory/counties"
                className="inline-flex items-center rounded-full border border-[var(--gold)]/40 bg-[var(--gold-pale)] px-4 py-2 text-sm font-semibold text-[var(--navy)] no-underline transition-colors hover:border-[var(--gold)] hover:bg-[var(--gold)]/15"
              >
                All counties
              </Link>
            </li>
            {counties.filter((c) => c.slug?.trim()).map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/directory/${c.slug}`}
                  className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-[var(--navy)] no-underline transition-colors hover:border-[var(--gold)]/50 hover:bg-white"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <p className="mx-auto mt-8 max-w-2xl text-center text-xs text-[var(--muted)]">
          <Link href="/directory" className="font-semibold text-[var(--gold-link)] no-underline hover:underline">
            Open the full directory
          </Link>{' '}
          to search by station name, postcode, or availability.
        </p>
      </div>
    </section>
  );
}
