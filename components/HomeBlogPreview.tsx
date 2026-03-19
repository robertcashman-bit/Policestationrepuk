import Link from 'next/link';

const ARTICLES = [
  {
    title: 'Understanding Police Cautions in England',
    description: 'Comprehensive guide to their meaning and consequences. Learn what a police caution really means.',
    views: 143,
    slug: '/blog/understanding-police-cautions',
  },
  {
    title: 'Higher Court Advocates in the UK',
    description: 'Detailed look at higher court advocacy rights and representing clients in Crown Court.',
    views: 5,
    slug: '/blog/higher-court-advocates',
  },
];

export function HomeBlogPreview() {
  return (
    <section className="bg-white py-14 sm:py-16" aria-label="Latest blog articles">
      <div className="page-container !py-0">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[var(--navy)] sm:text-3xl">
            Latest Legal Insights
          </h2>
          <p className="mt-2 text-[var(--muted)]">Expert guidance from the PSR Kent Blog</p>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {ARTICLES.map((article) => (
            <Link
              key={article.slug}
              href={article.slug}
              className="group rounded-xl border border-[var(--card-border)] bg-white p-6 shadow-sm no-underline transition-all hover:shadow-md hover:border-[var(--gold)]/40"
            >
              <h3 className="text-lg font-bold text-[var(--navy)] group-hover:text-[var(--gold-hover)]">
                {article.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                {article.description}
              </p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-[var(--muted)]">{article.views} views</span>
                <span className="text-sm font-semibold text-[var(--gold-hover)]">Read →</span>
              </div>
            </Link>
          ))}
        </div>

        <p className="mt-8 text-center">
          <Link href="/Blog" className="text-sm font-semibold text-[var(--gold-hover)] no-underline hover:text-[var(--gold)]">
            Browse blog articles
          </Link>
        </p>
      </div>
    </section>
  );
}
