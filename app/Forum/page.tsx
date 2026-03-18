import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Community Forum for Police Station Representatives',
  description:
    'Connect with fellow police station representatives, share experiences, and get advice. Join the UK\'s most active community for accredited reps and criminal defence professionals.',
  path: '/Forum',
});

const COMMUNITY_FEATURES = [
  {
    title: 'Urgent Cover Requests',
    desc: 'Solicitor firms post cover requests in real time. Pick up work at police stations near you, often at short notice.',
  },
  {
    title: 'Peer Support & Advice',
    desc: 'Discuss complex cases (anonymised), share strategies, and get guidance from experienced reps across England & Wales.',
  },
  {
    title: 'Legal Updates & News',
    desc: 'Stay informed with the latest changes to PACE, legal aid rates, sentencing guidelines, and criminal justice policy.',
  },
  {
    title: 'Career Development',
    desc: 'Share tips on building your freelance practice, marketing yourself to firms, and advancing your career in criminal defence.',
  },
  {
    title: 'Networking',
    desc: 'Connect with reps and solicitors across the country. Build professional relationships that lead to regular work.',
  },
  {
    title: 'Forms & Resources',
    desc: 'Members share useful templates, checklists, and practical resources for police station attendance work.',
  },
];

export default function ForumPage() {
  return (
    <>
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Community Forum', href: '/Forum' },
            ]}
          />
          <h1 className="mt-3 text-h1 text-white">
            Community Forum for Police Station Representatives
          </h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-slate-300">
            Connect with fellow reps, share experiences, and get advice
          </p>
        </div>
      </section>

      <div className="page-container">

      {/* Main community channel */}
      <section className="mb-14 rounded-[var(--radius-lg)] bg-[var(--navy)] p-8">
        <h2 className="text-h2 mb-4 text-white">
          Our Community Lives on WhatsApp
        </h2>
        <p className="mb-4 text-sm leading-relaxed text-slate-300">
          The PoliceStationRepUK community group on WhatsApp is the primary forum for UK police
          station representatives. It is the most active and responsive channel for professional
          discussion, urgent cover requests, and peer support in the criminal defence sector.
        </p>
        <p className="mb-6 text-sm leading-relaxed text-slate-300">
          Membership is restricted to accredited police station representatives only. You will
          need to provide proof of accreditation (LCCSA or CLSA membership, or Law Society
          accreditation) to join.
        </p>
        <Link
          href="/WhatsApp"
          className="btn-gold inline-flex min-h-[44px] items-center no-underline"
        >
          Join the WhatsApp Group &rarr;
        </Link>
      </section>

      {/* What you get */}
      <section className="mb-14">
        <h2 className="text-h2 mb-8 text-[var(--navy)]">What the Community Offers</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {COMMUNITY_FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]"
            >
              <h3 className="font-semibold text-[var(--navy)]">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Not yet registered */}
      <section className="mb-14 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card-bg)] p-8 shadow-[var(--card-shadow)]">
        <h2 className="text-h2 mb-4 text-[var(--navy)]">Not Yet Registered?</h2>
        <p className="mb-4 text-sm leading-relaxed text-[var(--muted)]">
          If you&apos;re an accredited police station representative but haven&apos;t yet
          registered on our directory, start there. Registration is completely free and gives you
          a public profile that solicitor firms can find when searching for cover.
        </p>
        <Link
          href="/register"
          className="btn-outline inline-flex min-h-[44px] items-center no-underline"
        >
          Register as Rep &rarr;
        </Link>
      </section>

      {/* Related Links */}
      <section>
        <h2 className="text-h2 mb-6 text-[var(--navy)]">Related Resources</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: '/WhatsApp', label: 'WhatsApp Group', desc: 'Join the community' },
            { href: '/directory', label: 'Reps Directory', desc: 'Find accredited reps' },
            { href: '/GetWork', label: 'Get Work Guide', desc: 'Grow your practice' },
            { href: '/LegalUpdates', label: 'Legal Updates', desc: 'Latest news & changes' },
          ].map((link) => (
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
