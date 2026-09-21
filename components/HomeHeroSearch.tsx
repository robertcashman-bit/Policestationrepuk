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
      className="w-full rounded-2xl border border-white/20 bg-white p-3 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.55)] sm:p-4"
      role="search"
      aria-label="Search police station representatives"
    >
      <p className="mb-2.5 px-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--navy)]/70">
        Search the directory
      </p>
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
          className="min-h-[52px] flex-1 rounded-xl border border-slate-200 bg-white px-4 text-base text-[var(--ink)] outline-none placeholder:text-slate-400 focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/35"
          autoComplete="off"
        />
        <label className="sr-only" htmlFor="home-hero-county">
          County
        </label>
        <select
          id="home-hero-county"
          value={county}
          onChange={(e) => setCounty(e.target.value)}
          className="min-h-[52px] rounded-xl border border-slate-200 bg-white px-3 text-base text-[var(--ink)] outline-none focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/35 sm:w-48"
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
          className="min-h-[52px] w-full shrink-0 rounded-xl bg-[var(--gold)] px-7 text-base font-extrabold text-[var(--navy)] transition-colors hover:bg-[var(--gold-hover)] sm:w-auto sm:px-8"
        >
          Search reps
        </button>
      </div>
    </form>
  );
}
