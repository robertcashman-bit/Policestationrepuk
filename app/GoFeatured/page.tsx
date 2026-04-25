import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Become a Featured Rep — Go Featured',
  description:
    'Boost your visibility with a Featured Listing on PoliceStationRepUK. Get your own profile page, homepage spotlight, and priority placement from just £4.99/month.',
  path: '/GoFeatured',
});

const SPOTLIGHT_FEATURES = [
  {
    icon: '🌟',
    title: 'Own Dedicated Profile Page',
    desc: 'A unique, SEO-optimised page showcasing your qualifications, coverage areas, specialisms, and contact details — your personal landing page within the directory.',
  },
  {
    icon: '🎯',
    title: 'Homepage Spotlight Carousel',
    desc: 'Your profile rotates in the featured spotlight on the homepage — the first thing solicitor firms see when they visit PoliceStationRepUK.',
  },
  {
    icon: '📢',
    title: 'Partner Directory Homepage Advert',
    desc: 'An eye-catching advert placement on the directory homepage, putting your name and availability in front of every firm searching for cover.',
  },
];

const STATS = [
  { value: '3x', label: 'More Profile Views' },
  { value: '24/7', label: 'Always Visible' },
  { value: 'Top', label: 'Search Placement' },
  { value: '£4.99', label: 'From Per Month' },
];

const PRICING_TIERS = [
  { id: 'monthly', price: '£4.99', period: '/month', savings: null, badge: null, effective: '£4.99/mo' },
  { id: '3month', price: '£12.72', period: 'one-time', savings: '15% off', badge: null, effective: '£4.24/mo' },
  { id: '6month', price: '£22.46', period: 'one-time', savings: '25% off', badge: 'Popular', effective: '£3.74/mo' },
  { id: 'yearly', price: '£35.93', period: '/year', savings: '40% off', badge: 'Best value', effective: '£2.99/mo' },
];

const WHY_FEATURED = [
  {
    title: 'Priority Placement',
    desc: 'Featured reps always appear at the top of directory search results, above standard listings.',
  },
  {
    title: 'More Enquiries',
    desc: 'Higher visibility means more firms contact you directly — particularly for urgent overnight and weekend cover.',
  },
  {
    title: 'Instant Activation',
    desc: 'Your featured listing goes live immediately after payment. No waiting, no delays.',
  },
  {
    title: 'Cancel Anytime',
    desc: 'No lock-in contracts. Cancel your subscription anytime and keep featured status until the period ends.',
  },
];

const FAQS = [
  {
    q: 'How much does a Featured Listing cost?',
    a: 'Featured Listings start from just £4.99/month. Save up to 40% with longer subscription periods — the yearly plan works out to just £2.99/month.',
  },
  {
    q: 'How quickly is my Featured Listing activated?',
    a: 'Your Featured Listing is activated immediately after successful payment. You\'ll receive email confirmation once your spotlight profile is live.',
  },
  {
    q: 'What does a dedicated profile page include?',
    a: 'Your dedicated page includes your full name, accreditation details, coverage areas, specialisms, availability, contact details, and a personal bio. It\'s fully SEO-optimised so solicitor firms can find you via Google searches too.',
  },
  {
    q: 'How does the homepage carousel work?',
    a: 'The spotlight carousel rotates featured reps on the homepage. Every visitor to PoliceStationRepUK sees featured profiles first. The carousel cycles through all featured reps to give everyone equal exposure.',
  },
  {
    q: 'Do I need to be registered first?',
    a: 'Yes — you need a standard (free) profile on PoliceStationRepUK before you can upgrade to a Featured Listing. If you haven\'t registered yet, create your free profile first.',
  },
  {
    q: 'Can I cancel my Featured Listing?',
    a: 'Absolutely. You can cancel your subscription at any time from your account. Your featured status will remain active until the end of your current billing period.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept all major credit and debit cards. Payments are processed securely through Lemon Squeezy.',
  },
];

