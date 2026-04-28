import Link from 'next/link';

const FAQS: { q: string; a: React.ReactNode }[] = [
  {
    q: 'How do I upgrade my listing to Featured?',
    a: (
      <>
        Click <strong>Upgrade to Featured</strong> in the box above. You will be sent
        to your <Link href="/Account" className="font-semibold text-[var(--navy)] underline">Account</Link>{' '}
        page, where you can sign in, choose a plan, and pay securely.
      </>
    ),
  },
  {
    q: 'Do I need a directory profile before I can upgrade?',
    a: (
      <>
        Yes — Featured is an upgrade to an existing listing, so you need a free
        profile under the same email first.{' '}
        <Link href="/register" className="font-semibold text-[var(--navy)] underline">
          Register a free profile
        </Link>{' '}
        and then return here.
      </>
    ),
  },
  {
    q: 'How do I sign in to my Account?',
    a: (
      <>
        On the <Link href="/Account" className="font-semibold text-[var(--navy)] underline">Account</Link>{' '}
        page, enter the email you used to register. We email you a 6-digit code, you
        enter the code, and you are signed in. There is no password to remember.
      </>
    ),
  },
  {
    q: 'What plans are available?',
    a: (
      <>
        Monthly is <strong>£4.99/month</strong>. Longer plans save more — 3 months
        (15% off), 6 months (25% off), and yearly (40% off, equivalent to about
        £2.99/month). Full pricing is on{' '}
        <Link href="/GoFeatured" className="font-semibold text-[var(--navy)] underline">
          Go Featured
        </Link>
        .
      </>
    ),
  },
  {
    q: 'How long until my Featured Listing is live?',
    a: 'Activation is automatic right after a successful payment — usually within seconds. You will see a confirmation in your Account, and your profile starts appearing in the homepage and directory featured slots.',
  },
  {
    q: 'What does "Featured" actually get me?',
    a: 'Priority placement at the top of search results, a slot in the homepage Featured Representatives carousel, a highlighted Featured badge on your card, and an advert placement on the directory homepage — all designed to put you in front of more solicitor firms looking for cover.',
  },
  {
    q: 'How are payments handled?',
    a: 'Securely through Lemon Squeezy. We do not see or store your card details. You can pay by major credit or debit card, and you will receive a receipt by email.',
  },
  {
    q: 'Can I cancel?',
    a: 'Yes — anytime, from your Account. There is no lock-in. Your Featured status stays active until the end of the period you have already paid for, then reverts to your free standard listing.',
  },
  {
    q: 'Does PoliceStationRepUK take a cut of any work?',
    a: 'No. The directory is a connection platform — instructions are a direct contract between the firm and the rep. We do not take referral fees or commissions on cases.',
  },
];

export function FeaturedListingFaq({ className = '' }: { className?: string }) {
  return (
    <section
      aria-labelledby="featured-listing-faq-heading"
      className={`rounded-2xl border border-[var(--card-border)] bg-white p-5 shadow-sm sm:p-6 ${className}`}
    >
      <header className="mb-4">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[var(--gold-link)]">
          For Representatives
        </p>
        <h2
          id="featured-listing-faq-heading"
          className="mt-1 text-lg font-bold text-[var(--navy)] sm:text-xl"
        >
          How upgrading to Featured works
        </h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Quick answers about pricing, sign-in, activation, and cancelling. See the
          full guide on{' '}
          <Link href="/GoFeatured" className="font-semibold text-[var(--navy)] underline">
            Go Featured
          </Link>
          .
        </p>
      </header>

      <div className="space-y-2">
        {FAQS.map((item) => (
          <details
            key={item.q}
            className="group rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)]"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-[var(--navy)] marker:hidden [&::-webkit-details-marker]:hidden">
              <span>{item.q}</span>
              <span
                aria-hidden
                className="ml-2 shrink-0 rounded-full border border-[var(--border)] px-2 text-xs font-bold text-[var(--navy)] transition-transform group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <div className="border-t border-[var(--border)] px-4 py-3 text-sm leading-relaxed text-[var(--muted)]">
              {item.a}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
