import Link from 'next/link';
import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { buildMetadata } from '@/lib/seo';
import { getAllWikiArticles } from '@/lib/data';
import type { WikiArticle } from '@/lib/types';

export const metadata: Metadata = buildMetadata({
  title: 'Rep Knowledge Base | PoliceStationRepUK',
  description:
    'Free knowledge base for police station representatives. 45+ articles on interview techniques, PACE codes, client management, legal aid claiming, and professional development.',
  path: '/Wiki',
});

const CATEGORY_ICONS: Record<string, string> = {
  'Professional Development': '📈',
  'Dealing with Police': '👮',
  'Client Management': '🤝',
  'Claiming & Billing': '💷',
  'Common Problems': '⚠️',
  'Interview Techniques': '🎤',
  'At The Station': '🏢',
  'Getting Started': '🚀',
};

const CATEGORY_ORDER = [
  'Getting Started',
  'At The Station',
  'Interview Techniques',
  'Common Problems',
  'Dealing with Police',
  'Client Management',
  'Claiming & Billing',
  'Professional Development',
];

function groupByCategory(articles: WikiArticle[]) {
  const grouped = new Map<string, WikiArticle[]>();
  for (const article of articles) {
    const list = grouped.get(article.category) ?? [];
    list.push(article);
    grouped.set(article.category, list);
  }

  return CATEGORY_ORDER
    .filter((cat) => grouped.has(cat))
    .map((cat) => ({
      name: cat,
      icon: CATEGORY_ICONS[cat] ?? '📄',
      articles: grouped.get(cat)!,
    }))
    .concat(
      [...grouped.entries()]
        .filter(([cat]) => !CATEGORY_ORDER.includes(cat))
        .map(([cat, arts]) => ({
          name: cat,
          icon: CATEGORY_ICONS[cat] ?? '📄',
          articles: arts,
        })),
    );
}

export default async function WikiPage() {
  const allArticles = await getAllWikiArticles();
  const categories = groupByCategory(allArticles);
  const totalArticles = allArticles.length;

  return (
    <>
      {/* Navy header */}
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs light items={[{ label: 'Home', href: '/' }, { label: 'Knowledge Base' }]} />
          <div className="mt-3 flex items-center gap-3">
            <h1 className="text-h1 text-white">Rep Knowledge Base</h1>
            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300">
              FREE
            </span>
          </div>
          <p className="mt-3 max-w-2xl text-lg text-slate-300">
            {totalArticles} articles covering everything a police station representative needs to
            know — from getting started to advanced interview techniques and legal aid claiming.
          </p>
        </div>
      </section>

      <div className="page-container">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-6 sm:grid-cols-2">
            {categories.map((category) => (
              <section
                key={category.name}
                className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-white p-6 shadow-[var(--card-shadow)]"
              >
                <h2 className="flex items-center gap-2 text-lg font-bold text-[var(--navy)]">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--navy)] text-sm" aria-hidden="true">
                    {category.icon}
                  </span>
                  {category.name}
                  <span className="ml-auto rounded-full bg-[var(--gold-pale)] px-2 py-0.5 text-xs font-bold text-[var(--gold-hover)]">
                    {category.articles.length}
                  </span>
                </h2>
                <ul className="mt-4 space-y-1.5">
                  {category.articles.map((article) => (
                    <li key={article.slug}>
                      <Link
                        href={`/Wiki/${article.slug}`}
                        className="inline-flex items-center gap-1.5 text-sm text-[var(--navy)] no-underline transition-colors hover:text-[var(--gold-hover)]"
                      >
                        <span className="text-[var(--gold)] text-xs">→</span>
                        {article.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          {/* Contribute CTA */}
          <section className="mt-12 rounded-[var(--radius-lg)] bg-[var(--navy)] p-8 text-center">
            <h2 className="text-xl font-bold text-white">
              Want to contribute an article?
            </h2>
            <p className="mt-2 text-slate-300">
              If you have experience as a police station representative and would like to share
              knowledge with the community, get in touch.
            </p>
            <Link href="/Contact" className="btn-gold mt-5">
              Contact Us
            </Link>
          </section>
        </div>
      </div>
    </>
  );
}
