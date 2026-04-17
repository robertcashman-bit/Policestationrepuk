import Link from 'next/link';

/**
 * Compact top strip — one WhatsApp community; links stay tappable on narrow viewports.
 */
export function WhatsAppCommunityBanner() {
  return (
    <div className="relative z-[90] border-b border-emerald-800/30 bg-gradient-to-r from-emerald-950 via-[#0c221c] to-emerald-950">
      <div className="page-container flex min-h-0 flex-col items-stretch gap-1 px-3 py-1 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-x-3 sm:gap-y-0.5 sm:px-4 sm:py-1.5">
        <p className="m-0 min-w-0 text-center text-[10px] leading-tight text-emerald-100/90 sm:max-w-[min(100%,42rem)] sm:text-xs sm:leading-snug">
          <span className="font-semibold text-white">WhatsApp</span>
          <span className="mx-1 text-emerald-600/80 sm:mx-1.5" aria-hidden>
            ·
          </span>
          <span className="hidden min-[400px]:inline">
            Cover &amp; networking for firms &amp; accredited reps.
          </span>
          <span className="min-[400px]:hidden">Firms &amp; reps — cover &amp; networking.</span>
        </p>
        <nav
          className="flex shrink-0 flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-[10px] font-semibold leading-none sm:gap-x-2.5 sm:text-xs"
          aria-label="WhatsApp group and audience pages"
        >
          <Link
            href="/Firms"
            className="whitespace-nowrap text-white underline decoration-emerald-400/50 underline-offset-2 transition-colors hover:text-[var(--gold)] hover:decoration-[var(--gold)]"
          >
            Firms
          </Link>
          <span className="text-emerald-700/80" aria-hidden>
            ·
          </span>
          <Link
            href="/RepsHub"
            className="whitespace-nowrap text-white underline decoration-emerald-400/50 underline-offset-2 transition-colors hover:text-[var(--gold)] hover:decoration-[var(--gold)]"
          >
            Reps
          </Link>
          <span className="text-emerald-700/80" aria-hidden>
            ·
          </span>
          <Link
            href="/WhatsApp"
            className="rounded-full bg-[var(--gold)] px-2 py-0.5 text-[var(--navy)] no-underline transition-colors hover:bg-[var(--gold-hover)] sm:px-2.5 sm:py-1"
          >
            Join
          </Link>
        </nav>
      </div>
    </div>
  );
}
