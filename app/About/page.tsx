import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: "About PoliceStationRepUK — Free Rep Directory Since 2016",
  description:
    "PoliceStationRepUK connects criminal defence firms with accredited police station representatives across England & Wales. Free to join and search — 100% independent directory since 2016.",
  path: '/About',
});

const TIMELINE = [
  {
    year: '2016',
    milestone: 'The Beginning',
    desc: 'PoliceStationRepUK was established with a simple but powerful vision — to create a free, accessible directory connecting criminal defence firms with qualified police station representatives across the UK.',
  },
  {
    year: '2017–2020',
    milestone: 'Growing the Network',
    desc: 'Steady growth as more solicitors and representatives discovered the value of instant connections. We expanded our coverage across England & Wales while maintaining our commitment to free access for all users.',
  },
  {
    year: '2021–2023',
    milestone: 'Digital Innovation',
    desc: 'Introduction of WhatsApp integration, real-time job notifications, and enhanced search capabilities. The platform evolved from a simple directory to a comprehensive legal networking solution.',
  },
  {
    year: '2024',
    milestone: 'Leading the Industry',
    desc: "Today we serve hundreds of legal professionals daily, providing 24/7 access to the UK's most comprehensive network of accredited police station representatives and criminal solicitors.",
  },
];

const VALUES = [
  {
    icon: '✓',
    title: 'Always Free',
    desc: 'We believe professional networking should be accessible to everyone. No fees, no commissions, no hidden costs — ever.',
  },
  {
    icon: '⚖️',
    title: 'Professional Standards',
    desc: 'Every representative is expected to hold the appropriate accreditation. We maintain the highest standards of professional integrity.',
  },
  {
    icon: '🤝',
    title: 'Community First',
    desc: "We're built by legal professionals, for legal professionals. Your success is our success.",
  },
];

const EXPLORE_LINKS = [
  { href: '/directory', label: 'Reps Directory', desc: 'Find accredited reps nationwide' },
  { href: '/StationsDirectory', label: 'Station Contacts', desc: 'UK police station phone numbers' },
  { href: '/FormsLibrary', label: 'Forms Library', desc: 'CRM1, CRM2 & legal aid forms' },
  { href: '/Forces', label: 'Police Forces', desc: 'Browse stations by force' },
];

const STATS = [
  { value: '500+', label: 'Active Members' },
  { value: '24/7', label: 'Always Available' },
  { value: '8+', label: 'Years Operating' },
  { value: '100%', label: 'Free Service' },
];

export default function AboutPage() {
  return (
    <>
      {/* Navy header */}
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'About' },
            ]}
          />
          <h1 className="mt-3 text-h1 text-white">About PoliceStationRepUK</h1>
          <p className="mt-3 max-w-2xl text-lg text-slate-300">
            Connecting the UK legal community since 2016 — building bridges between criminal defence
            firms and accredited representatives.
          </p>
        </div>
      </section>

      <div className="page-container">
        {/* Stats */}
        <div className="mb-14 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 text-center shadow-[var(--card-shadow)]"
          >
            <p className="text-2xl font-extrabold text-[var(--navy)]">{stat.value}</p>
            <p className="mt-1 text-xs text-[var(--muted)]">{stat.label}</p>
          </div>
        ))}
        </div>

        {/* Our Story — timeline */}
        <section className="mb-14">
          <h2 className="text-h2 mb-8 text-[var(--navy)]">Our Story</h2>
        <p className="mb-8 text-[var(--muted)]">
          From a simple directory to the UK&apos;s premier legal networking platform.
        </p>
        <div className="relative space-y-0">
          {TIMELINE.map((item, i) => (
            <div key={item.year} className="relative flex gap-6 pb-10 last:pb-0">
              {/* Vertical line */}
              {i < TIMELINE.length - 1 && (
                <div className="absolute left-[1.1875rem] top-10 h-full w-px bg-[var(--border)]" />
              )}
              {/* Year bubble */}
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-[var(--gold)] bg-[var(--card-bg)] text-xs font-bold text-[var(--gold)]">
                {i + 1}
              </div>
              <div className="pt-1.5">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-sm font-bold text-[var(--gold)]">{item.year}</span>
                  <span className="font-semibold text-[var(--navy)]">{item.milestone}</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* What We Are */}
      <section className="mb-14 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-8 shadow-[var(--card-shadow)]">
        <h2 className="text-h2 mb-4 text-[var(--navy)]">What We Are</h2>
        <p className="mb-2 font-semibold text-[var(--navy)]">
          More than just a directory — we&apos;re a complete professional ecosystem
        </p>
        <h3 className="mt-6 text-base font-semibold text-[var(--navy)]">
          A Free Professional Directory
        </h3>
        <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
          <li className="flex gap-2">
            <span className="mt-0.5 text-emerald-600">✓</span>
            Free directory of freelance police station accredited representatives and criminal solicitors
          </li>
          <li className="flex gap-2">
            <span className="mt-0.5 text-emerald-600">✓</span>
            Helps criminal solicitor practices locate representatives to attend police stations
          </li>
          <li className="flex gap-2">
            <span className="mt-0.5 text-emerald-600">✓</span>
            Completely free to register and consult — 24 hours a day, 7 days a week, 365 days a year
          </li>
          <li className="flex gap-2">
            <span className="mt-0.5 text-emerald-600">✓</span>
            Comprehensive criminal law resource for police station representatives and solicitors
          </li>
        </ul>
      </section>

      {/* Our Values */}
      <section className="mb-14">
        <h2 className="text-h2 mb-6 text-[var(--navy)]">Our Values</h2>
        <p className="mb-8 text-[var(--muted)]">The principles that guide everything we do.</p>
        <div className="grid gap-5 sm:grid-cols-3">
          {VALUES.map((v) => (
            <div
              key={v.title}
              className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)]"
            >
              <div className="mb-3 text-2xl">{v.icon}</div>
              <h3 className="font-semibold text-[var(--navy)]">{v.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mb-14 rounded-[var(--radius-lg)] bg-[var(--navy)] p-8 text-center">
        <h2 className="text-h2 text-white">Join Our Growing Community</h2>
        <p className="mt-3 text-slate-300">
          Be part of the UK&apos;s most trusted network of legal professionals. Register today and
          start connecting with colleagues across England &amp; Wales.
        </p>
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/register"
            className="btn-gold"
          >
            Register as Rep
          </Link>
          <Link
            href="/WhatsApp"
            className="btn-outline !border-slate-500 !text-white hover:!border-[var(--gold)] hover:!text-[var(--gold)]"
          >
            Join WhatsApp Group
          </Link>
        </div>
      </section>

      {/* Explore */}
      <section>
        <h2 className="text-h2 mb-6 text-[var(--navy)]">Explore Our Resources</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {EXPLORE_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 no-underline shadow-[var(--card-shadow)] transition-all hover:border-[var(--gold)]/40 hover:shadow-[var(--card-shadow-hover)]"
            >
              <p className="font-medium text-[var(--navy)]">{link.label}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">{link.desc}</p>
            </Link>
          ))}
        </div>
      </section>
      </div>
    </>
  );
}
