import Link from 'next/link';

const DIRECTORY_LINKS = [
  { href: '/directory', label: 'Find a Rep' },
  { href: '/StationsDirectory', label: 'Station Numbers' },
  { href: '/PoliceStationRepsByCounty', label: 'Reps by County' },
  { href: '/Map', label: 'Interactive Map' },
  { href: '/Firms', label: 'Law Firms' },
  { href: '/Forces', label: 'Police Forces' },
  { href: '/Blog', label: 'Blog' },
];

const REP_LINKS = [
  { href: '/register', label: 'Register Free' },
  { href: '/CustodyNote', label: 'CustodyNote App' },
  { href: '/GetWork', label: 'Get Work Guide' },
  { href: '/GoFeatured', label: 'Go Featured' },
  { href: '/HowToBecomePoliceStationRep', label: 'How to Become a Rep' },
  { href: '/PoliceStationRates', label: 'Legal Aid Rates 2025/26' },
  { href: '/WhatsApp', label: 'WhatsApp Group' },
];

const TOOLS_LINKS = [
  { href: '/EscapeFeeCalculator', label: 'Escape Fee Calculator' },
  { href: '/Wiki', label: 'Rep Wiki' },
  { href: '/Premium', label: 'Training Guides' },
  { href: '/PACE', label: 'PACE Codes' },
  { href: '/FormsLibrary', label: 'Forms Library' },
  { href: '/Resources', label: 'Resources' },
  { href: '/LegalUpdates', label: 'Legal Updates' },
  { href: '/FAQ', label: 'FAQ' },
  { href: '/Contact', label: 'Contact Us' },
];

const LEGAL_LINKS = [
  { href: '/Privacy', label: 'Privacy Policy' },
  { href: '/Terms', label: 'Terms & Conditions' },
  { href: '/Cookies', label: 'Cookies' },
  { href: '/DataProtection', label: 'Data Protection' },
  { href: '/Accessibility', label: 'Accessibility' },
  { href: '/GDPR', label: 'GDPR' },
  { href: '/Complaints', label: 'Complaints' },
];

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--gold)]">
        {title}
      </h3>
      <ul className="mt-4 space-y-1.5">
        {links.map((link) => (
          <li key={link.href}>
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
  return (
    <footer className="mt-auto border-t border-[var(--navy-light)] bg-[var(--navy)]">
      <div className="mx-auto max-w-[var(--container-max)] px-5 py-14 sm:px-6 md:px-8">
        <div className="grid gap-y-10 gap-x-8 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand block */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--gold)] text-xs font-black text-[var(--navy)]">
                PSR
              </span>
              <span className="text-base font-bold text-white">PoliceStationRepUK</span>
            </div>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-slate-400">
              The UK&apos;s free directory connecting criminal defence firms with accredited police
              station representatives across England &amp; Wales.
            </p>
            <p className="mt-3 max-w-xs text-xs leading-relaxed text-slate-500">
              Operated by Defence Legal Services Ltd. Not affiliated with The Law Society, SRA,
              LCCSA, CLSA, Legal Ombudsman, or any UK police force.
            </p>
            <p className="mt-5 text-xs text-slate-500">
              &copy; {year} PoliceStationRepUK
            </p>
          </div>

          <FooterColumn title="Directory" links={DIRECTORY_LINKS} />
          <FooterColumn title="For Reps" links={REP_LINKS} />
          <FooterColumn title="Tools" links={TOOLS_LINKS} />
          <FooterColumn title="Legal" links={LEGAL_LINKS} />
        </div>

        {/* Regulatory Notice — matches live site footer block */}
        <div className="mt-10 border-t border-[var(--navy-light)] pt-8">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--gold)]">
            Regulatory Notice
          </h3>
          <p className="mt-3 max-w-4xl text-xs leading-relaxed text-slate-500">
            PoliceStationRepUK is operated by Defence Legal Services Ltd — an independent directory
            service. We are <strong className="text-slate-400">not</strong> affiliated with The Law
            Society, SRA, LCCSA, CLSA, the Legal Ombudsman, any UK police force, Border Force, or
            any government body. We do not provide legal advice, access case management systems, or
            influence active cases. The directory exists solely to connect criminal defence solicitors
            with accredited police station representatives across England &amp; Wales.
          </p>
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
            <Link href="/sitemap.xml" className="text-slate-400 no-underline hover:text-white">
              Sitemap
            </Link>
            <Link href="/robots.txt" className="text-slate-400 no-underline hover:text-white">
              Robots
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
