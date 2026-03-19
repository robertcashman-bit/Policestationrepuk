'use client';

import Link from 'next/link';
import { SITE_URL } from '@/lib/seo-layer/config';
import {
  FOOTER_COLUMN_TITLES,
  FOOTER_COMMUNITY,
  FOOTER_DIRECTORIES,
  FOOTER_FOR_REPRESENTATIVES,
  FOOTER_LEGAL,
  FOOTER_REGULATORY_BODY,
  FOOTER_REGULATORY_TITLE,
  FOOTER_SPOTLIGHT_KENT_BODY,
  FOOTER_SPOTLIGHT_KENT_TITLE,
  FOOTER_SPOTLIGHT_TRAINING_BODY,
  FOOTER_SPOTLIGHT_TRAINING_TITLE,
  FOOTER_TOOLS,
  FOOTER_UTILITY_COOKIE_SETTINGS,
  FOOTER_UTILITY_RSS_HREF,
  FOOTER_UTILITY_RSS_LABEL,
  FOOTER_UTILITY_SHARE,
  FOOTER_UTILITY_SITEMAP_HREF,
  FOOTER_UTILITY_SITEMAP_LABEL,
  FOOTER_UTILITY_TOP,
  type FooterLink,
} from '@/lib/site-navigation';

function FooterColumn({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div>
      <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--gold)]">{title}</h4>
      <ul className="mt-4 space-y-1.5">
        {links.map((link, i) => (
          <li key={`${link.href}-${i}`}>
            <Link
              href={link.href}
              className="inline-flex min-h-[32px] items-center text-sm text-slate-400 no-underline transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  const year = new Date().getFullYear();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
    }
  };

  return (
    <footer className="mt-auto border-t border-[var(--navy-light)] bg-[var(--navy)]">
      <div className="mx-auto max-w-[var(--container-max)] px-5 py-14 sm:px-6 md:px-8">
        <div className="grid gap-y-10 gap-x-8 sm:grid-cols-2 lg:grid-cols-5">
          <FooterColumn title={FOOTER_COLUMN_TITLES.directories} links={FOOTER_DIRECTORIES} />
          <FooterColumn
            title={FOOTER_COLUMN_TITLES.forRepresentatives}
            links={FOOTER_FOR_REPRESENTATIVES}
          />
          <FooterColumn title={FOOTER_COLUMN_TITLES.tools} links={FOOTER_TOOLS} />
          <FooterColumn title={FOOTER_COLUMN_TITLES.community} links={FOOTER_COMMUNITY} />
          <FooterColumn title={FOOTER_COLUMN_TITLES.legal} links={FOOTER_LEGAL} />
        </div>

        {/* Mid-footer spotlight — same section titles/copy hierarchy as homepage */}
        <div className="mt-10 grid gap-8 border-t border-[var(--navy-light)] pt-8 sm:grid-cols-2">
          <div>
            <h3 className="text-sm font-bold text-white">{FOOTER_SPOTLIGHT_KENT_TITLE}</h3>
            <p className="mt-1 text-xs text-slate-400">{FOOTER_SPOTLIGHT_KENT_BODY}</p>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">{FOOTER_SPOTLIGHT_TRAINING_TITLE}</h3>
            <p className="mt-1 text-xs text-slate-400">{FOOTER_SPOTLIGHT_TRAINING_BODY}</p>
          </div>
        </div>

        <div className="mt-8 border-t border-[var(--navy-light)] pt-8">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--gold)]">
            {FOOTER_REGULATORY_TITLE}
          </h3>
          <p className="mt-3 max-w-4xl text-xs leading-relaxed text-slate-500">{FOOTER_REGULATORY_BODY}</p>
          <p className="mt-3 text-xs text-slate-500">
            &copy; {year} PoliceStationRepUK. All rights reserved.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-[var(--navy-light)] pt-6">
          <button
            type="button"
            onClick={handleShare}
            className="text-xs font-medium text-slate-400 transition-colors hover:text-white"
          >
            {FOOTER_UTILITY_SHARE}
          </button>
          <button
            type="button"
            onClick={scrollToTop}
            className="text-xs font-medium text-slate-400 transition-colors hover:text-white"
          >
            {FOOTER_UTILITY_TOP}
          </button>
          <Link
            href={FOOTER_UTILITY_SITEMAP_HREF}
            className="text-xs text-slate-400 no-underline hover:text-white"
          >
            {FOOTER_UTILITY_SITEMAP_LABEL}
          </Link>
          <Link href={FOOTER_UTILITY_RSS_HREF} className="text-xs text-slate-400 no-underline hover:text-white">
            {FOOTER_UTILITY_RSS_LABEL}
          </Link>
          <button
            type="button"
            className="text-xs font-medium text-slate-400 transition-colors hover:text-white"
            onClick={() => {
              localStorage.removeItem('cookies-accepted');
              window.location.reload();
            }}
          >
            {FOOTER_UTILITY_COOKIE_SETTINGS}
          </button>
        </div>
      </div>
    </footer>
  );
}
