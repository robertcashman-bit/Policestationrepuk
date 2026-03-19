'use client';

import Link from 'next/link';

const DIRECTORY_LINKS = [
  { href: '/directory', label: 'Find a Rep' },
  { href: '/StationsDirectory', label: 'Police Stations' },
  { href: '/Forces', label: 'Police Forces' },
  { href: '/Firms', label: 'Law Firms' },
  { href: '/Map', label: 'Interactive Map' },
  { href: '/GoFeatured', label: 'Featured Directory' },
];

const REP_LINKS = [
  { href: '/register', label: 'Register as Rep' },
  { href: '/GoFeatured', label: 'Become Featured' },
  { href: '/PoliceStationRepJobsUK', label: 'Rep Jobs UK' },
  { href: '/GetWork', label: 'Get Work Guide' },
  { href: '/HowToBecomePoliceStationRep', label: 'How to Become a Rep' },
  { href: '/PoliceStationCover', label: 'Police Station Cover (Firms)' },
];

const TOOLS_LINKS = [
  { href: '/FormsLibrary', label: 'Forms Library (CRM)' },
  { href: '/PoliceStationRates', label: 'Station Rates (2025/26)' },
  { href: '/PACE', label: 'PACE Codes' },
  { href: '/Wiki', label: 'Rep Wiki' },
  { href: '/LegalUpdates', label: 'Legal Updates' },
  { href: '/Premium', label: 'Training Resources' },
];

const COMMUNITY_LINKS = [
  { href: '/WhatsApp', label: 'WhatsApp Group' },
  { href: '/Forum', label: 'Community Forum' },
  { href: '/Blog', label: 'Read Our Blog' },
  { href: '/Contact', label: 'Contact Us' },
  { href: '/FAQ', label: 'Help & FAQ' },
];

const LEGAL_LINKS = [
  { href: '/About', label: 'About' },
  { href: '/About', label: 'About the PoliceStationRepUK Directory' },
  { href: '/Terms', label: 'Terms' },
  { href: '/Privacy', label: 'Privacy' },
  { href: '/Cookies', label: 'Cookies' },
  { href: '/GDPR', label: 'GDPR' },
  { href: '/DataProtection', label: 'Data Protection' },
  { href: '/Accessibility', label: 'Accessibility' },
  { href: '/Complaints', label: 'Complaints' },
];

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--gold)]">
        {title}
      </h4>
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
    const url = typeof window !== 'undefined' ? window.location.href : 'https://policestationrepuk.com';
    if (navigator.share) {
      try {
        await navigator.share({ title: 'PoliceStationRepUK', url });
      } catch {}
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  return (
    <footer className="mt-auto border-t border-[var(--navy-light)] bg-[var(--navy)]">
      <div className="mx-auto max-w-[var(--container-max)] px-5 py-14 sm:px-6 md:px-8">
        <div className="grid gap-y-10 gap-x-8 sm:grid-cols-2 lg:grid-cols-5">
          <FooterColumn title="Directories" links={DIRECTORY_LINKS} />
          <FooterColumn title="For Representatives" links={REP_LINKS} />
          <FooterColumn title="Tools & Resources" links={TOOLS_LINKS} />
          <FooterColumn title="Community" links={COMMUNITY_LINKS} />
          <FooterColumn title="Legal" links={LEGAL_LINKS} />
        </div>

        {/* Kent spotlight + Resources in footer */}
        <div className="mt-10 grid gap-8 border-t border-[var(--navy-light)] pt-8 sm:grid-cols-2">
          <div>
            <h3 className="text-sm font-bold text-white">Need a Police Station Rep in Kent?</h3>
            <p className="mt-1 text-xs text-slate-400">
              Duty Solicitor • 24/7 Immediate Coverage • All Kent stations
            </p>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Training Guides &amp; Resources</h3>
            <p className="mt-1 text-xs text-slate-400">
              Access training guides, Rep Wiki, and professional resources — all free.
            </p>
          </div>
        </div>

        {/* Regulatory Notice */}
        <div className="mt-8 border-t border-[var(--navy-light)] pt-8">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--gold)]">
            Regulatory Notice
          </h3>
          <p className="mt-3 max-w-4xl text-xs leading-relaxed text-slate-500">
            PoliceStationRepUK.com is a professional directory and information platform. This website
            does not provide legal advice, does not offer regulated legal services, and is not authorised
            or regulated by the Solicitors Regulation Authority (SRA), the Bar Standards Board, or the
            Legal Aid Agency. All representatives listed are self-registered and independently responsible
            for their own accreditation, insurance, and regulatory compliance. Users should verify
            credentials independently before instructing any representative.
          </p>
          <p className="mt-3 text-xs text-slate-500">
            &copy; {year} PoliceStationRepUK. All rights reserved.
          </p>
        </div>

        {/* Bottom actions */}
        <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-[var(--navy-light)] pt-6">
          <button
            onClick={handleShare}
            className="text-xs font-medium text-slate-400 transition-colors hover:text-white"
          >
            Share Directory
          </button>
          <button
            onClick={scrollToTop}
            className="text-xs font-medium text-slate-400 transition-colors hover:text-white"
          >
            Top
          </button>
          <Link href="/sitemap.xml" className="text-xs text-slate-400 no-underline hover:text-white">
            Sitemap
          </Link>
          <Link href="/functions/rss" className="text-xs text-slate-400 no-underline hover:text-white">
            RSS Feed
          </Link>
          <button
            className="text-xs font-medium text-slate-400 transition-colors hover:text-white"
            onClick={() => {
              localStorage.removeItem('cookies-accepted');
              window.location.reload();
            }}
          >
            Cookie Settings
          </button>
        </div>
      </div>
    </footer>
  );
}
