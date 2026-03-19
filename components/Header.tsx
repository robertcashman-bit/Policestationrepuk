'use client';

import Link from 'next/link';
import { useState } from 'react';
import { SITE_URL } from '@/lib/seo-layer/config';
import {
  PRIMARY_NAV,
  HEADER_SHARE_LABEL,
  HEADER_SHARE_LABEL_COPIED,
  HEADER_MOBILE_CTA_HREF,
  HEADER_MOBILE_CTA_TEXT,
} from '@/lib/site-navigation';

export function Header() {
  const [open, setOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : SITE_URL;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'PoliceStationRepUK', url });
      } catch {
        /* user cancelled */
      }
    } else {
      await navigator.clipboard.writeText(url);
      setShareOpen(true);
      setTimeout(() => setShareOpen(false), 2000);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-[var(--navy-light)] bg-[var(--navy)]">
        <div className="mx-auto flex max-w-[var(--container-max)] items-center justify-between gap-4 px-5 py-3 sm:px-6 md:px-8">
          {/* Brand first (structure matches typical .com header: logo / nav) */}
          <Link
            href="/"
            aria-label="PoliceStationRepUK home"
            className="flex shrink-0 items-center gap-2 no-underline"
          >
            <span
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--gold)] text-lg"
              aria-hidden
            >
              ⚖️
            </span>
          </Link>

          {/* Desktop: primary nav only — 10 items, order & labels from source */}
          <nav
            className="hidden max-w-[calc(100%-4rem)] flex-1 flex-wrap items-center justify-end gap-0.5 lg:flex"
            aria-label="Main navigation"
          >
            {PRIMARY_NAV.map((link) => (
              <Link
                key={`${link.href}-${link.text}`}
                href={link.href}
                className="rounded-lg px-3 py-2 text-[13px] font-medium text-slate-300 no-underline transition-colors hover:bg-[var(--navy-light)] hover:text-white"
              >
                {link.text}
              </Link>
            ))}
          </nav>

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            className="flex items-center gap-2 rounded-lg bg-[var(--gold)] px-4 py-2 text-sm font-bold text-[var(--navy)] transition-colors hover:bg-[var(--gold-hover)] lg:hidden"
          >
            {open ? (
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden>
                <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden>
                <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            )}
            Menu
          </button>
        </div>

        {/* Share strip — same CTA as source */}
        <div className="border-t border-[var(--navy-light)] bg-white">
          <div className="mx-auto flex max-w-[var(--container-max)] items-center justify-center gap-2 px-5 py-2 sm:px-6">
            <button
              type="button"
              onClick={handleShare}
              className="flex items-center gap-2 text-sm font-medium text-[var(--navy)] transition-colors hover:text-[var(--gold-hover)]"
              aria-label={HEADER_SHARE_LABEL}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden
              >
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              {shareOpen ? HEADER_SHARE_LABEL_COPIED : HEADER_SHARE_LABEL}
            </button>
          </div>
        </div>

        {/* Mobile drawer — same links + join CTA as source */}
        {open && (
          <div className="border-t border-[var(--navy-light)] bg-[var(--navy)] lg:hidden">
            <nav className="flex flex-col px-5 py-3" aria-label="Mobile navigation">
              {PRIMARY_NAV.map((link) => (
                <Link
                  key={`${link.href}-${link.text}`}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-[44px] items-center rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 no-underline transition-colors hover:bg-[var(--navy-light)] hover:text-white"
                >
                  {link.text}
                </Link>
              ))}
              <div className="mt-2 border-t border-[var(--navy-light)] pt-3">
                <Link
                  href={HEADER_MOBILE_CTA_HREF}
                  onClick={() => setOpen(false)}
                  className="btn-gold block w-full text-center !text-sm"
                >
                  {HEADER_MOBILE_CTA_TEXT}
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
