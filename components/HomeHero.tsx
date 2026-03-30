import Link from 'next/link';

const HERO_QUICK_LINKS = [
  { href: '/StationsDirectory', label: '📞 Station Numbers' },
  { href: '/FormsLibrary', label: '📄 Forms' },
  { href: '/Resources', label: '🌐 Resources' },
] as const;

const TRUST_BADGE_COUNT = 258;

export function HomeHero() {
  return (
    <section
      className="hero-gradient-source relative overflow-hidden"
      style={{ paddingTop: 'var(--hero-pad-y)', paddingBottom: 'var(--hero-pad-y)' }}
    >
      <div className="page-container relative !py-0">
        <div className="mx-auto max-w-[var(--hero-max-inner)] text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border-2 border-[var(--gold)] bg-[var(--navy-light)] px-4 py-2.5 text-sm font-bold leading-snug text-white sm:text-base">
            <span className="text-base" aria-hidden>
              ⚖️
            </span>
            Trusted by {TRUST_BADGE_COUNT}+ professionals · Since 2016
          </div>

          <h1 className="text-h1 text-white">
            Police Station Representation{' '}
            <span className="text-[var(--gold)]">Across the UK</span>
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-lg font-medium leading-[1.65] text-white sm:mt-[var(--space-hero-stack-lg)] sm:text-xl sm:leading-[1.65]">
            <strong className="font-extrabold text-[var(--gold)]">24/7 police station reps</strong> &amp;{' '}
            <strong className="text-white">criminal defence support</strong> — free directory connecting{' '}
            <strong className="text-white">solicitor firms</strong> with{' '}
            <strong className="text-white">accredited representatives</strong> in England &amp; Wales.
          </p>

          <div className="mt-4 flex flex-wrap justify-center gap-2.5 sm:gap-3">
            {['Free directory', 'Duty solicitor friendly', 'PACE resources'].map((label) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border-2 border-emerald-900 bg-emerald-900 px-4 py-2 text-sm font-bold text-white sm:px-5 sm:py-2.5 sm:text-base"
              >
                <span aria-hidden>✓</span>
                {label}
              </span>
            ))}
          </div>

          <div className="mt-8 grid w-full max-w-lg grid-cols-1 gap-3 sm:mx-auto sm:max-w-2xl sm:grid-cols-2 sm:gap-3">
            <Link
              href="/directory"
              className="flex min-h-[52px] w-full items-center justify-center rounded-[var(--radius-lg)] bg-white px-4 py-3 text-center text-sm font-extrabold leading-tight text-[var(--navy)] shadow-lg no-underline transition-colors hover:bg-[var(--gold)] sm:text-base"
            >
              Find a rep
            </Link>
            <Link
              href="/StationsDirectory"
              className="flex min-h-[52px] w-full items-center justify-center rounded-[var(--radius-lg)] border-2 border-white bg-transparent px-4 py-3 text-center text-sm font-extrabold leading-tight text-white no-underline transition-colors hover:bg-white/10 sm:text-base"
            >
              Station numbers
            </Link>
          </div>
          <p className="mt-3 text-xs text-white/90 sm:text-sm">
            Nationwide directory — search by county, station, or name. For{' '}
            <Link href="/police-station-rep-kent" className="font-semibold text-[var(--gold)] underline underline-offset-2">
              Kent agency cover
            </Link>
            , phone and WhatsApp are on the Kent section below.
          </p>

          <div className="mt-6 flex flex-col gap-2.5 sm:mt-7 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-3">
            <Link
              href="/search"
              className="flex min-h-[48px] w-full items-center justify-center rounded-[var(--radius-lg)] bg-white/95 px-6 py-3 text-sm font-bold text-[var(--navy)] shadow-md no-underline hover:bg-white sm:w-auto sm:min-w-[200px]"
            >
              Advanced rep search
            </Link>
            <Link
              href="/register"
              className="flex min-h-[48px] w-full items-center justify-center rounded-[var(--radius-lg)] border-2 border-[var(--gold)] px-6 py-3 text-sm font-bold text-[var(--gold)] no-underline hover:bg-[var(--gold)]/10 sm:w-auto sm:min-w-[200px]"
            >
              Join directory (free)
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-2 text-base font-bold sm:mt-7 sm:gap-x-4">
            {HERO_QUICK_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg px-3 py-2 text-white no-underline transition-colors hover:bg-white/10 hover:text-[var(--gold)]"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
