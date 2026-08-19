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
  const avail = (rep.availability || '').trim();

  return (
    <Link
      href={`/rep/${rep.slug}`}
      className="group flex flex-col rounded-xl border border-white/15 bg-white/10 p-4 no-underline backdrop-blur-sm transition-all hover:border-[var(--gold)]/50 hover:bg-white/15"
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--gold)] text-sm font-extrabold text-[var(--navy)]"
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
          </p>
        </div>
      </div>
      {stations.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {stations.slice(0, 2).map((s) => (
            <span
              key={s}
              className="max-w-full truncate rounded-md bg-black/20 px-2 py-0.5 text-[10px] font-medium text-white/85"
              title={s}
            >
              {s}
            </span>
          ))}
          {stations.length > 2 && (
            <span className="rounded-md bg-black/20 px-2 py-0.5 text-[10px] font-medium text-white/70">
              +{stations.length - 2}
            </span>
          )}
        </div>
      )}
      <p className="mt-3 text-[11px] font-semibold text-[var(--gold)]">
        {avail ? `${avail} · ` : ''}View profile to instruct →
      </p>
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

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {counties.slice(0, 8).map((c) => (
          <Link
            key={c.slug}
            href={`/directory/${c.slug}`}
            className="rounded-xl border border-white/12 bg-white/8 px-3 py-3 no-underline transition-all hover:border-[var(--gold)]/45 hover:bg-white/14"
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
          <div className="mb-3 mt-6 flex flex-wrap items-end justify-between gap-2">
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
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {previewReps.slice(0, 6).map((rep) => (
              <RepPreviewCard key={rep.slug} rep={rep} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
