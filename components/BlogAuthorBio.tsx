import Link from 'next/link';

/**
 * Short editorial byline for blog posts — directory platform context, not a retainer offer.
 */
export function BlogAuthorBio() {
  return (
    <aside className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)] sm:p-6">
      <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--muted)]">About the editor</h2>
      <p className="mt-3 text-sm font-semibold text-[var(--navy)]">Robert Cashman</p>
      <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
        Founder of PoliceStationRepUK. Editorial articles on this site are general information for professionals in
        England and Wales — not legal advice and not a substitute for your own supervision and insurer requirements.
      </p>
      <p className="mt-4">
        <Link href="/AboutFounder" className="text-sm font-medium text-[var(--gold-hover)] no-underline hover:underline">
          Read more on the founder page
        </Link>
      </p>
    </aside>
  );
}
