'use client';

import Link from 'next/link';
import { useState } from 'react';

const NAV_LINKS = [
  { href: '/directory', text: '🔍 Find a Rep' },
  { href: '/StationsDirectory', text: '📞 Stations' },
  { href: '/PoliceStationRepsByCounty', text: 'By County' },
  { href: '/Forces', text: 'Forces' },
  { href: '/Wiki', text: 'Wiki' },
  { href: '/EscapeFeeCalculator', text: 'Fee Calculator' },
  { href: '/Map', text: 'Map' },
  { href: '/Contact', text: 'Contact' },
];

interface HeaderProps {
  navLinks?: { href: string; text: string }[];
}

export function Header({ navLinks }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const links = navLinks?.length ? navLinks.slice(0, 9) : NAV_LINKS;

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--navy-light)] bg-[var(--navy)]">
      <div className="mx-auto flex max-w-[var(--container-max)] items-center justify-between gap-4 px-5 py-3 sm:px-6 md:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 no-underline"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--gold)] text-sm font-black text-[var(--navy)]">
            PSR
          </span>
          <span className="hidden text-base font-bold tracking-tight text-white sm:block">
            PoliceStationRepUK
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Main navigation">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-[13px] font-medium text-slate-300 no-underline transition-colors hover:bg-[var(--navy-light)] hover:text-white"
            >
              {link.text}
            </Link>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-2 lg:flex">
          <Link
            href="/register"
            className="btn-gold !min-h-[40px] !px-5 !py-2 !text-sm"
          >
            Join Free
          </Link>
        </div>

        {/* Mobile: CTA + hamburger */}
        <div className="flex items-center gap-2 lg:hidden">
          <Link
            href="/register"
            className="btn-gold !min-h-[36px] !px-3.5 !py-1.5 !text-xs"
          >
            Join Free
          </Link>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-[var(--navy-light)] hover:text-white"
          >
            {open ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
                <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
                <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="border-t border-[var(--navy-light)] bg-[var(--navy)] lg:hidden">
          <nav className="flex flex-col px-5 py-3" aria-label="Mobile navigation">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="flex min-h-[44px] items-center rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 no-underline transition-colors hover:bg-[var(--navy-light)] hover:text-white"
              >
                {link.text}
              </Link>
            ))}
            <div className="mt-2 border-t border-[var(--navy-light)] pt-3">
              <Link
                href="/register"
                onClick={() => setOpen(false)}
                className="btn-gold w-full !text-sm"
              >
                Join the Directory (Free)
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
