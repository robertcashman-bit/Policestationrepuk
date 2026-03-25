import Link from 'next/link';

const HERO_QUICK_LINKS = [
  { href: '/StationsDirectory', label: '📞 Station Numbers' },
  { href: '/FormsLibrary', label: '📄 Forms' },
  { href: '/Resources', label: '🌐 Resources' },
] as const;

/** Hero trust badge uses live marketing figure (page crawl / Wix homepage), not DB counts — avoids parity drift. */
const TRUST_BADGE_COUNT = 258;

export function HomeHero() {
  return (
    <section
      className="hero-gradient-source relative overflow-hidden"
      style={{ paddingTop: 'var(--hero-pad-y)', paddingBottom: 'var(--hero-pad-y)' }}
    >
      <div className="page-container relative !py-0">
        <div className="mx-auto max-w-[var(--hero-max-inner)] text-center">
          {/* Trust badge — solid white/20 so it reads clearly on vivid blue */}
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border-2 border-[var(--gold)] bg-[var(--navy-light)] px-4 py-2.5 text-sm font-bold leading-snug text-white sm:text-base">
            <span className="text-base" aria-hidden>
              📈
            </span>
            Trusted by {TRUST_BADGE_COUNT}+ Professionals
          </div>

          <h1 className="text-h1 text-white">
            The UK&apos;s Free Directory for{' '}
            <span className="text-[var(--gold)]">
              Police Station Cover
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-lg font-medium leading-[1.65] text-white sm:mt-[var(--space-hero-stack-lg)] sm:text-xl sm:leading-[1.65]">
            Connecting criminal defence firms and solicitors with accredited police station
            representatives across England &amp; Wales.{' '}
            <strong className="font-extrabold text-[var(--gold)]">100% free</strong> — no fees to join, search, or use. Ever.
          </p>

          {/* Green pill badges — solid bg so they read on saturated blue */}
          <div className="mt-4 flex flex-wrap justify-center gap-2.5 sm:gap-3">
            {['Free to Join', 'Free to Search', 'Free Resources'].map((label) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border-2 border-emerald-300 bg-emerald-600 px-4 py-2 text-sm font-bold text-white sm:px-5 sm:py-2.5 sm:text-base"
              >
                <span aria-hidden>✓</span>
                {label}
              </span>
            ))}
          </div>

          {/* Large CTA buttons */}
          <div className="mt-8 flex flex-col gap-2.5 sm:mt-9 sm:gap-3">
            <Link
              href="/directory"
              className="flex min-h-[56px] w-full items-center justify-center rounded-[var(--radius-lg)] bg-white px-8 py-4 text-lg font-extrabold leading-tight text-[var(--navy)] shadow-lg transition-colors hover:bg-[var(--gold)] no-underline sm:min-h-[60px] sm:py-5 sm:text-xl"
            >
              Find Police Station Cover Now (24/7)
            </Link>
            <Link
              href="/search"
              className="flex min-h-[56px] w-full items-center justify-center rounded-[var(--radius-lg)] bg-[var(--gold)] px-8 py-4 text-lg font-extrabold leading-tight text-[var(--navy)] shadow-lg transition-colors hover:bg-[var(--gold-hover)] no-underline sm:min-h-[60px] sm:py-5 sm:text-xl"
            >
              Get Immediate Rep Cover
            </Link>
          </div>

          <p className="mt-3.5 text-base font-semibold leading-snug text-white sm:mt-4">
            ✓ No subscriptions for searches — reps can{' '}
            <Link href="/register" className="font-semibold text-[var(--gold)] underline-offset-2 hover:underline">
              join the directory free
            </Link>
          </p>

          {/* In-hero quick links */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-base font-bold sm:mt-7">
            {HERO_QUICK_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-white no-underline transition-colors hover:text-[var(--gold)]"
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
