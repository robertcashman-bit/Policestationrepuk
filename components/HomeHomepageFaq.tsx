import Link from 'next/link';
import { HOMEPAGE_FAQS } from '@/lib/homepage-faqs';

export function HomeHomepageFaq() {
  return (
    <section className="section-pad bg-white" aria-labelledby="homepage-faq-heading">
      <div className="page-container !py-0">
        <div className="mx-auto max-w-3xl">
          <h2 id="homepage-faq-heading" className="text-h2 mt-0 text-center text-[var(--navy)]">
            Frequently asked questions
          </h2>
          <p className="mt-2 text-center text-sm text-[var(--muted)]">
            Plain-English answers for solicitors, reps, and the public (general information — not legal advice).{' '}
            <Link href="/FAQ" className="font-semibold text-[var(--navy)] underline">
              Full FAQ page
            </Link>
          </p>
          <div className="mt-8 space-y-3">
            {HOMEPAGE_FAQS.map((item) => (
              <details
                key={item.q}
                className="group rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] shadow-[var(--card-shadow)]"
              >
                <summary className="cursor-pointer list-none px-5 py-4 pr-10 text-sm font-semibold text-[var(--navy)] marker:hidden [&::-webkit-details-marker]:hidden">
                  <span className="block">{item.q}</span>
                </summary>
                <div className="border-t border-[var(--border)] px-5 py-4 text-sm leading-relaxed text-[var(--muted)]">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