export default function GoFeaturedPage() {
  return (
    <>
      <div className="bg-[var(--navy)] py-10">
        <div className="page-container">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Go Featured', href: '/GoFeatured' },
            ]}
          />
          <div className="mb-3 mt-4 inline-block rounded-full border border-[var(--gold)]/40 bg-[var(--gold)]/10 px-3 py-1 text-xs font-semibold text-[var(--gold)]">
            FROM £4.99/MONTH
          </div>
          <h1 className="text-h1 text-white">Become a Featured Representative</h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-300">
            Stand out from the crowd. Get priority placement, your own profile page, and a homepage
            spotlight — the Spotlight Tier that gets you noticed.
          </p>
        </div>
      </div>

      <div className="page-container pt-10">

      {/* Stats */}
      <div className="mb-14 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 text-center shadow-[var(--card-shadow)]"
          >
            <p className="text-2xl font-bold text-[var(--gold)]">{stat.value}</p>
            <p className="mt-1 text-xs text-[var(--muted)]">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Pricing */}
      <section className="mb-14">
        <h2 className="text-h2 mb-2 text-center text-[var(--navy)]">Choose Your Plan</h2>
        <p className="mb-8 text-center text-[var(--muted)]">
          Save up to 40% with longer subscription periods
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PRICING_TIERS.map((tier) => (
            <div
              key={tier.id}
              className={`relative rounded-[var(--radius-lg)] border p-6 ${
                tier.badge === 'Best value'
                  ? 'border-[var(--gold)] bg-[var(--gold-pale)] shadow-lg'
                  : 'border-[var(--card-border)] bg-[var(--card-bg)] shadow-[var(--card-shadow)]'
              }`}
            >
              {tier.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--navy)] px-3 py-1 text-xs font-bold text-white">
                  {tier.badge}
                </span>
              )}
              <div className="text-center">
                <p className="text-3xl font-bold text-[var(--navy)]">{tier.price}</p>
                <p className="text-sm text-[var(--muted)]">{tier.period}</p>
                {tier.savings && (
                  <span className="mt-2 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                    {tier.savings}
                  </span>
                )}
                <p className="mt-3 text-xs text-[var(--muted)]">Effective: {tier.effective}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-6 text-center">
          <Link href="/Account" className="btn-gold">
            Subscribe Now
          </Link>
        </p>
      </section>

      {/* Spotlight Tier */}
      <section className="mb-14">
        <h2 className="text-h2 mb-2 text-[var(--navy)]">What You Get</h2>
        <p className="mb-8 text-[var(--muted)]">
          Everything you need to maximise your visibility and get more work.
        </p>
        <div className="grid gap-5 sm:grid-cols-3">
          {SPOTLIGHT_FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)]"
            >
              <div className="mb-3 text-2xl">{f.icon}</div>
              <h3 className="font-semibold text-[var(--navy)]">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Representative Statistics */}
      <section className="mb-14 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-8 shadow-[var(--card-shadow)]">
        <h2 className="text-h2 mb-4 text-[var(--navy)]">Featured Representative Statistics</h2>
        <p className="text-sm leading-relaxed text-[var(--muted)]">
          Featured representatives receive significantly more profile views and direct enquiries
          than standard listings. On average, featured profiles are viewed <strong className="text-[var(--navy)]">3x more often</strong> than
          non-featured profiles, and featured reps report receiving work enquiries within their
          first week of activation. Priority placement ensures your profile is the first result
          solicitor firms see when searching for cover in your area.
        </p>
      </section>

      {/* Why Go Featured? */}
      <section className="mb-14">
        <h2 className="text-h2 mb-6 text-[var(--navy)]">Why Go Featured?</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {WHY_FEATURED.map((item) => (
            <div
              key={item.title}
              className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)]"
            >
              <h3 className="font-semibold text-[var(--navy)]">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="mb-14">
        <h2 className="text-h2 mb-6 text-[var(--navy)]">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {FAQS.map((faq) => (
            <details
              key={faq.q}
              className="group rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] shadow-[var(--card-shadow)] open:shadow-[var(--card-shadow-hover)]"
            >
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-6 py-5 text-sm font-semibold text-[var(--foreground)] marker:hidden hover:text-[var(--gold-hover)]">
                <span>{faq.q}</span>
                <span className="mt-0.5 shrink-0 text-[var(--muted)] transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <div className="border-t border-[var(--border)] px-6 pb-5 pt-4">
                <p className="text-sm leading-relaxed text-[var(--muted)]">{faq.a}</p>
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="rounded-[var(--radius-lg)] bg-[var(--navy)] p-8 text-center">
        <h2 className="text-h2 text-white">Ready to Go Featured?</h2>
        <p className="mt-3 text-slate-300">
          Already registered? Sign in and subscribe from your Account dashboard.
          Not registered yet? Create your free profile first.
        </p>
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link href="/Account" className="btn-gold">
            Sign In &amp; Subscribe
          </Link>
          <Link href="/register" className="btn-outline !border-slate-500 !text-white hover:!border-[var(--gold)] hover:!text-[var(--gold)]">
            Register Free
          </Link>
        </div>
        <p className="mt-4 text-xs text-slate-400">
          Secure payment powered by Lemon Squeezy. Cancel anytime.
        </p>
      </div>
    </div>
    </>
  );
}
