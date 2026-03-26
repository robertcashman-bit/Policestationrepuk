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
      className="psr-cookie-bar fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border)] bg-white px-[var(--container-gutter)] py-4 shadow-lg sm:px-6 lg:px-8"
    >
      <div className="mx-auto flex max-w-[var(--container-max)] flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-[var(--navy)]">Cookies</span>
          <span className="text-sm text-[var(--muted)]">Essential + analytics.</span>
          <Link
            href="/Cookies"
            className="inline-flex min-h-[44px] items-center text-sm font-semibold text-[var(--navy)] underline decoration-[var(--navy)]/30 underline-offset-2 hover:decoration-[var(--navy)]"
          >
            Details
          </Link>
        </div>
        <div className="flex gap-3">
          <Link
            href="/Cookies"
            className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--navy)] no-underline transition-colors hover:border-[var(--gold)]"
          >
            Manage
          </Link>
          <button
            type="button"
            onClick={accept}
            className="min-h-[44px] rounded-lg bg-[var(--navy)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--navy-light)]"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
