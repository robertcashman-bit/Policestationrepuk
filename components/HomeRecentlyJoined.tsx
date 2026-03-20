import Link from 'next/link';
import type { Representative } from '@/lib/types';

export function HomeRecentlyJoined({ reps }: { reps: Representative[] }) {
  const recent = reps.slice(-10).reverse();
  const useMarquee = recent.length >= 4;

  const card = (rep: Representative, i: number, ariaHidden: boolean) => (
    <Link
      key={`${rep.slug}-${i}-${ariaHidden ? 'dup' : 'main'}`}
      href={`/rep/${rep.slug}`}
      className="flex w-[min(100%,16rem)] shrink-0 items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-white p-4 shadow-[var(--card-shadow)] no-underline transition-all hover:border-[var(--gold)]/40 hover:shadow-[var(--card-shadow-hover)] sm:w-60"
      aria-hidden={ariaHidden || undefined}
      tabIndex={ariaHidden ? -1 : undefined}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--navy)] text-sm font-bold text-white">
        {rep.name.charAt(0)}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-[var(--navy)]">{rep.name}</p>
        <p className="truncate text-xs text-[var(--muted)]">{rep.county}</p>
      </div>
    </Link>
  );

  return (
    <section className="section-pad group bg-[var(--background)]" aria-label="Recently joined feed">
      <div className="page-container !py-0">
        <div className="text-center">
          <h2 className="text-h2 mt-0 text-[var(--navy)]">
            Recently Joined Representatives
          </h2>
          <p className="mt-2 text-[var(--muted)]">
            Real professionals joining our directory daily
          </p>
        </div>

        <div className="relative mt-8 -mx-5 overflow-hidden px-5 sm:-mx-6 sm:px-6">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-[var(--background)] to-transparent sm:w-16"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-[var(--background)] to-transparent sm:w-16"
          />
          <div className={useMarquee ? 'home-recent-marquee-track py-1' : 'flex flex-wrap justify-center gap-3 py-1'}>
            {useMarquee ? (
              <>
                {recent.map((rep, i) => card(rep, i, false))}
                {recent.map((rep, i) => card(rep, i, true))}
              </>
            ) : (
              recent.map((rep, i) => card(rep, i, false))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
