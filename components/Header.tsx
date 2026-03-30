'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { SITE_URL } from '@/lib/seo-layer/config';
import {
  PRIMARY_NAV,
  HEADER_SHARE_LABEL,
  HEADER_SHARE_LABEL_COPIED,
  HEADER_MOBILE_CTA_HREF,
  HEADER_MOBILE_CTA_TEXT,
  HEADER_HELP_HREF,
  HEADER_LOGIN_HREF,
} from '@/lib/site-navigation';

function NavItem({
  href,
  children,
  className,
  onNavigate,
  external,
}: {
  href: string;
  children: ReactNode;
  className: string;
  onNavigate?: () => void;
  external?: boolean;
}) {
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        onClick={onNavigate}
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className} onClick={onNavigate}>
      {children}
    </Link>
  );
}

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

  const desktopNavLinkClass =
    'inline-flex min-h-[44px] items-center rounded-lg px-2 py-2 text-xs font-bold leading-snug !text-white no-underline transition-colors hover:bg-[var(--navy-light)] hover:!text-[var(--gold)] xl:px-3 xl:text-[13px] 2xl:px-3.5 2xl:text-sm whitespace-nowrap';

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-[var(--navy-light)] bg-[var(--navy)]">
        {/* Wix parity: menu + brand left | centred nav | Help + Log In right (desktop) */}
        <div className="mx-auto flex max-w-[var(--container-max)] items-center justify-between gap-3 px-[var(--container-gutter)] py-2.5 sm:px-6 lg:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-3 lg:flex-initial lg:gap-4">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              className="flex min-h-[44px] shrink-0 items-center gap-2 rounded-lg border-2 border-white/40 bg-[var(--navy-light)] px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:border-[var(--gold)] hover:bg-[var(--navy)] lg:hidden"
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

            <Link
              href="/"
              aria-label="PoliceStationRepUK home"
              className="flex min-w-0 shrink-0 items-center gap-2 no-underline"
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--gold)] text-lg"
                aria-hidden
              >
                ⚖️
              </span>
              <span className="hidden truncate text-sm font-bold tracking-tight text-white sm:inline">PSR UK</span>
            </Link>
          </div>

          <nav
            className="hidden min-w-0 flex-1 flex-wrap items-center justify-center gap-0 lg:flex"
            aria-label="Main navigation"
          >
            {PRIMARY_NAV.map((link) => (
              <NavItem key={`${link.href}-${link.text}`} href={link.href} className={desktopNavLinkClass}>
                {link.text}
              </NavItem>
            ))}
          </nav>

          <div className="hidden shrink-0 items-center gap-3 lg:flex">
            <Link
              href={HEADER_HELP_HREF}
              className="inline-flex min-h-[44px] items-center px-2 text-sm font-medium !text-[var(--header-link)] no-underline transition-colors hover:!text-[var(--header-link-hover)]"
            >
              Help
            </Link>
            <Link
              href={HEADER_LOGIN_HREF}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-[var(--gold)] px-3.5 py-2 text-sm font-bold text-[var(--navy)] shadow-sm no-underline transition-colors hover:bg-[var(--gold-hover)]"
            >
              Log In
              <span aria-hidden className="text-base leading-none">
                →
              </span>
            </Link>
          </div>
        </div>

        {/* Share strip — same CTA as source */}
        <div className="border-t border-[var(--navy-light)] bg-white">
          <div className="mx-auto flex max-w-[var(--container-max)] items-center justify-center gap-2 px-[var(--container-gutter)] py-1.5 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={handleShare}
              className="flex min-h-[44px] items-center gap-2 rounded-lg px-2 text-sm font-medium text-[var(--navy)] transition-colors hover:bg-slate-100 hover:text-[var(--navy)]"
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
                <NavItem
                  key={`${link.href}-${link.text}`}
                  href={link.href}
                  onNavigate={() => setOpen(false)}
                  className="flex min-h-[44px] items-center rounded-lg px-3 py-2.5 text-sm font-medium !text-[var(--header-link)] no-underline transition-colors hover:bg-[var(--navy-light)] hover:!text-[var(--header-link-hover)]"
                >
                  {link.text}
                </NavItem>
              ))}
              <div className="mt-2 grid gap-2 border-t border-[var(--navy-light)] pt-3">
                <Link
                  href={HEADER_HELP_HREF}
                  onClick={() => setOpen(false)}
                  className="flex min-h-[44px] items-center rounded-lg px-3 py-2.5 text-sm font-medium !text-[var(--header-link)] no-underline transition-colors hover:bg-[var(--navy-light)] hover:!text-[var(--header-link-hover)]"
                >
                  Help
                </Link>
                <Link
                  href={HEADER_LOGIN_HREF}
                  onClick={() => setOpen(false)}
                  className="flex min-h-[44px] items-center justify-center rounded-lg bg-white px-3 py-2.5 text-sm font-semibold text-[var(--navy)] no-underline"
                >
                  Log In →
                </Link>
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
