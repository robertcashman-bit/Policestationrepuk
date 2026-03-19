import Link from 'next/link';

export function HomeHero({ repCount }: { repCount?: number }) {
  const count = repCount && repCount > 0 ? repCount : 258;
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#1e40af] via-[#1e3a8a] to-[#312e81] py-16 sm:py-20 md:py-28">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_center,_rgba(255,255,255,0.05)_0%,_transparent_70%)]" />

      <div className="page-container relative !py-0">
        <div className="mx-auto max-w-3xl text-center">
          {/* Trust badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm">
            <span className="flex h-4 w-4 items-center justify-center text-xs">☑️</span>
            Trusted by {count}+ Professionals
          </div>

          <h1 className="text-h1 text-white sm:text-5xl md:text-6xl">
            The UK&apos;s Free Directory for{' '}
            <span className="bg-gradient-to-r from-cyan-300 to-cyan-400 bg-clip-text text-transparent">
              Police Station Cover
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-200 sm:text-xl">
            Connecting criminal defence firms and solicitors with accredited police station
            representatives across England &amp; Wales.{' '}
            <strong className="font-bold text-white">100% free</strong> — no fees to join, search, or use. Ever.
          </p>

          <p className="mt-4 text-sm text-slate-300">
            ✓ No subscriptions, no hidden costs — create your free profile in minutes
          </p>

          {/* Green pill badges */}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {['Free to Join', 'Free to Search', 'Free Resources'].map((label) => (
              <span
                key={label}
                className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-300"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-xs text-white">✓</span>
                {label}
              </span>
            ))}
          </div>

          {/* Large CTA buttons */}
          <div className="mt-10 flex flex-col gap-4">
            <Link
              href="/directory"
              className="flex w-full items-center justify-center rounded-xl bg-white px-8 py-5 text-lg font-bold text-[var(--navy)] shadow-lg transition-all hover:bg-slate-50 hover:shadow-xl no-underline"
            >
              🔍 Find a Rep
            </Link>
            <Link
              href="/register"
              className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-8 py-5 text-lg font-bold text-white shadow-lg transition-all hover:from-violet-700 hover:to-purple-700 hover:shadow-xl no-underline"
            >
              Join the Directory (Free)
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
