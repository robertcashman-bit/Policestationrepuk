import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'How to Get Work as a Police Station Rep',
  description:
    'Complete guide to getting work as a police station representative — from initial setup to scaling your freelance career. Free career resource from PoliceStationRepUK.',
  path: '/GetWork',
});

const PHASES = [
  {
    number: 1,
    title: 'Immediate Setup',
    timeframe: 'Week 1',
    subtitle: 'Essential Groundwork',
    steps: [
      'Register your profile on PoliceStationRepUK — it\'s free and takes 5 minutes',
      'Join the WhatsApp group for real-time job notifications from solicitor firms',
      'Prepare a professional CV highlighting your accreditation, training, and any portfolio work',
      'Set up a dedicated work phone number and professional voicemail',
      'Create a simple email signature with your accreditation details and contact info',
    ],
  },
  {
    number: 2,
    title: 'Active Outreach',
    timeframe: 'Weeks 1–4',
    subtitle: 'Direct Marketing to Firms',
    steps: [
      'Identify all criminal defence firms within your target area using The Law Society\'s Find a Solicitor tool',
      'Send a personalised introductory email or letter to the senior partner / police station manager at each firm',
      'Follow up by phone within 3–5 days — introduce yourself, confirm your accreditation, and ask about their cover needs',
      'Offer to attend one or two initial call-outs at a competitive rate to demonstrate your reliability',
      'Attend local Law Society events, CLSA meetings, or criminal law seminars to network in person',
    ],
  },
  {
    number: 3,
    title: 'Responsive Service',
    timeframe: 'Ongoing',
    subtitle: 'Convert Enquiries into Repeat Work',
    steps: [
      'Respond to every enquiry within minutes — speed is everything in police station cover',
      'Always confirm attendance, estimated arrival time, and billing details before setting off',
      'Send a clear, professional attendance note within 24 hours of every job',
      'Follow up with the instructing firm to confirm they received your note and are satisfied',
      'Keep detailed records of every attendance for billing and portfolio purposes',
    ],
  },
  {
    number: 4,
    title: 'Pricing & Commercial Success',
    timeframe: 'Getting Paid Right',
    subtitle: 'Legal Aid Rates & Private Work',
    steps: [
      'Understand the current legal aid fixed fee (£320.00 harmonised fee from Dec 2025) and escape threshold (£650.00)',
      'Set competitive freelance rates — most freelance reps charge the legal aid rate plus travel or a fixed attendance fee',
      'Invoice promptly and chase payment within your agreed terms (14–30 days is standard)',
      'Track all travel mileage at 45p per mile for the first 10,000 miles (HMRC approved rate)',
      'Consider offering discounted rates for guaranteed regular work or block bookings',
    ],
  },
  {
    number: 5,
    title: 'Client Retention & Growth',
    timeframe: 'Building Relationships',
    subtitle: 'Turn One-Off Jobs into Regular Clients',
    steps: [
      'Be reliable above all else — firms remember the rep who always turns up on time',
      'Build expertise in specific offence types (fraud, drugs, serious violence) so firms request you by name',
      'Offer extended availability including evenings, weekends, and bank holidays',
      'Maintain regular contact with firms — a brief check-in call every few weeks keeps you top of mind',
      'Ask satisfied firms for referrals to other practices in their network',
    ],
  },
  {
    number: 6,
    title: 'Scaling & Specialisation',
    timeframe: 'Expert Status',
    subtitle: 'Grow Your Reputation & Income',
    steps: [
      'Apply for a Featured Listing on PoliceStationRepUK to appear at the top of search results',
      'Develop specialist knowledge (e.g., RASSO cases, terrorism, serious fraud) for higher-value instructions',
      'Consider registering with the DSCC duty rota for guaranteed work allocations',
      'Build relationships with multiple firms across neighbouring counties for maximum coverage',
      'Explore opportunities to mentor probationary reps — this builds your reputation and network',
    ],
  },
];

const EARNING_POTENTIAL = [
  { type: 'Employed (in-house)', range: '£24,000 – £32,000', note: 'Salary plus benefits, regular hours' },
  { type: 'Freelance', range: '£40,000 – £60,000+', note: 'Variable income, flexible schedule, higher earning ceiling' },
];

