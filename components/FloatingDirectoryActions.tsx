'use client';

import { SITE_URL } from '@/lib/seo-layer/config';
import { FOOTER_UTILITY_SHARE, FOOTER_UTILITY_TOP } from '@/lib/site-navigation';

/**
 * Mirrors live-site floating “Share directory” / “Back to top” affordances
 * (viewport edge stack — footer row keeps sitemap/RSS/cookie links).
 */
export function FloatingDirectoryActions() {
  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : SITE_URL;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'PoliceStationRepUK', url });
      } catch {
        /* dismissed */
      }
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <nav
      data-parity-mask
      aria-label="Share and back to top"
      className="pointer-events-none fixed bottom-28 left-3 z-30 flex flex-col gap-2 sm:bottom-32 sm:left-4"
    >
      <button
        type="button"
        onClick={handleShare}
        className="pointer-events-auto min-h-[44px] min-w-[44px] rounded-lg border border-[var(--navy-light)] bg-white px-3 py-2 text-left text-xs font-semibold leading-snug text-[var(--navy)] shadow-md transition-colors hover:bg-[var(--gold-pale)]"
      >
        {FOOTER_UTILITY_SHARE}
      </button>
      <button
        type="button"
        onClick={scrollToTop}
        className="pointer-events-auto min-h-[44px] min-w-[44px] rounded-lg border border-[var(--navy-light)] bg-[var(--navy)] px-3 py-2 text-left text-xs font-semibold leading-snug text-white shadow-md transition-colors hover:bg-[var(--navy-light)]"
      >
        {FOOTER_UTILITY_TOP}
      </button>
    </nav>
  );
}
