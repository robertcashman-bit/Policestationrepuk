import Link from 'next/link';

/**
 * Compact top strip — one WhatsApp community; links stay tappable on narrow viewports.
 */
export function WhatsAppCommunityBanner() {
  return (
    <div className="relative z-[90] border-b border-emerald-800/30 bg-gradient-to-r from-emerald-950 via-[#0c221c] to-emerald-950">
      {/* Do not use `page-container` here — it adds ~2.5–3rem vertical padding site-wide. */}
      <div className="mx-auto flex min-h-0 w-full max-w-[var(--container-max)] flex-col items-center justify-center gap-x-2 gap-y-0 px-[var(--container-gutter)] py-0.5 sm:flex-row sm:flex-wrap sm:gap-x-3 sm:px-6 sm:py-1 lg:px-8">
        <p className="m-0 min-w-0 text-center text-[10px] leading-none text-emerald-100/90 sm:max-w-[min(100%,42rem)] sm:text-[11px]">
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
          className="flex shrink-0 flex-wrap items-center justify-center gap-x-2 gap-y-0 text-[10px] font-semibold leading-none sm:gap-x-2.5 sm:text-[11px]"
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
            className="rounded-full bg-[var(--gold)] px-2 py-px text-[var(--navy)] no-underline transition-colors hover:bg-[var(--gold-hover)] sm:px-2.5 sm:py-0.5"
          >
            Join
          </Link>
        </nav>
      </div>
    </div>
  );
}
