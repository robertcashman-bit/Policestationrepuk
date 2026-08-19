import { DirectoryCard } from '@/components/DirectoryCard';
import type { Representative } from '@/lib/types';
import { ROBERT_SLUG } from '@/lib/featured';

const SEED_COUNT = 6;

/**
 * Server-renderable first listings for `/directory` Suspense fallback.
 * Avoids the empty grey skeleton flash while useSearchParams hydrates.
 */
export function DirectorySeededResults({ reps }: { reps: Representative[] }) {
  if (reps.length === 0) {
    return (
      <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-[var(--muted)]">
        Loading directory listings…
      </p>
    );
  }

  const featured = reps
    .filter((r) => r.featured)
    .sort((a, b) => {
      if (a.slug === ROBERT_SLUG && b.slug !== ROBERT_SLUG) return -1;
      if (b.slug === ROBERT_SLUG && a.slug !== ROBERT_SLUG) return 1;
      return a.name.localeCompare(b.name);
    });
  const nonFeatured = reps.filter((r) => !r.featured);
  const seed = [...featured, ...nonFeatured].slice(0, SEED_COUNT);

  return (
    <div className="space-y-5" aria-busy="true" aria-label="Directory listings">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Filters column placeholder — keeps layout stable on lg */}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {seed.map((rep) => (
          <DirectoryCard key={rep.id || rep.slug} rep={rep} />
        ))}
      </div>
      {reps.length > SEED_COUNT && (
        <p className="text-center text-xs text-[var(--muted)]">
          Showing first {SEED_COUNT} of {reps.length} listings — filters loading…
        </p>
      )}
    </div>
  );
}
