import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'WhatsApp Group for Police Station Reps',
  description:
    'Join the Police Station Reps WhatsApp Group — instant job notifications, direct communication with solicitor firms, and real-time cover requests. Free to join for accredited reps.',
  path: '/WhatsApp',
});

const FEATURES = [
  {
    icon: '🔒',
    title: 'Closed Group — Accredited Reps Only',
    desc: 'This is a professional, closed group. You must provide proof of accreditation (PSRAS, LCCSA, or CLSA membership) before being admitted. This keeps the group trusted and relevant.',
  },
  {
    icon: '⚡',
    title: 'Instant Job Notifications',
    desc: 'Receive real-time police station cover requests posted directly by solicitor firms. Jobs are posted 24/7 including evenings, weekends, and bank holidays — when demand is highest.',
  },
  {
    icon: '💬',
    title: 'Direct Communication',
    desc: 'Chat directly with solicitor firms and other representatives. No middlemen, no delays. Respond to cover requests instantly and confirm attendance in seconds.',
  },
  {
    icon: '🆓',
    title: 'Free to Join',
    desc: 'There is no charge to join the WhatsApp group. It is a free resource provided by PoliceStationRepUK to support the police station representative community.',
  },
];

const RESOURCE_LINKS = [
  { href: '/directory', label: 'Reps Directory', desc: 'Get listed so firms can find you' },
  { href: '/register', label: 'Register Your Profile', desc: 'Create your free directory listing' },
  { href: '/GetWork', label: 'Get Work Guide', desc: 'Complete career strategy guide' },
  { href: '/FormsLibrary', label: 'Forms Library', desc: 'CRM1, CRM2 & legal aid forms' },
];

export default function WhatsAppPage() {
  return (
    <>
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'WhatsApp Group', href: '/WhatsApp' },
            ]}
          />
          <h1 className="mt-3 text-h1 text-white">
            Join the Police Station Reps WhatsApp Group
          </h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-slate-300">
            The fastest way to receive police station cover requests from solicitor firms across
            England &amp; Wales. Free, instant, and exclusively for accredited representatives.
          </p>
        </div>
      </section>

      <div className="page-container">

      {/* Features */}
      <div className="mb-14 grid gap-5 sm:grid-cols-2">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)]"
          >
            <div className="mb-3 text-2xl">{f.icon}</div>
            <h2 className="font-semibold text-[var(--navy)]">{f.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* How to Join CTA */}
      <section className="mb-14 rounded-[var(--radius-lg)] bg-[var(--navy)] p-8 text-center">
        <h2 className="text-h2 text-white">How to Join</h2>
        <p className="mx-auto mt-4 max-w-lg text-slate-300">
          To request access to the WhatsApp group, send a text message with your name,
          accreditation details, and the areas you cover to:
        </p>
        <p className="mt-6 text-3xl font-bold text-white">(07535) 494446</p>
        <p className="mt-2 text-sm text-slate-300">
          You will be asked to provide proof of accreditation before being added.
        </p>
        <div className="mt-6">
          <a
            href="https://wa.me/447535494446?text=Hi%2C%20I%27d%20like%20to%20join%20the%20Police%20Station%20Reps%20WhatsApp%20Group.%20My%20name%20is%20"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gold inline-block no-underline"
          >
            Text to Join on WhatsApp
          </a>
        </div>
      </section>

      {/* What to expect */}
      <section className="mb-14 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-8 shadow-[var(--card-shadow)]">
        <h2 className="text-h2 mb-4 text-[var(--navy)]">What to Expect</h2>
        <ul className="space-y-3 text-sm text-[var(--muted)]">
          <li className="flex gap-2">
            <span className="mt-0.5 shrink-0 text-[var(--gold)]">✓</span>
            Cover requests from solicitor firms posted in real time — respond instantly to secure work
          </li>
          <li className="flex gap-2">
            <span className="mt-0.5 shrink-0 text-[var(--gold)]">✓</span>
            Professional environment — group rules are enforced to maintain quality and relevance
          </li>
          <li className="flex gap-2">
            <span className="mt-0.5 shrink-0 text-[var(--gold)]">✓</span>
            Networking opportunities with fellow reps and criminal solicitors nationwide
          </li>
          <li className="flex gap-2">
            <span className="mt-0.5 shrink-0 text-[var(--gold)]">✓</span>
            Industry updates, rate changes, and PACE developments shared by the community
          </li>
        </ul>
      </section>

      {/* Resources */}
      <section>
        <h2 className="text-h2 mb-6 text-[var(--navy)]">More Resources</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {RESOURCE_LINKS.map((link) => (
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
