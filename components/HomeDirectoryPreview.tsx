import Link from 'next/link';
import type { County, Representative } from '@/lib/types';
import { formatPersonDisplayName } from '@/lib/display-name';
import { initialsFromName } from '@/lib/display-name-initials';

export type CountyEntry = County & { listedRepCount: number };

interface HomeDirectoryPreviewProps {
  counties: CountyEntry[];
  previewReps: Representative[];
  totalReps: number;
}

function RepPreviewCard({ rep }: { rep: Representative }) {
  const displayName = formatPersonDisplayName(rep.name);
  const initials = initialsFromName(displayName);
  const stations = rep.stations || [];

  return (
    <Link
      href={`/rep/${rep.slug}`}
      className="group flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-3 py-3 no-underline backdrop-blur-sm transition-all hover:border-[var(--gold)]/50 hover:bg-white/15"
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--gold)] text-xs font-extrabold text-[var(--navy)]"
        aria-hidden
      >
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-white group-hover:text-[var(--gold)]">
          {displayName}
        </p>
        <p className="mt-0.5 truncate text-xs text-white/70">
          {rep.county?.trim() || 'Coverage on profile'}
          {stations[0] ? ` · ${stations[0]}` : ''}
          {stations.length > 1 ? ` +${stations.length - 1}` : ''}
        </p>
        <p className="mt-1 text-[11px] font-semibold text-[var(--gold)]">
          View profile to instruct →
        </p>
      </div>
    </Link>
  );
}

export function HomeDirectoryPreview({
  counties,
  previewReps,
  totalReps,
}: HomeDirectoryPreviewProps) {
  return (
    <div className="mx-auto mt-8 w-full max-w-5xl">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
          Browse by area
        </p>
        <Link
          href="/directory"
          className="text-xs font-semibold text-[var(--gold)] no-underline hover:underline"
        >
          Open full directory ({totalReps} reps) →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {counties.slice(0, 6).map((c) => (
          <Link
            key={c.slug}
            href={`/directory/${c.slug}`}
            className="rounded-xl border border-white/12 bg-white/8 px-3 py-2.5 no-underline transition-all hover:border-[var(--gold)]/45 hover:bg-white/14"
          >
            <p className="truncate text-sm font-bold text-white">{c.name}</p>
            <p className="mt-0.5 text-[11px] text-white/65">
              {c.listedRepCount > 0
                ? `${c.listedRepCount} listed`
                : 'View listings'}
            </p>
          </Link>
        ))}
      </div>

      {previewReps.length > 0 && (
        <>
          <div className="mb-3 mt-5 flex flex-wrap items-end justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
              Listed representatives
            </p>
            <Link
              href="/Map"
              className="text-xs font-semibold text-white/80 no-underline hover:text-[var(--gold)]"
            >
              Map view →
            </Link>
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {previewReps.slice(0, 3).map((rep) => (
              <RepPreviewCard key={rep.slug} rep={rep} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
