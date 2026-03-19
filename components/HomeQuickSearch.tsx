'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export function HomeQuickSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/directory?q=${encodeURIComponent(query.trim())}`);
    } else {
      router.push('/directory');
    }
  };

  return (
    <section className="bg-[var(--background)] py-14 sm:py-16" aria-label="Search directory call to action">
      <div className="page-container !py-0">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-[var(--navy)] sm:text-3xl">
              Out-of-hours police station cover for solicitors
            </h2>
            <p className="mt-3 text-[var(--muted)]">
              Search our free directory by police station, county, or availability.
              Find qualified reps in seconds, not hours.
            </p>
          </div>

          <div className="mt-8 rounded-xl border border-[var(--card-border)] bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-[var(--navy)]">Quick Rep Search</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Find reps instantly by name, station, or county
            </p>

            <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name..."
                className="flex-1 rounded-lg border border-[var(--border)] px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/20"
              />
              <button type="submit" className="btn-gold !min-h-[44px] !px-6 !text-sm">
                Search Directory
              </button>
            </form>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/directory" className="btn-gold w-full sm:w-auto">
              Search directory
            </Link>
            <Link href="/StationsDirectory" className="btn-outline w-full sm:w-auto">
              Station numbers
            </Link>
            <Link href="/Forces" className="btn-outline w-full sm:w-auto">
              Browse by force
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
