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
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_0%,_rgba(255,255,255,0.12)_0%,_transparent_55%)]" />

      <div className="page-container relative !py-0">
        <div className="mx-auto max-w-[var(--hero-max-inner)] text-center">
          {/* Trust badge — solid white/20 so it reads clearly on vivid blue */}
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/20 px-4 py-2 text-[0.8125rem] font-semibold leading-snug text-white backdrop-blur-sm sm:text-sm">
            <span className="text-base" aria-hidden>
              📈
            </span>
            Trusted by {TRUST_BADGE_COUNT}+ Professionals
          </div>

          <h1 className="text-h1 text-white">
            The UK&apos;s Free Directory for{' '}
            {/* Gold accent — pops crisply on rich blue, matches brand CTAs */}
            <span className="text-[var(--gold)]">
              Police Station Cover
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-[1.65] text-white sm:mt-[var(--space-hero-stack-lg)] sm:text-[1.0625rem] sm:leading-[1.65]">
            Connecting criminal defence firms and solicitors with accredited police station
            representatives across England &amp; Wales.{' '}
            <strong className="font-bold text-[var(--gold)]">100% free</strong> — no fees to join, search, or use. Ever.
          </p>

          {/* Green pill badges — solid bg so they read on saturated blue */}
          <div className="mt-4 flex flex-wrap justify-center gap-2.5 sm:gap-3">
            {['Free to Join', 'Free to Search', 'Free Resources'].map((label) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border-2 border-emerald-400 bg-emerald-500/35 px-3.5 py-1.5 text-[0.8125rem] font-semibold text-white sm:px-4 sm:py-2 sm:text-sm"
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
              className="flex min-h-[48px] w-full items-center justify-center rounded-[var(--radius-lg)] bg-white px-6 py-3.5 text-[0.9375rem] font-bold leading-tight text-[var(--navy)] shadow-[var(--card-shadow)] transition-colors hover:bg-slate-50 no-underline sm:min-h-[52px] sm:py-4 sm:text-[1rem]"
            >
              🔍 Find a Rep
            </Link>
            <Link
              href="/Register"
              className="flex min-h-[48px] w-full items-center justify-center rounded-[var(--radius-lg)] bg-[var(--gold)] px-6 py-3.5 text-[0.9375rem] font-bold leading-tight text-[var(--ink)] shadow-[var(--card-shadow)] transition-colors hover:bg-[var(--gold-hover)] no-underline sm:min-h-[52px] sm:py-4 sm:text-[1rem]"
            >
              Join the Directory (Free)
            </Link>
          </div>

          <p className="mt-3.5 text-sm leading-snug text-white sm:mt-4">
            ✓ No subscriptions, no hidden costs — create your free profile in minutes
          </p>

          {/* In-hero quick links */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm font-semibold sm:mt-7">
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
