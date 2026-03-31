'use client';

import Link from 'next/link';
import { DirectoryCard, type MatchHighlight } from '@/components/DirectoryCard';
import type { Representative } from '@/lib/types';

interface ResultsGridProps {
  featuredReps: Representative[];
  nonFeaturedReps: Representative[];
  pagedNonFeatured: Representative[];
  hasMore: boolean;
  onLoadMore: () => void;
  sort: string;
  hasActiveFilters: boolean;
  onReset: () => void;
  totalCount: number;
}

function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="mb-3 flex gap-2">
        <div className="h-5 w-14 rounded-full bg-slate-100" />
        <div className="h-5 w-20 rounded-full bg-slate-100" />
      </div>
      <div className="h-6 w-3/4 rounded bg-slate-100" />
      <div className="mt-2 h-4 w-1/2 rounded bg-slate-100" />
      <div className="mt-4 space-y-2">
        <div className="h-3 w-full rounded bg-slate-50" />
        <div className="h-3 w-5/6 rounded bg-slate-50" />
      </div>
      <div className="mt-5 flex gap-2 border-t border-slate-50 pt-4">
        <div className="h-10 flex-1 rounded-lg bg-slate-100" />
        <div className="h-10 flex-1 rounded-lg bg-slate-50" />
      </div>
    </div>
  );
}

export function ResultsGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ResultsGrid({
  featuredReps,
  nonFeaturedReps,
  pagedNonFeatured,
  hasMore,
  onLoadMore,
  sort,
  hasActiveFilters,
  onReset,
  totalCount,
}: ResultsGridProps) {
  if (totalCount === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
          <svg className="h-7 w-7 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </div>
        <p className="text-lg font-bold text-[var(--navy)]">No listings match</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
          {hasActiveFilters
            ? 'Try widening your search or resetting filters to see more results.'
            : 'No representatives are listed for this view yet.'}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {hasActiveFilters && (
            <button type="button" onClick={onReset} className="btn-gold !text-sm">
              Reset filters
            </button>
          )}
          <Link href="/directory/counties" className="btn-outline !text-sm no-underline">
            Browse counties
          </Link>
          <Link href="/register" className="btn-outline !text-sm no-underline">
            Join directory
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Featured */}
      {featuredReps.length > 0 && (
        <section>
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-lg font-bold text-[var(--navy)]">Featured listings</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Promoted placements — firms should run their own checks before instructing.
              </p>
            </div>
            <Link
              href="/GoFeatured"
              className="hidden text-xs font-semibold text-[var(--gold-hover)] no-underline hover:text-[var(--gold)] sm:inline-block"
            >
              Go Featured
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {featuredReps.map((rep, i) => {
              let matchHighlight: MatchHighlight = null;
              if (sort === 'smart' && i < 2) {
                matchHighlight = i === 0 ? 'top' : 'runner';
              }
              return <DirectoryCard key={rep.id} rep={rep} matchHighlight={matchHighlight} />;
            })}
          </div>
        </section>
      )}

      {/* All listings */}
      {pagedNonFeatured.length > 0 && (
        <section>
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-lg font-bold text-[var(--navy)]">
              All listings
              <span className="ml-2 text-sm font-normal text-slate-400">
                {nonFeaturedReps.length}
              </span>
            </h2>
          </div>
          {sort === 'smart' && (
            <p className="mb-3 text-xs text-slate-500">
              Sorted by location match, availability signals, and profile depth.
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            {pagedNonFeatured.map((rep, i) => {
              let matchHighlight: MatchHighlight = null;
              if (sort === 'smart' && i < 3) {
                matchHighlight = i === 0 ? 'top' : 'runner';
              }
              return <DirectoryCard key={rep.id} rep={rep} matchHighlight={matchHighlight} />;
            })}
          </div>
          {hasMore && (
            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={onLoadMore}
                className="btn-outline !min-h-[44px] !px-8 font-semibold"
              >
                Load more ({nonFeaturedReps.length - pagedNonFeatured.length} remaining)
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
