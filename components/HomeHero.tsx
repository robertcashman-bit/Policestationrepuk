import Link from 'next/link';

export function HomeHero({ repCount }: { repCount?: number }) {
  const count = repCount && repCount > 0 ? repCount : 200;
  return (
    <section className="relative overflow-hidden bg-[var(--navy)] py-16 sm:py-20 md:py-28">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--navy)] via-[var(--navy-light)] to-[var(--navy-mid)] opacity-80" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(201,168,76,0.08)_0%,_transparent_60%)]" />

      <div className="page-container relative">
        <div className="mx-auto max-w-4xl text-center">
          {/* Trust badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--gold)]/30 bg-[var(--gold)]/10 px-5 py-2 text-sm font-semibold text-[var(--gold)]">
            <span className="flex h-2 w-2 rounded-full bg-[var(--gold)]" />
            Trusted by {count}+ Legal Professionals
          </div>

          <h1 className="text-h1 text-white sm:text-5xl md:text-6xl">
            The UK&apos;s Free Directory for{' '}
            <span className="text-[var(--gold)]">Police Station Cover</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-300 sm:text-xl">
            Connecting criminal defence firms and solicitors with accredited police station
            representatives across England &amp; Wales.{' '}
            <strong className="font-semibold text-white">100% free</strong> — no fees ever.
          </p>

          {/* Trust badges */}
          <div className="mt-7 flex flex-wrap justify-center gap-6 text-sm font-medium text-slate-300">
            <span className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-xs text-emerald-400">✓</span>
              Free to Join
            </span>
            <span className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-xs text-emerald-400">✓</span>
              Free to Search
            </span>
            <span className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-xs text-emerald-400">✓</span>
              Free Resources
            </span>
          </div>

          {/* Primary CTAs */}
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/directory" className="btn-gold w-full sm:w-auto">
              Find a Representative
            </Link>
            <Link href="/register" className="btn-outline w-full !border-slate-500 !text-white hover:!border-[var(--gold)] hover:!text-[var(--gold)] sm:w-auto">
              Join the Directory (Free)
            </Link>
          </div>

          {/* Quick links row */}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {[
              { href: '/StationsDirectory', icon: '📞', text: 'Station Numbers' },
              { href: '/FormsLibrary', icon: '📄', text: 'Forms' },
              { href: '/Resources', icon: '🌐', text: 'Resources' },
              { href: '/EscapeFeeCalculator', icon: '💷', text: 'Fee Calculator' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--navy-surface)] bg-[var(--navy-light)] px-3.5 py-2 text-sm text-slate-300 no-underline transition-all hover:border-[var(--gold)]/40 hover:text-white"
              >
                <span aria-hidden>{link.icon}</span> {link.text}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
