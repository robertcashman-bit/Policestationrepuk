import Link from 'next/link';
import type { Representative } from '@/lib/types';

export function HomeRecentlyJoined({ reps }: { reps: Representative[] }) {
  const recent = reps.slice(-8).reverse();

  return (
    <section className="bg-[var(--background)] py-14 sm:py-16" aria-label="Recently joined feed">
      <div className="page-container !py-0">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[var(--navy)] sm:text-3xl">
            Recently Joined Representatives
          </h2>
          <p className="mt-2 text-[var(--muted)]">
            Real professionals joining our directory daily
          </p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {recent.map((rep) => (
            <Link
              key={rep.id}
              href={`/rep/${rep.slug}`}
              className="flex items-center gap-3 rounded-xl border border-[var(--card-border)] bg-white p-4 shadow-sm no-underline transition-all hover:shadow-md hover:border-[var(--gold)]/40"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--navy)] text-sm font-bold text-white">
                {rep.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--navy)]">{rep.name}</p>
                <p className="truncate text-xs text-[var(--muted)]">{rep.county}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