const RESOURCE_LINKS = [
  { href: '/directory', label: 'Reps Directory', desc: 'Get listed so firms can find you instantly' },
  { href: '/WhatsApp', label: 'WhatsApp Group', desc: 'Real-time job notifications from firms' },
  { href: '/FormsLibrary', label: 'Forms Library', desc: 'CRM1, CRM2 & attendance note templates' },
  { href: '/Wiki', label: 'Rep Knowledge Base', desc: 'Training materials and practice guides' },
];

export default function GetWorkPage() {
  return (
    <>
      {/* Navy header */}
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Get Work', href: '/GetWork' },
            ]}
          />
          <div className="mt-3 inline-block rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            FREE WHILST TESTING
          </div>
          <h1 className="mt-3 text-h1 text-white">
            Complete Guide: How to Get Work as a Police Station Representative
          </h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-slate-300">
            A step-by-step career strategy — from your first registration to building a thriving
            freelance practice. Follow these six phases to maximise your earning potential.
          </p>
          <p className="mt-2 text-xs text-slate-300">Last updated: 2nd February 2026</p>
        </div>
      </section>

      <div className="page-container">

      {/* Regulatory notice */}
      <div className="mb-12 rounded-[var(--radius-lg)] border border-yellow-300 bg-yellow-50 p-6">
        <h2 className="text-base font-bold text-yellow-900">⚠ Important Regulatory Notice</h2>
        <p className="mt-2 text-sm leading-relaxed text-yellow-800">
          <strong>Probationary representatives</strong> cannot work on a freelance basis. If you are
          still building your portfolio and have not yet passed the Critical Incident Test (CIT),
          you must work under the direct supervision of an accredited representative or duty
          solicitor at an SRA-regulated firm. Only fully accredited PSRAS holders may accept
          freelance instructions independently.
        </p>
      </div>

      {/* Earning Potential */}
      <section className="mb-14">
        <h2 className="text-h2 mb-6 text-[var(--navy)]">Earning Potential</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {EARNING_POTENTIAL.map((ep) => (
            <div
              key={ep.type}
              className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)]"
            >
              <p className="text-sm font-medium text-[var(--muted)]">{ep.type}</p>
              <p className="mt-1 text-2xl font-bold text-[var(--navy)]">{ep.range}</p>
              <p className="mt-2 text-xs text-[var(--muted)]">{ep.note}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Phases */}
      <section className="mb-14">
        <h2 className="text-h2 mb-8 text-[var(--navy)]">Your 6-Phase Action Plan</h2>
        <div className="space-y-8">
          {PHASES.map((phase) => (
            <div
              key={phase.number}
              className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)] sm:p-8"
            >
              <div className="mb-4 flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-[var(--gold)] text-sm font-bold text-[var(--gold)]">
                  {phase.number}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--navy)]">
                    Phase {phase.number}: {phase.title}
                  </h3>
                  <p className="text-sm text-[var(--muted)]">
                    {phase.timeframe} — {phase.subtitle}
                  </p>
                </div>
              </div>
              <ul className="space-y-3 pl-14">
                {phase.steps.map((step, i) => (
                  <li key={i} className="flex gap-2 text-sm leading-relaxed text-[var(--muted)]">
                    <span className="mt-0.5 shrink-0 text-emerald-600">✓</span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Resource links */}
      <section className="mb-14">
        <h2 className="text-h2 mb-6 text-[var(--navy)]">Essential Resources</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {RESOURCE_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 no-underline shadow-[var(--card-shadow)] transition-all hover:border-[var(--gold)]/40 hover:shadow-[var(--card-shadow-hover)]"
            >
              <p className="font-medium text-[var(--foreground)]">{link.label}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">{link.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="rounded-[var(--radius-lg)] bg-[var(--navy)] p-8 text-center">
        <h2 className="text-h2 text-white">Ready to Get Started?</h2>
        <p className="mt-3 text-slate-300">
          Register your free profile today and start receiving work enquiries from criminal
          defence firms across the UK.
        </p>
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link href="/register" className="btn-gold">
            Register Free
          </Link>
          <Link
            href="/WhatsApp"
            className="btn-outline !border-slate-500 !text-white hover:!border-[var(--gold)] hover:!text-[var(--gold)]"
          >
            Join WhatsApp Group
          </Link>
        </div>
      </div>
      </div>
    </>
  );
}
