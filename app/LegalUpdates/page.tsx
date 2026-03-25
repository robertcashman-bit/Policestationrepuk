import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { buildMetadata } from '@/lib/seo';
import { getAllLegalUpdates } from '@/lib/data';

export const metadata = buildMetadata({
  title: 'Legal Updates & PACE News for Police Station Reps UK',
  description:
    'Latest legal updates, PACE code changes, practice directions, and billing guidance for police station representatives and criminal defence solicitors. Updated regularly with case law and regulatory news.',
  path: '/LegalUpdates',
});

function categoryColor(cat: string) {
  switch (cat) {
    case 'Legal Updates':
      return 'border-blue-200 bg-blue-50 text-blue-700';
    case 'Practice Tips':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'PACE Updates':
      return 'border-purple-200 bg-purple-50 text-purple-700';
    case 'Fees & Billing':
      return 'border-yellow-200 bg-yellow-50 text-yellow-700';
    default:
      return 'border-gray-200 bg-gray-50 text-gray-700';
  }
}

function formatDate(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

export default async function LegalUpdatesPage() {
  const updates = await getAllLegalUpdates();

  const sorted = [...updates].sort(
    (a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime()
  );

  return (
    <>
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Legal Updates', href: '/LegalUpdates' },
            ]}
          />
          <h1 className="mt-3 text-h1 text-white">Legal Updates &amp; News</h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-white">
            Stay up to date with the latest legal developments, PACE amendments, practice tips, and
            billing guidance relevant to police station representatives and criminal solicitors.
          </p>
        </div>
      </section>

      <div className="page-container">

      {/* Updates grid */}
      <section className="mb-14">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((update) => (
            <Link
              key={update.id}
              href={`/LegalUpdates/${update.slug}`}
              className="flex flex-col rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)] no-underline transition-all hover:border-[var(--gold)]/40 hover:shadow-lg"
            >
              <div className="mb-3 flex items-center justify-between">
                <span
                  className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${categoryColor(update.category)}`}
                >
                  {update.category}
                </span>
                <span className="text-xs text-[var(--muted)]">{formatDate(update.publishedDate)}</span>
              </div>
              <h2 className="text-base font-semibold text-[var(--navy)]">{update.title}</h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--muted)]">
                {update.excerpt}
              </p>
              <span className="mt-4 text-xs font-medium text-[var(--gold-hover)]">
                Read full article →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Premium CTA */}
      <section className="mb-14 rounded-[var(--radius-lg)] bg-[var(--navy)] p-8 text-center">
        <h2 className="text-h2 text-white">Want Full Training Resources?</h2>
        <p className="mt-3 text-white">
          Access in-depth training materials, practice guides, and detailed case studies with our
          Premium resources — designed specifically for police station representatives.
        </p>
        <div className="mt-6">
          <Link
            href="/Premium"
            className="btn-gold inline-block no-underline"
          >
            Explore Premium Resources
          </Link>
        </div>
      </section>

      {/* Quick links */}
      <section>
        <h2 className="text-h2 mb-6 text-[var(--navy)]">Related Resources</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/PACE"
            className="block rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 no-underline shadow-[var(--card-shadow)] transition-all hover:border-[var(--gold)]/40 hover:shadow-[var(--card-shadow-hover)]"
          >
            <p className="font-medium text-[var(--navy)]">PACE Codes</p>
            <p className="mt-1 text-sm text-[var(--muted)]">Quick reference guide</p>
          </Link>
          <Link
            href="/PoliceStationRates"
            className="block rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 no-underline shadow-[var(--card-shadow)] transition-all hover:border-[var(--gold)]/40 hover:shadow-[var(--card-shadow-hover)]"
          >
            <p className="font-medium text-[var(--navy)]">Legal Aid Rates</p>
            <p className="mt-1 text-sm text-[var(--muted)]">Current 2025/26 rates</p>
          </Link>
          <Link
            href="/FormsLibrary"
            className="block rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 no-underline shadow-[var(--card-shadow)] transition-all hover:border-[var(--gold)]/40 hover:shadow-[var(--card-shadow-hover)]"
          >
            <p className="font-medium text-[var(--navy)]">Forms Library</p>
            <p className="mt-1 text-sm text-[var(--muted)]">CRM1, CRM2 &amp; templates</p>
          </Link>
          <Link
            href="/Resources"
            className="block rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 no-underline shadow-[var(--card-shadow)] transition-all hover:border-[var(--gold)]/40 hover:shadow-[var(--card-shadow-hover)]"
          >
            <p className="font-medium text-[var(--navy)]">All Resources</p>
            <p className="mt-1 text-sm text-[var(--muted)]">Training &amp; practice guides</p>
          </Link>
        </div>
      </section>
    </div>
    </>
  );
}
