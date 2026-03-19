import Link from 'next/link';
import { getAllCounties, getRepsByCounty } from '@/lib/data';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { SITE_URL } from '@/lib/seo-layer/config';

export const dynamic = 'force-static';
export const revalidate = false;

export const metadata = {
  title: 'Counties | Police Station Representative Directory',
  description:
    'Browse police station representatives by county. Find accredited reps in Kent, London, Essex, Surrey, Sussex, and across England and Wales.',
  alternates: { canonical: `${SITE_URL}/directory/counties` },
};

export default async function DirectoryCountiesPage() {
  const counties = await getAllCounties();
  const countiesWithCounts = await Promise.all(
    counties.map(async (c) => {
      const reps = await getRepsByCounty(c.name);
      return { ...c, repCount: reps.length };
    }),
  );

  return (
    <>
      {/* Navy header */}
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Directory', href: '/directory' },
              { label: 'Counties' },
            ]}
          />
          <h1 className="mt-3 text-h1 text-white">Browse by County</h1>
          <p className="mt-3 max-w-2xl text-lg text-slate-300">
            Select a county to see police station representatives and custody suites in that area.
          </p>
          <p className="mt-3 text-sm text-[var(--gold)]">
            {counties.length} counties covered across England &amp; Wales
          </p>
        </div>
      </section>

      <div className="page-container">
        <div className="mx-auto max-w-6xl">
          <ul className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {countiesWithCounts.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/directory/${c.slug}`}
                  className="group flex items-center justify-between rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-white p-4 shadow-[var(--card-shadow)] no-underline transition-all hover:border-[var(--gold)]/40 hover:shadow-[var(--card-shadow-hover)]"
                >
                  <div>
                    <span className="font-bold text-[var(--navy)] group-hover:text-[var(--gold-hover)]">{c.name}</span>
                    <span className="mt-0.5 block text-xs text-[var(--muted)]">
                      {c.repCount} rep{c.repCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {c.repCount > 0 && (
                    <span className="rounded-full bg-[var(--gold-pale)] px-2.5 py-0.5 text-xs font-bold text-[var(--gold-hover)]">
                      {c.repCount}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-10">
            <Link href="/directory" className="font-medium text-[var(--gold-hover)] no-underline hover:text-[var(--gold)]">
              ← Back to full directory
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
