'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useEffect, useId, useRef, useState } from 'react';
import { SITE_URL } from '@/lib/seo-layer/config';
import { shouldCompactHeader } from '@/lib/promo-banner-scroll';
import {
  HEADER_NAV_BLOG_LINKS,
  HEADER_NAV_DROPDOWNS,
  HEADER_NAV_PRIMARY,
  HEADER_SHARE_LABEL,
  HEADER_SHARE_LABEL_COPIED,
  HEADER_MOBILE_CTA_HREF,
  HEADER_MOBILE_CTA_TEXT,
  HEADER_HELP_HREF,
  HEADER_LOGIN_HREF,
  type HeaderNavLink,
} from '@/lib/site-navigation';
import { HeaderAskAiButton } from '@/components/assistant/HeaderAskAiButton';

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
      className={className}
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

function Chevron({ open }: { open?: boolean }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      aria-hidden
      className={`ml-1 shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
    >
      <path
        d="M2.5 4L5 6.5L7.5 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function isFeaturedNav(href: string, text: string) {
  const h = href.toLowerCase();
  const t = text.toLowerCase();
  return (
    h.includes('custodynote') ||
    t.includes('custody note') ||
    h.includes('whyget') ||
    t.includes('why get accredited')
  );
}

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

function NavDropdown({
  label,
  links,
  linkClass,
  active,
  wide,
  labelHref,
}: {
  label: string;
  links: HeaderNavLink[];
  linkClass: string;
  active?: boolean;
  wide?: boolean;
  labelHref?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ignoreToggleRef = useRef(false);
  const panelId = useId();

  const clearClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const scheduleClose = () => {
    clearClose();
    ignoreToggleRef.current = false;
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  };

  const openFromHover = () => {
    clearClose();
    // Mouseenter often precedes click in Playwright; skip the toggle-close that would follow.
    ignoreToggleRef.current = true;
    setOpen(true);
  };

  const onTriggerClick = () => {
    clearClose();
    if (ignoreToggleRef.current) {
      ignoreToggleRef.current = false;
      setOpen(true);
      return;
    }
    setOpen((v) => !v);
  };

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => () => clearClose(), []);

  const activeClass =
    open || active ? '!bg-[var(--navy-light)] ring-1 ring-[var(--gold)]/40' : '';
  const activeText = active && !open ? '!text-[var(--gold)]' : '';

  return (
    <div
      ref={ref}
      className="relative shrink-0"
      onMouseEnter={openFromHover}
      onMouseLeave={scheduleClose}
    >
      {labelHref ? (
        <div className={`inline-flex items-stretch rounded-lg ${activeClass}`}>
          <Link
            href={labelHref}
            className={`${linkClass} rounded-r-none !ring-0 ${activeText}`}
            onClick={() => setOpen(false)}
          >
            {label}
          </Link>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTriggerClick();
            }}
            className={`${linkClass} rounded-l-none border-l border-white/15 px-1.5 !ring-0 ${activeText}`}
            aria-expanded={open}
            aria-haspopup="true"
            aria-controls={panelId}
            aria-label={`${label} menu`}
          >
            <Chevron open={open} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onTriggerClick}
          className={`${linkClass} ${activeClass} ${activeText}`}
          aria-expanded={open}
          aria-haspopup="true"
          aria-controls={panelId}
        >
          {label}
          <Chevron open={open} />
        </button>
      )}
      {open && (
        <div
          id={panelId}
          role="menu"
          className={`absolute left-0 top-full z-[200] mt-1.5 max-h-[min(70vh,28rem)] overflow-y-auto rounded-xl border border-white/10 bg-[var(--navy)] py-2 shadow-2xl shadow-black/40 ring-1 ring-[var(--gold)]/20 ${
            wide ? 'min-w-[18rem] sm:min-w-[22rem]' : 'min-w-[15rem] sm:min-w-[17rem]'
          }`}
        >
          <p className="px-4 pb-1.5 pt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--gold)]/85">
            {label}
          </p>
          {links.map((link) => {
            const featured = isFeaturedNav(link.href, link.text);
            return (
              <NavItem
                key={`${link.href}-${link.text}`}
                href={link.href}
                external={link.external ?? link.href.startsWith('http')}
                onNavigate={() => setOpen(false)}
                className={`flex min-h-[44px] items-center px-4 py-2.5 text-sm no-underline transition-colors hover:bg-[var(--navy-light)] hover:!text-[var(--gold)] ${
                  featured ? 'font-semibold !text-[var(--gold)]' : 'font-medium !text-white'
                }`}
              >
                {link.text}
              </NavItem>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MobileAccordion({
  label,
  links,
  onNavigate,
  linkClass,
}: {
  label: string;
  links: HeaderNavLink[];
  onNavigate: () => void;
  linkClass: string;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div className="border-t border-white/10">
      <button
        type="button"
        className="flex min-h-[52px] w-full items-center justify-between gap-3 py-2 text-left text-sm font-bold uppercase tracking-wide text-white/75"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{label}</span>
        <Chevron open={open} />
      </button>
      {open && (
        <div id={panelId} className="space-y-0.5 pb-3">
          {links.map((link) => (
            <NavItem
              key={`m-${label}-${link.href}-${link.text}`}
              href={link.href}
              external={link.external ?? link.href.startsWith('http')}
              onNavigate={onNavigate}
              className={`${linkClass} ${
                isFeaturedNav(link.href, link.text) ? '!text-[var(--gold)]' : ''
              }`}
            >
              {link.text}
            </NavItem>
          ))}
        </div>
      )}
    </div>
  );
}

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [compact, setCompact] = useState(false);
  const mobileDropdowns = HEADER_NAV_DROPDOWNS.filter((group) => group.label !== 'Blog');

  useEffect(() => {
    const onScroll = () => {
      setCompact((prev) => shouldCompactHeader(window.scrollY, prev));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

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
    'inline-flex shrink-0 min-h-[2.5rem] items-center whitespace-nowrap rounded-lg px-2.5 py-1.5 text-sm font-semibold leading-snug !text-white no-underline transition-colors hover:bg-[var(--navy-light)] hover:!text-[var(--gold)]';

  const navLinkClass = (href: string, text: string, prefix = false) => {
    const active =
      href === '/'
        ? pathname === '/'
        : prefix
          ? pathname === href || pathname.startsWith(`${href}/`)
          : pathname === href;
    const featured = isFeaturedNav(href, text);
    if (active) {
      return `${desktopNavLinkClass} !bg-[var(--navy-light)] ring-1 ring-[var(--gold)]/45 !text-[var(--gold)]`;
    }
    if (featured) {
      return `${desktopNavLinkClass} border border-[var(--gold)]/45 bg-[var(--gold)]/10 !text-[var(--gold)] hover:bg-[var(--gold)]/20`;
    }
    return desktopNavLinkClass;
  };

  const isBlogActive = pathname === '/Blog' || pathname.startsWith('/Blog/');

  const drawerLinkClass =
    'flex min-h-[48px] items-center rounded-xl px-3 py-2.5 text-base font-medium !text-white no-underline transition-colors hover:bg-[var(--navy-light)] hover:!text-[var(--gold)]';

  const closeMenu = () => setOpen(false);

  const featuredPrimary = HEADER_NAV_PRIMARY.filter((l) => isFeaturedNav(l.href, l.text));
  const standardPrimary = HEADER_NAV_PRIMARY.filter((l) => !isFeaturedNav(l.href, l.text));

  return (
    <header
      className={`site-header relative z-40 border-b border-[var(--navy-light)] bg-[var(--navy)] shadow-lg ${
        compact ? 'header-compact' : ''
      }`}
    >
      {/* One clean bar: brand · nav · utilities */}
      <div className="header-row mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5 sm:px-6 lg:gap-4 lg:px-8">
        <div className="flex min-w-0 items-center gap-2.5">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--navy-light)] text-white transition-colors hover:ring-1 hover:ring-[var(--gold)]/50 lg:hidden"
          >
            {open ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
                <path
                  d="M5 5l10 10M15 5L5 15"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
                <path
                  d="M3 5h14M3 10h14M3 15h14"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </button>

          <Link
            href="/"
            aria-label="PoliceStationRepUK home"
            className="flex min-w-0 shrink-0 items-center gap-2.5 no-underline"
          >
            <span
              className="header-logo-mark flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--gold)] text-base font-bold text-[var(--navy)] shadow-sm"
              aria-hidden
            >
              ⚖️
            </span>
            <span className="header-site-name truncate text-base font-bold tracking-tight text-white sm:text-lg">
              PoliceStationRep<span className="text-[var(--gold)]">UK</span>
            </span>
          </Link>
        </div>

        <nav
          className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 xl:gap-1 lg:flex"
          aria-label="Main navigation"
        >
          {HEADER_NAV_PRIMARY.map((link) => (
            <NavItem
              key={`${link.href}-${link.text}`}
              href={link.href}
              className={navLinkClass(link.href, link.text, link.href === '/directory')}
              external={link.external ?? link.href.startsWith('http')}
            >
              {link.text}
            </NavItem>
          ))}
          {HEADER_NAV_DROPDOWNS.map((group) => (
            <NavDropdown
              key={group.label}
              label={group.label}
              links={group.links}
              linkClass={desktopNavLinkClass}
              labelHref={group.labelHref}
              active={group.label === 'Blog' ? isBlogActive : undefined}
              wide={
                group.label === 'More' ||
                group.label === 'For Reps' ||
                group.label === 'Guides'
              }
            />
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="psr-share-mini inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white/90 transition-colors hover:bg-[var(--navy-light)] hover:text-[var(--gold)] xl:h-auto xl:w-auto xl:gap-1.5 xl:px-2.5 xl:py-1.5"
            aria-label={shareOpen ? HEADER_SHARE_LABEL_COPIED : HEADER_SHARE_LABEL}
            title={shareOpen ? HEADER_SHARE_LABEL_COPIED : HEADER_SHARE_LABEL}
          >
            <ShareIcon />
            <span className="hidden text-xs font-medium xl:inline">
              {shareOpen ? 'Copied!' : 'Share'}
            </span>
          </button>
          <HeaderAskAiButton className="hidden min-h-[2.5rem] shrink-0 items-center rounded-xl border border-white/35 bg-[var(--navy-light)] px-3 text-sm font-semibold !text-white no-underline transition-colors hover:border-[var(--gold)] hover:bg-[var(--navy-mid)] lg:inline-flex" />
          <Link
            href={HEADER_HELP_HREF}
            className="hidden min-h-[2.5rem] shrink-0 items-center px-2 text-sm font-medium !text-white/80 no-underline transition-colors hover:!text-[var(--gold)] xl:inline-flex"
          >
            Help
          </Link>
          <Link
            href={HEADER_LOGIN_HREF}
            className="inline-flex h-10 min-h-[2.5rem] shrink-0 items-center gap-1 rounded-xl bg-[var(--gold)] px-3 text-sm font-bold text-[var(--navy)] shadow-sm no-underline transition-colors hover:bg-[var(--gold-hover)] sm:px-3.5"
          >
            Log In
            <span aria-hidden className="text-sm leading-none">
              →
            </span>
          </Link>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/55 lg:hidden"
            aria-label="Close menu overlay"
            onClick={closeMenu}
          />
          <div className="absolute inset-x-0 top-full z-50 max-h-[min(88vh,40rem)] overflow-y-auto border-t border-[var(--gold)]/30 bg-[var(--navy)] shadow-2xl lg:hidden">
            <nav className="flex flex-col px-4 pb-6 pt-4 sm:px-5" aria-label="Mobile navigation">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--gold)]">
                Menu
              </p>

              <div className="mb-4 grid gap-2">
                {featuredPrimary.map((link) => (
                  <NavItem
                    key={`feat-${link.href}`}
                    href={link.href}
                    external={link.external ?? link.href.startsWith('http')}
                    onNavigate={closeMenu}
                    className="flex min-h-[52px] items-center justify-between rounded-xl border border-[var(--gold)]/40 bg-[var(--gold)]/10 px-4 text-base font-bold !text-[var(--gold)] no-underline"
                  >
                    <span>{link.text}</span>
                    <span aria-hidden>→</span>
                  </NavItem>
                ))}
              </div>

              {standardPrimary.length > 0 && (
                <>
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-white/45">
                    Directory
                  </p>
                  {standardPrimary.map((link) => (
                    <NavItem
                      key={`std-${link.href}`}
                      href={link.href}
                      external={link.external ?? link.href.startsWith('http')}
                      onNavigate={closeMenu}
                      className={drawerLinkClass}
                    >
                      {link.text}
                    </NavItem>
                  ))}
                </>
              )}

              <MobileAccordion
                label="Blog"
                links={HEADER_NAV_BLOG_LINKS}
                onNavigate={closeMenu}
                linkClass={drawerLinkClass}
              />

              {mobileDropdowns.map((group) => (
                <MobileAccordion
                  key={group.label}
                  label={group.label}
                  links={group.links}
                  onNavigate={closeMenu}
                  linkClass={drawerLinkClass}
                />
              ))}

              <div className="sticky bottom-0 mt-4 grid gap-2 border-t border-white/10 bg-[var(--navy)] pt-4">
                <HeaderAskAiButton
                  onNavigate={closeMenu}
                  className="flex min-h-[48px] w-full items-center justify-center rounded-xl border border-white/30 bg-[var(--navy-light)] text-sm font-semibold !text-white"
                />
                <Link href={HEADER_HELP_HREF} onClick={closeMenu} className={drawerLinkClass}>
                  Help
                </Link>
                <Link
                  href={HEADER_MOBILE_CTA_HREF}
                  onClick={closeMenu}
                  className="flex min-h-[52px] w-full items-center justify-center rounded-xl bg-[var(--gold)] text-base font-extrabold text-[var(--navy)] no-underline shadow-md"
                >
                  {HEADER_MOBILE_CTA_TEXT}
                </Link>
              </div>
            </nav>
          </div>
        </>
      )}
    </header>
  );
}
