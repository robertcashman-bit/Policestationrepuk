import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { buildMetadata } from '@/lib/seo';
import {
  WHATSAPP_JOIN_URL,
  WHATSAPP_JOIN_PHONE,
  FACEBOOK_GROUP_URL,
} from '@/lib/site-navigation';

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

const JOIN_STEPS = [
  {
    step: 1,
    title: 'Send a text message',
    desc: (
      <>
        Text <strong>{WHATSAPP_JOIN_PHONE}</strong> (or tap the button below)
        with your <strong>name</strong>,{' '}
        <strong>accreditation details</strong>, and the{' '}
        <strong>areas you cover</strong>.
      </>
    ),
  },
  {
    step: 2,
    title: 'Provide proof of accreditation',
    desc: 'You may be asked to share your LCCSA, CLSA, or Law Society accreditation number or certificate.',
  },
  {
    step: 3,
    title: 'Get added to the group',
    desc: "Once verified, you'll receive a WhatsApp invitation. Accept it and start receiving cover requests immediately.",
  },
];

const RESOURCE_LINKS = [
  {
    href: '/directory',
    label: 'Reps Directory',
    desc: 'Get listed so firms can find you',
  },
  {
    href: '/register',
    label: 'Register Your Profile',
    desc: 'Create your free directory listing',
  },
  {
    href: '/GetWork',
    label: 'Get Work Guide',
    desc: 'Complete career strategy guide',
  },
  {
    href: '/FormsLibrary',
    label: 'Forms Library',
    desc: 'CRM1, CRM2 & legal aid forms',
  },
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
            The fastest way to receive police station cover requests from
            solicitor firms across England &amp; Wales. Free, instant, and
            exclusively for accredited representatives.
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
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                {f.desc}
              </p>
            </div>
          ))}
        </div>

        {/* How to Join — numbered steps */}
        <section className="mb-14 rounded-[var(--radius-lg)] bg-[var(--navy)] p-8">
          <h2 className="text-h2 mb-6 text-center text-white">
            How to Join — 3 Simple Steps
          </h2>
          <ol className="mx-auto max-w-xl space-y-6">
            {JOIN_STEPS.map((s) => (
              <li key={s.step} className="flex gap-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--gold)] text-sm font-bold text-[var(--navy)]">
                  {s.step}
                </span>
                <div>
                  <p className="font-semibold text-white">{s.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-300">
                    {s.desc}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-8 text-center">
            <a
              href={WHATSAPP_JOIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold inline-block no-underline"
            >
              Text to Join on WhatsApp
            </a>
            <p className="mt-4 text-3xl font-bold text-white">
              {WHATSAPP_JOIN_PHONE}
            </p>
          </div>
        </section>

        {/* What to expect */}
        <section className="mb-14 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-8 shadow-[var(--card-shadow)]">
          <h2 className="text-h2 mb-4 text-[var(--navy)]">What to Expect</h2>
          <ul className="space-y-3 text-sm text-[var(--muted)]">
            {[
              'Cover requests from solicitor firms posted in real time — respond instantly to secure work',
              'Professional environment — group rules are enforced to maintain quality and relevance',
              'Networking opportunities with fellow reps and criminal solicitors nationwide',
              'Industry updates, rate changes, and PACE developments shared by the community',
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-0.5 shrink-0 text-[var(--gold)]">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* Are you a firm? */}
        <section className="mb-14 rounded-[var(--radius-lg)] border-2 border-[var(--gold)]/30 bg-[var(--gold)]/5 p-8 text-center">
          <h2 className="text-h2 text-[var(--navy)]">
            Are You a Solicitor Firm?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-[var(--muted)]">
            There is a separate WhatsApp group for criminal defence firms to
            post cover requests directly to accredited reps. It&apos;s free,
            verified, and monitored.
          </p>
          <Link
            href="/FirmsWhatsAppGroup"
            className="btn-outline mt-5 inline-block no-underline"
          >
            Firms WhatsApp Group &rarr;
          </Link>
        </section>

        {/* Facebook group CTA */}
        <section className="mb-14 rounded-[var(--radius-lg)] border-2 border-blue-200 bg-blue-50 p-8 text-center">
          <h2 className="text-h2 text-[var(--navy)]">
            Join Our Facebook Group
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-[var(--muted)]">
            Our Facebook group is a complementary community space for police
            station reps and criminal defence professionals. Share articles,
            discuss industry news, and connect with colleagues across the
            country.
          </p>
          <a
            href={FACEBOOK_GROUP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline mt-5 inline-block no-underline"
          >
            Join the Facebook Group
          </a>
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
