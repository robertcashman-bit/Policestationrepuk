import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { buildMetadata } from '@/lib/seo';
import {
  WHATSAPP_FIRMS_JOIN_URL,
  WHATSAPP_JOIN_PHONE,
  COMMUNITY_EMAIL,
  FACEBOOK_GROUP_URL,
} from '@/lib/site-navigation';

export const metadata = buildMetadata({
  title: 'WhatsApp Job Group for Criminal Defence Firms | PoliceStationRepUK',
  description:
    'For criminal defence firms and solicitors to post urgent and planned police station cover jobs directly to accredited representatives across England & Wales.',
  path: '/FirmsWhatsAppGroup',
});

const BENEFITS = [
  {
    icon: '📋',
    title: 'Post Jobs Directly to Reps',
    desc: 'Post urgent or planned police station cover requests directly to accredited representatives — no agency, no middleman.',
  },
  {
    icon: '🔒',
    title: 'Verified Firms Only',
    desc: 'Access is restricted to genuine criminal defence firms. Every member is verified before being admitted.',
  },
  {
    icon: '⚡',
    title: 'Instant Response',
    desc: 'Reps see your request in real time and respond within minutes — ideal for urgent out-of-hours cover.',
  },
  {
    icon: '🆓',
    title: 'Completely Free',
    desc: 'There is no charge to join or use the group. It is a free resource provided by PoliceStationRepUK.',
  },
];

const JOIN_STEPS = [
  {
    step: 1,
    title: 'Send a text message',
    desc: (
      <>
        Text <strong>{WHATSAPP_JOIN_PHONE}</strong> (or tap the button below)
        with: your <strong>full name</strong>, <strong>firm name</strong>, and{' '}
        <strong>firm email address</strong>.
      </>
    ),
  },
  {
    step: 2,
    title: 'We verify your firm',
    desc: 'We check the details against public SRA records and may follow up if clarification is needed.',
  },
  {
    step: 3,
    title: 'Receive your invitation',
    desc: "Once verified, you'll receive a WhatsApp group invitation. Accept it and you're in.",
  },
];

export default function FirmsWhatsAppGroupPage() {
  return (
    <>
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Firms WhatsApp Group' },
            ]}
          />
          <h1 className="mt-3 text-h1 text-white">
            WhatsApp Job Group for Criminal Defence Firms
          </h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-slate-300">
            Post urgent and planned police station cover jobs directly to
            accredited representatives across England &amp; Wales — free,
            verified, and monitored by a practising solicitor.
          </p>
        </div>
      </section>

      <div className="page-container">
        <div className="mx-auto max-w-4xl space-y-14">
          {/* Benefits grid */}
          <div className="grid gap-5 sm:grid-cols-2">
            {BENEFITS.map((b) => (
              <div
                key={b.title}
                className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)]"
              >
                <div className="mb-3 text-2xl">{b.icon}</div>
                <h2 className="font-semibold text-[var(--navy)]">{b.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                  {b.desc}
                </p>
              </div>
            ))}
          </div>

          {/* How to join — numbered steps */}
          <section className="rounded-[var(--radius-lg)] bg-[var(--navy)] p-8">
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
                href={WHATSAPP_FIRMS_JOIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-gold inline-block no-underline"
              >
                Text to Join on WhatsApp
              </a>
              <p className="mt-3 text-sm text-slate-400">
                Can&apos;t text? Email the same details to{' '}
                <a
                  href={`mailto:${COMMUNITY_EMAIL}?subject=Firms%20WhatsApp%20Group%20Request`}
                  className="text-[var(--gold)] underline"
                >
                  {COMMUNITY_EMAIL}
                </a>
              </p>
            </div>
          </section>

          {/* Why access is controlled */}
          <section className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-8 shadow-[var(--card-shadow)]">
            <h2 className="text-h2 mb-4 text-[var(--navy)]">
              Why Access Is Controlled
            </h2>
            <p className="mb-4 text-sm leading-relaxed text-[var(--muted)]">
              Access is restricted to genuine criminal defence firms to:
            </p>
            <ul className="space-y-2 text-sm text-[var(--muted)]">
              {[
                'Ensure posted jobs are genuine and legitimate',
                'Protect both firms and accredited representatives',
                'Prevent spam, misuse, and inappropriate content',
                'Maintain professional standards and trust within the network',
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-0.5 shrink-0 text-[var(--gold)]">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* Facebook group CTA */}
          <section className="rounded-[var(--radius-lg)] border-2 border-blue-200 bg-blue-50 p-8 text-center">
            <h2 className="text-h2 text-[var(--navy)]">
              Join Our Facebook Group Too
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-[var(--muted)]">
              Our Facebook group is another way for firms and reps to connect,
              share updates, and discuss criminal defence matters. It&apos;s
              open to all professionals in the sector.
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

          {/* Disclaimer + CTA */}
          <section className="rounded-[var(--radius-lg)] bg-[var(--navy)] p-8 text-center">
            <p className="text-xs leading-relaxed text-slate-400">
              Operated by Robert Cashman, Duty Solicitor &amp; Higher Rights
              Advocate. The WhatsApp group facilitates introductions only.
              Instruction, supervision, and payment remain the responsibility of
              the instructing firm.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Link href="/directory" className="btn-gold no-underline">
                Find a Rep
              </Link>
              <Link href="/Contact" className="btn-outline no-underline">
                Contact Us
              </Link>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
