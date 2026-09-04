'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AnalyticsEvents } from '@/lib/analytics';
import { buildFindStationSearchUrl } from '@/lib/station-directory-links';
import type { StationPhonePublicStats } from '@/lib/station-phone-stats-server';

interface HomeStationSearchProps {
  stats: StationPhonePublicStats;
}

export function HomeStationSearch({ stats }: HomeStationSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      AnalyticsEvents.directorySearch(`station:${trimmed}`);
      router.push(buildFindStationSearchUrl(trimmed));
    } else {
      router.push('/find-station');
    }
  };

  return (
    <section className="section-pad border-b border-[var(--border)] bg-slate-50" aria-label="Browse police stations">
      <div className="page-container !py-0">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <h2 className="text-h2 mt-0 text-[var(--navy)]">Browse UK police stations</h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              Search by station, town, or postcode to find representatives covering that suite.
              Not a public police switchboard — call 101 or 999 if you need the police.
            </p>
            <p className="mt-2 text-xs font-semibold text-[var(--navy)]/80">
              {stats.total} stations listed · professional contacts for solicitors &amp; reps
              {stats.verifiedCustodyCount > 0
                ? ` · ${stats.verifiedCustodyCount} verified custody suites`
                : ''}
              {stats.needsHelp > 0 ? ` · ${stats.needsHelp} need your help` : ''}
            </p>
          </div>

          <div className="mt-8 card-surface">
            <h3 className="text-h3 mt-0 text-[var(--navy)]">Search stations</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Opens one station page so you can instruct a covering representative
            </p>
            <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. Canterbury, Medway, SW1…"
                className="min-h-[44px] flex-1 rounded-[var(--radius)] border border-[var(--border)] px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/20"
              />
              <button type="submit" className="btn-gold !min-h-[44px] w-full !text-sm sm:w-auto sm:px-8">
                Find station
              </button>
            </form>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
            <Link href="/find-station" className="btn-gold w-full sm:w-auto">
              Search station numbers
            </Link>
            <Link href="/StationsDirectory" className="btn-outline w-full sm:w-auto">
              Browse all stations
            </Link>
            <Link href="/Forces" className="btn-outline w-full sm:w-auto">
              Browse by force
            </Link>
            <Link href="/UpdateStation" className="btn-outline w-full sm:w-auto">
              Report a number
            </Link>
            <Link href="/contribute-custody-numbers" className="btn-outline w-full sm:w-auto">
              Contribute custody numbers
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
