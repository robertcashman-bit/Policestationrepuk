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

  return (
    <form onSubmit={handleSubmit} className={isHero ? 'space-y-3' : 'flex flex-col gap-2 sm:flex-row'}>
      <label htmlFor="find-station-q" className="sr-only">
        Search for a police station
      </label>
      <input
        id="find-station-q"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Station name, town, postcode, or phone…"
        autoComplete="off"
        className={
          isHero
            ? 'min-h-[56px] w-full rounded-2xl border-2 border-[var(--gold)] bg-white px-5 text-base text-[var(--navy)] shadow-md outline-none placeholder:text-slate-400 focus:ring-4 focus:ring-[var(--gold)]/40 sm:text-lg'
            : 'min-h-[48px] flex-1 rounded-xl border-2 border-[var(--gold)]/60 bg-white px-4 text-sm outline-none focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/30'
        }
      />
      <button
        type="submit"
        className={
          isHero
            ? 'btn-gold flex min-h-[56px] w-full items-center justify-center !text-base font-extrabold sm:w-auto sm:px-10'
            : 'btn-gold !min-h-[48px] w-full !text-sm sm:w-auto sm:px-6'
        }
      >
        Find station
      </button>
    </form>
  );
}
