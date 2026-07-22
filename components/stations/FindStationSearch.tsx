'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { buildFindStationSearchUrl } from '@/lib/station-directory-links';
import { AnalyticsEvents } from '@/lib/analytics';

export interface FindStationSearchProps {
  initialQuery?: string;
  /** Compact = sticky bar; default = hero-sized field */
  variant?: 'hero' | 'compact';
}

export function FindStationSearch({
  initialQuery = '',
  variant = 'hero',
}: FindStationSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      AnalyticsEvents.directorySearch(`station:${trimmed}`);
    }
    router.push(buildFindStationSearchUrl(trimmed));
  }

  const isHero = variant === 'hero';

  if (!isHero) {
    return (
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="find-station-q" className="sr-only">
          Search for a police station
        </label>
        <input
          id="find-station-q"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Name, town, postcode, or phone"
          autoComplete="off"
          enterKeyHint="search"
          className="min-h-[48px] w-full flex-1 rounded-xl border-2 border-[var(--gold)]/60 bg-white px-4 text-base outline-none focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/30 sm:text-sm"
        />
        <button
          type="submit"
          className="btn-gold !min-h-[48px] w-full !text-sm sm:w-auto sm:shrink-0 sm:px-6"
        >
          Find station
        </button>
      </form>
    );
  }

  // Hero: stacked on phone, single control on sm+
  return (
    <form onSubmit={handleSubmit} className="w-full">
      <label htmlFor="find-station-q" className="sr-only">
        Search for a police station
      </label>
      <div className="flex flex-col overflow-hidden rounded-xl bg-white shadow-[0_12px_40px_-12px_rgba(0,0,0,0.45)] ring-1 ring-black/5 sm:rounded-2xl sm:flex-row sm:items-stretch">
        <div className="relative min-w-0 flex-1">
          <span
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 sm:left-4"
            aria-hidden
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
            </svg>
          </span>
          <input
            id="find-station-q"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name, town, postcode, or phone"
            autoComplete="off"
            enterKeyHint="search"
            className="min-h-[52px] w-full border-0 bg-transparent py-3.5 pl-11 pr-3 text-base text-[var(--navy)] outline-none placeholder:text-slate-400 focus:ring-0 sm:min-h-[60px] sm:py-3 sm:pl-12 sm:pr-4 sm:text-lg"
          />
        </div>
        <button
          type="submit"
          className="min-h-[48px] w-full shrink-0 border-t border-slate-100 bg-[var(--gold)] px-6 text-base font-extrabold text-[var(--navy)] transition-colors hover:bg-[var(--gold-hover)] active:bg-[var(--gold-hover)] sm:min-h-[60px] sm:w-auto sm:border-t-0 sm:px-10"
        >
          Search
        </button>
      </div>
    </form>
  );
}
