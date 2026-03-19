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
      data-parity-mask
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border)] bg-white px-5 py-4 shadow-lg"
    >
      <div className="mx-auto flex max-w-[var(--container-max)] flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-[var(--navy)]">Cookies</span>
          <span className="text-sm text-[var(--muted)]">Essential + analytics.</span>
          <Link href="/Cookies" className="text-sm font-medium text-[var(--gold-hover)] no-underline hover:text-[var(--gold)]">
            Details
          </Link>
        </div>
        <div className="flex gap-3">
          <Link
            href="/Cookies"
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--navy)] no-underline transition-colors hover:border-[var(--gold)]"
          >
            Manage
          </Link>
          <button
            onClick={accept}
            className="rounded-lg bg-[var(--navy)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--navy-light)]"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
