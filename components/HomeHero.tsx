import Link from 'next/link';
import type { Representative } from '@/lib/types';
import { HomeHeroSearch } from '@/components/HomeHeroSearch';
import {
  HomeDirectoryPreview,
  type CountyEntry,
} from '@/components/HomeDirectoryPreview';
import { NotPoliceDeflectBanner } from '@/components/NotPoliceDeflectBanner';
import { InstructRepPrimaryCta } from '@/components/InstructRepPrimaryCta';

interface HomeHeroProps {
  listedRepCount: number;
  countyNames: string[];
  topCounties: CountyEntry[];
  previewReps: Representative[];
}

export function HomeHero({
  listedRepCount,
  countyNames,
  topCounties,
  previewReps,
}: HomeHeroProps) {
  const trustLabel =
    listedRepCount > 0
      ? `${listedRepCount} listed reps · Free directory since 2016`
      : 'Free UK directory since 2016';

  return (
    <section
      className="hero-gradient-source relative overflow-hidden"
      style={{ paddingTop: 'clamp(1.5rem, 3vw, 2.5rem)', paddingBottom: 'clamp(1.75rem, 4vw, 3rem)' }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
        aria-hidden
      />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--gold)]">
            PoliceStationRepUK
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
            Police station rep directory
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
            Free UK directory of accredited representatives for criminal defence firms.
            Search by name, county, or station — instruct the rep directly.
          </p>
          <p className="mt-2 text-xs font-semibold text-white/65">{trustLabel}</p>
        </div>

        <div className="mx-auto mt-5 max-w-2xl">
          <InstructRepPrimaryCta variant="hero" />
        </div>

        <div className="mx-auto mt-4 max-w-2xl">
          <NotPoliceDeflectBanner variant="hero" />
        </div>

        <HomeHeroSearch counties={countyNames} />

        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm">
          <Link
            href="/directory"
            className="font-semibold text-white no-underline hover:text-[var(--gold)]"
          >
            Browse all reps
          </Link>
          <span className="text-white/30" aria-hidden>
            ·
          </span>
          <Link
            href="/find-station"
            className="font-semibold text-white/80 no-underline hover:text-[var(--gold)]"
          >
            Browse stations
          </Link>
          <span className="text-white/30" aria-hidden>
            ·
          </span>
          <Link
            href="/register"
            className="font-semibold text-white/80 no-underline hover:text-[var(--gold)]"
          >
            Join free
          </Link>
        </div>

        <HomeDirectoryPreview
          counties={topCounties}
          previewReps={previewReps}
          totalReps={listedRepCount}
        />
      </div>
    </section>
  );
}

/** Re-export for callers that build county entries. */
export type { CountyEntry };
