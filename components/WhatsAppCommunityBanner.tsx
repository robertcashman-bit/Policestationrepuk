import Link from 'next/link';

/**
 * Slim top-of-site strip — one WhatsApp community; contextual links for firms vs reps.
 */
export function WhatsAppCommunityBanner() {
  return (
    <div className="relative z-[90] border-b border-emerald-800/35 bg-gradient-to-r from-emerald-950 via-[#0c221c] to-emerald-950">
      <div className="page-container flex flex-col items-center justify-center gap-2 py-2 text-center sm:flex-row sm:flex-wrap sm:gap-x-4 sm:py-2.5">
        <p className="m-0 max-w-3xl text-xs leading-snug text-emerald-100/95 sm:text-sm">
          <span className="font-semibold text-white">Join the WhatsApp group</span>
          {' — '}
          cover requests &amp; networking for criminal defence firms and accredited reps.
        </p>
        <nav
          className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs font-semibold sm:text-sm"
          aria-label="WhatsApp group and audience pages"
        >
          <Link
            href="/Firms"
            className="text-white underline decoration-emerald-400/60 underline-offset-2 transition-colors hover:text-[var(--gold)] hover:decoration-[var(--gold)]"
          >
            Firms
          </Link>
          <span className="text-emerald-600/90" aria-hidden>
            ·
          </span>
          <Link
            href="/RepsHub"
            className="text-white underline decoration-emerald-400/60 underline-offset-2 transition-colors hover:text-[var(--gold)] hover:decoration-[var(--gold)]"
          >
            Reps
          </Link>
          <span className="text-emerald-600/90" aria-hidden>
            ·
          </span>
          <Link
            href="/WhatsApp"
            className="rounded-full bg-[var(--gold)] px-3 py-1 text-[var(--navy)] no-underline transition-colors hover:bg-[var(--gold-hover)]"
          >
            How to join
          </Link>
        </nav>
      </div>
    </div>
  );
}
