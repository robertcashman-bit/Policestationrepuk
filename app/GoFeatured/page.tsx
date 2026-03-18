import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Become a Featured Rep — Go Featured',
  description:
    'Boost your visibility with a Featured Listing on PoliceStationRepUK. Get your own profile page, homepage spotlight, and priority placement — free whilst testing.',
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
  { value: 'Free', label: 'Whilst Testing' },
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
    desc: 'Your featured listing goes live within 24 hours of approval. No waiting, no delays.',
  },
  {
    title: 'No Commitment',
    desc: 'Cancel any time. No lock-in contracts, no notice periods. You stay in control.',
  },
];

const FAQS = [
  {
    q: 'How quickly is my Featured Listing activated?',
    a: 'Your Featured Listing is typically activated within 24 hours of your request being approved. You\'ll receive email confirmation once your spotlight profile is live.',
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
    a: 'Absolutely. There are no lock-in contracts or notice periods. You can downgrade to a standard listing at any time by contacting us.',
  },
  {
    q: 'Is Go Featured really free?',
    a: 'Yes — during our testing phase, the Featured Listing (Spotlight Tier) is completely free. We\'ll give plenty of notice before any pricing changes are introduced.',
  },
];

export default function GoFeaturedPage() {
  return (
    <>
      {/* Navy header section */}
      <div className="bg-[var(--navy)] py-10">
        <div className="page-container">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Go Featured', href: '/GoFeatured' },
            ]}
          />
          <div className="mb-3 mt-4 inline-block rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            FREE WHILST TESTING
          </div>
          <h1 className="text-h1 text-white">Become a Featured Representative</h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-300">
            Stand out from the crowd. Get priority placement, your own profile page, and a homepage
            spotlight — all included in the Spotlight Tier.
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

      {/* Spotlight Tier */}
      <section className="mb-14">
        <h2 className="text-h2 mb-2 text-[var(--navy)]">Spotlight Tier</h2>
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
          Already registered? Contact us to activate your Spotlight Listing. Not registered yet?
          Create your free profile first.
        </p>
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link href="/register" className="btn-gold">
            Register Free First
          </Link>
          <Link
            href="/Contact"
            className="btn-outline !border-slate-500 !text-white hover:!border-[var(--gold)] hover:!text-[var(--gold)]"
          >
            Contact Us to Activate
          </Link>
        </div>
      </div>
    </div>
    </>
  );
}
