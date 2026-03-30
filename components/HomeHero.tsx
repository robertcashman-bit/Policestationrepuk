import Link from 'next/link';

const HERO_QUICK_LINKS = [
  { href: '/StationsDirectory', label: 'Station Numbers' },
  { href: '/FormsLibrary', label: 'Forms Library' },
  { href: '/Resources', label: 'Resources' },
  { href: '/Wiki', label: 'Rep Wiki' },
] as const;

const TRUST_BADGE_COUNT = 258;

export function HomeHero() {
  return (
    <section
      className="hero-gradient-source relative overflow-hidden"
      style={{ paddingTop: 'var(--hero-pad-y)', paddingBottom: 'var(--hero-pad-y)' }}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--gold)]/40 bg-white/10 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur-sm">
            Trusted by {TRUST_BADGE_COUNT}+ professionals · Free since 2016
          </div>

          <h1 className="text-h1 text-white">
            The UK&apos;s Free Directory of{' '}
            <span className="text-[var(--gold)]">Police Station Representatives</span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-white/90 sm:text-xl">
            Connecting <strong className="text-white">criminal defence firms</strong> with{' '}
            <strong className="text-white">accredited representatives</strong> for police station
            attendance across England &amp; Wales — 24/7, completely free.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {['Free to search', 'Free to join', 'No middleman fees'].map((label) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {label}
              </span>
            ))}
          </div>

          <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/directory"
              className="flex min-h-[52px] items-center justify-center rounded-xl bg-[var(--gold)] px-8 py-3 text-base font-extrabold text-[var(--navy)] shadow-lg no-underline transition-all hover:bg-[var(--gold-hover)] hover:shadow-xl sm:min-w-[200px]"
            >
              Find a Representative
            </Link>
            <Link
              href="/register"
              className="flex min-h-[52px] items-center justify-center rounded-xl border-2 border-white/40 bg-white/10 px-8 py-3 text-base font-bold text-white no-underline backdrop-blur-sm transition-all hover:border-[var(--gold)] hover:bg-white/15 sm:min-w-[200px]"
            >
              Join the Directory
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm">
            {HERO_QUICK_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="inline-flex items-center gap-1 text-white/80 no-underline transition-colors hover:text-[var(--gold)]"
              >
                {label}
                <span aria-hidden className="text-xs">→</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
