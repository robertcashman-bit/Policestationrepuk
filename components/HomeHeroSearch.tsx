'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnalyticsEvents } from '@/lib/analytics';

interface HomeHeroSearchProps {
  counties: string[];
}

export function HomeHeroSearch({ counties }: HomeHeroSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [county, setCounty] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (county) params.set('county', county);
    const searchLabel = [query.trim(), county].filter(Boolean).join(' ');
    if (searchLabel) AnalyticsEvents.directorySearch(searchLabel);
    const qs = params.toString();
    router.push(qs ? `/directory?${qs}` : '/directory');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto mt-6 w-full max-w-2xl rounded-xl border border-white/15 bg-white/95 p-3 shadow-xl shadow-black/20 backdrop-blur-sm sm:p-4"
      role="search"
      aria-label="Search police station representatives"
    >
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-stretch">
        <label className="sr-only" htmlFor="home-hero-q">
          Search by name, station, or area
        </label>
        <input
          id="home-hero-q"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Name, station, or area…"
          className="min-h-[48px] flex-1 rounded-lg border border-slate-200 bg-white px-4 text-sm text-[var(--ink)] outline-none placeholder:text-slate-400 focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/30"
          autoComplete="off"
        />
        <label className="sr-only" htmlFor="home-hero-county">
          County
        </label>
        <select
          id="home-hero-county"
          value={county}
          onChange={(e) => setCounty(e.target.value)}
          className="min-h-[48px] rounded-lg border border-slate-200 bg-white px-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/30 sm:w-44"
        >
          <option value="">All counties</option>
          {counties.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="min-h-[48px] shrink-0 rounded-lg bg-[var(--gold)] px-6 text-sm font-extrabold text-[var(--navy)] transition-colors hover:bg-[var(--gold-hover)] sm:px-8"
        >
          Search reps
        </button>
      </div>
    </form>
  );
}
