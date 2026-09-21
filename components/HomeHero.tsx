import Link from 'next/link';
import type { Representative } from '@/lib/types';
import { HomeHeroSearch } from '@/components/HomeHeroSearch';
import {
  HomeDirectoryPreview,
  type CountyEntry,
} from '@/components/HomeDirectoryPreview';
import { NotPoliceDeflectBanner } from '@/components/NotPoliceDeflectBanner';
import { InstructRepPrimaryCta } from '@/components/InstructRepPrimaryCta';
import {
  DIRECTORY_FOUNDED_YEAR,
  directoryYearsOperating,
} from '@/lib/directory-trust-copy';

interface HomeHeroProps {
  listedRepCount: number;
  countyNames: string[];
  topCounties: CountyEntry[];
  previewReps: Representative[];
  /** Live station inventory — shown in trust chips when > 0. */
  stationCount?: number;
}

export function HomeHero({
  listedRepCount,
  countyNames,
  topCounties,
  previewReps,
  stationCount = 0,
}: HomeHeroProps) {
  const years = directoryYearsOperating();

  return (
    <section
      className="hero-gradient-source relative overflow-hidden"
      style={{
        paddingTop: 'clamp(2rem, 4.5vw, 3.5rem)',
        paddingBottom: 'clamp(2.25rem, 5vw, 3.75rem)',
      }}
    >
      {/* Soft gold wash — atmospheric depth without clutter */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 55% at 50% -10%, rgba(250,204,21,0.14), transparent 55%), radial-gradient(ellipse 50% 40% at 100% 80%, rgba(255,255,255,0.06), transparent 50%)',
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(255,255,255,0.55) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="hero-rise text-sm font-extrabold tracking-[0.18em] text-[var(--gold)] sm:text-base">
            PoliceStationRepUK
          </p>

          <h1 className="hero-rise hero-rise-delay-1 font-display mt-4 text-[2rem] font-bold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-[3.15rem]">
            The national directory for police station reps
          </h1>

          <p className="hero-rise hero-rise-delay-2 mx-auto mt-4 max-w-2xl text-base leading-relaxed text-white/88 sm:text-lg">
            Free for criminal defence firms across England &amp; Wales. Search accredited
            representatives by name, county, or station — then instruct the rep directly.
          </p>

          <ul
            className="hero-rise hero-rise-delay-3 mt-5 flex flex-wrap items-center justify-center gap-2"
            aria-label="Directory trust signals"
          >
            <li className="trust-chip">
              <span className="trust-chip-dot" aria-hidden />
              Accredited listings only
            </li>
            {listedRepCount > 0 ? (
              <li className="trust-chip">
                <span className="trust-chip-dot" aria-hidden />
                {listedRepCount.toLocaleString('en-GB')} listed reps
              </li>
            ) : null}
            {stationCount > 0 ? (
              <li className="trust-chip">
                <span className="trust-chip-dot" aria-hidden />
                {stationCount.toLocaleString('en-GB')} stations
              </li>
            ) : null}
            <li className="trust-chip">
              <span className="trust-chip-dot" aria-hidden />
              Free since {DIRECTORY_FOUNDED_YEAR} · {years}+ years
            </li>
          </ul>
        </div>

        {/* Search first — Law Society clarity, our navy/gold execution */}
        <div className="hero-rise hero-rise-delay-3 mx-auto mt-7 max-w-2xl">
          <HomeHeroSearch counties={countyNames} />
        </div>

        <div className="hero-rise hero-rise-delay-4 mx-auto mt-5 max-w-2xl">
          <InstructRepPrimaryCta variant="hero" />
        </div>

        <div className="mx-auto mt-4 max-w-2xl">
          <NotPoliceDeflectBanner variant="hero" />
        </div>

        <nav
          className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm"
          aria-label="Quick directory links"
        >
          <Link
            href="/directory"
            className="font-semibold text-white no-underline underline-offset-4 hover:text-[var(--gold)] hover:underline"
          >
            Browse all reps
          </Link>
          <span className="text-white/30" aria-hidden>
            ·
          </span>
          <Link
            href="/find-station"
            className="font-semibold text-white/85 no-underline underline-offset-4 hover:text-[var(--gold)] hover:underline"
          >
            Browse stations
          </Link>
          <span className="text-white/30" aria-hidden>
            ·
          </span>
          <Link
            href="/register"
            className="font-semibold text-white/85 no-underline underline-offset-4 hover:text-[var(--gold)] hover:underline"
          >
            Join free
          </Link>
          <span className="text-white/30" aria-hidden>
            ·
          </span>
          <Link
            href="/HowToBecome"
            className="font-semibold text-white/85 no-underline underline-offset-4 hover:text-[var(--gold)] hover:underline"
          >
            Become a rep
          </Link>
        </nav>

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
