'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem('cookies-accepted');
    if (!accepted) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem('cookies-accepted', 'true');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="psr-cookie-bar fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border)] bg-white px-[var(--container-gutter)] py-2 shadow-lg sm:px-6 sm:py-4 lg:px-8"
    >
      <div className="mx-auto flex max-w-[var(--container-max)] flex-row flex-wrap items-center justify-between gap-2 sm:flex-nowrap sm:gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0 sm:gap-3">
          <span className="text-xs font-bold text-[var(--navy)] sm:text-sm">Cookies</span>
          <span className="hidden text-xs text-[var(--muted)] sm:inline sm:text-sm">
            Essential + analytics.
          </span>
          <Link
            href="/Cookies"
            className="inline-flex min-h-[28px] items-center text-[11px] font-semibold text-[var(--navy)] underline decoration-[var(--navy)]/30 underline-offset-2 hover:decoration-[var(--navy)] sm:min-h-[44px] sm:text-sm"
          >
            Details
          </Link>
        </div>
        <div className="flex shrink-0 gap-1.5 sm:gap-3">
          <Link
            href="/Cookies"
            className="inline-flex min-h-[32px] items-center justify-center rounded-lg border border-[var(--border)] px-2.5 py-1 text-xs font-medium text-[var(--navy)] no-underline transition-colors hover:border-[var(--gold)] sm:min-h-[44px] sm:px-4 sm:py-2 sm:text-sm"
          >
            Manage
          </Link>
          <button
            type="button"
            onClick={accept}
            className="min-h-[32px] rounded-lg bg-[var(--navy)] px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-[var(--navy-light)] sm:min-h-[44px] sm:px-4 sm:py-2 sm:text-sm"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
