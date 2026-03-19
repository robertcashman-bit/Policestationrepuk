'use client';

import { useState } from 'react';
import Link from 'next/link';

export function HelpChatButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Open help chat"
        className="fixed bottom-20 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--navy)] text-xl text-white shadow-lg transition-all hover:bg-[var(--navy-light)] hover:shadow-xl"
      >
        💬
      </button>

      {open && (
        <div className="fixed bottom-36 right-5 z-50 w-80 rounded-xl border border-[var(--card-border)] bg-white p-5 shadow-2xl">
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
              href="/Contact"
              className="rounded-lg bg-[var(--navy)] px-4 py-2.5 text-center text-sm font-medium text-white no-underline transition-colors hover:bg-[var(--navy-light)]"
            >
              Contact Us
            </Link>
            <Link
              href="/FAQ"
              className="rounded-lg border border-[var(--border)] px-4 py-2.5 text-center text-sm font-medium text-[var(--navy)] no-underline transition-colors hover:border-[var(--gold)]"
            >
              View FAQ
            </Link>
            <a
              href="tel:01732247427"
              className="rounded-lg border border-[var(--border)] px-4 py-2.5 text-center text-sm font-medium text-[var(--navy)] no-underline transition-colors hover:border-[var(--gold)]"
            >
              📞 (01732) 247427
            </a>
          </div>
        </div>
      )}
    </>
  );
}
