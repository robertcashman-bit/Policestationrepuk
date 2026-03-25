'use client';

import { useState } from 'react';
import Link from 'next/link';

export function HelpChatButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        data-parity-mask
        onClick={() => setOpen((v) => !v)}
        aria-label="Open help chat"
        className="fixed bottom-28 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--navy)] text-xl text-white shadow-lg transition-all hover:bg-[var(--navy-light)] hover:shadow-xl sm:bottom-32 sm:right-5"
      >
        💬
      </button>

      {open && (
        <div
          data-parity-mask
          className="fixed bottom-[8.25rem] right-4 z-[60] w-[min(100vw-2rem,20rem)] rounded-xl border border-[var(--card-border)] bg-white p-5 shadow-2xl sm:right-5"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-[var(--navy)]">Need Help?</h4>
            <button
              onClick={() => setOpen(false)}
              className="text-[var(--muted)] hover:text-[var(--navy)]"
              aria-label="Close help chat"
            >
              ✕
            </button>
          </div>
          <p className="mt-2 text-xs text-[var(--muted)]">
            Get instant answers about registration, finding representatives, or using the directory.
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <Link
              href="/EmergencyCover"
              className="rounded-lg bg-red-600 px-4 py-2.5 text-center text-sm font-bold text-white no-underline transition-colors hover:bg-red-700"
            >
              🚨 Emergency Cover Request
            </Link>
            <Link
              href="/Contact"
              className="rounded-lg bg-[var(--navy)] px-4 py-2.5 text-center text-sm font-medium text-white no-underline transition-colors hover:bg-[var(--navy-light)]"
            >
              Contact Us
            </Link>
            <a
              href="https://wa.me/447535494446?text=Hi%20-%20I%20need%20police%20station%20cover"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-center text-sm font-medium text-emerald-800 no-underline transition-colors hover:bg-emerald-100"
            >
              💬 WhatsApp Us
            </a>
            <a
              href="tel:07535494446"
              className="rounded-lg border border-[var(--border)] px-4 py-2.5 text-center text-sm font-medium text-[var(--navy)] no-underline transition-colors hover:border-[var(--gold)]"
            >
              📞 07535 494446
            </a>
            <Link
              href="/FAQ"
              className="rounded-lg border border-[var(--border)] px-4 py-2.5 text-center text-sm font-medium text-[var(--navy)] no-underline transition-colors hover:border-[var(--gold)]"
            >
              View FAQ
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
