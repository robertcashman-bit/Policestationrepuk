import Link from 'next/link';
import type { WikiArticle } from '@/lib/types';

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

export type GroupedWikiCategory = {
  name: string;
  icon: string;
  articles: WikiArticle[];
};

export function groupWikiArticlesByCategory(articles: WikiArticle[]): GroupedWikiCategory[] {
  const grouped = new Map<string, WikiArticle[]>();
  for (const article of articles) {
    const list = grouped.get(article.category) ?? [];
    list.push(article);
    grouped.set(article.category, list);
  }

  return CATEGORY_ORDER.filter((cat) => grouped.has(cat))
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

const LEVEL_STYLES: Record<string, string> = {
  Beginner: 'bg-green-50 text-green-700 border-green-200',
  Intermediate: 'bg-blue-50 text-blue-700 border-blue-200',
  Advanced: 'bg-purple-50 text-purple-700 border-purple-200',
};

function difficultyClass(difficulty: string): string {
  const key = ['Beginner', 'Intermediate', 'Advanced'].find(
    (k) => k.toLowerCase() === difficulty.trim().toLowerCase(),
  );
  if (key) return LEVEL_STYLES[key];
  return 'bg-slate-50 text-slate-600 border-slate-200';
}

type WikiArticleIndexProps = {
  articles: WikiArticle[];
  /** Compact category panels with bullet links (Wiki hub). */
  variant?: 'list' | 'cards';
};

export function WikiArticleIndex({ articles, variant = 'list' }: WikiArticleIndexProps) {
  const categories = groupWikiArticlesByCategory(articles);

  if (variant === 'cards') {
    return (
      <div className="space-y-12">
        {categories.map((category) => (
          <section key={category.name}>
            <h2 className="text-h2 mb-2 text-[var(--navy)]">{category.name}</h2>
            <p className="mb-6 text-sm text-[var(--muted)]">
              {category.articles.length} article{category.articles.length !== 1 ? 's' : ''}
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {category.articles.map((article) => (
                <Link
                  key={article.slug}
                  href={`/Wiki/${article.slug}`}
                  className="group flex flex-col rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-4 no-underline shadow-[var(--card-shadow)] transition-all hover:-translate-y-0.5 hover:border-[var(--gold)]/40 hover:shadow-[var(--card-shadow-hover)]"
                >
                  <p className="flex-1 font-medium text-[var(--navy)] group-hover:text-[var(--gold-link)]">
                    {article.title}
                  </p>
                  <span
                    className={`mt-3 inline-block self-start rounded-full border px-2.5 py-0.5 text-xs font-medium ${difficultyClass(article.difficulty)}`}
                  >
                    {article.difficulty}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="grid gap-6 sm:grid-cols-2">
        {categories.map((category) => (
          <section
            key={category.name}
            className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-white p-6 shadow-[var(--card-shadow)]"
          >
            <h2 className="flex items-center gap-2 text-lg font-bold text-[var(--navy)]">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--navy)] text-sm"
                aria-hidden="true"
              >
                {category.icon}
              </span>
              {category.name}
              <span className="ml-auto rounded-full bg-[var(--gold-pale)] px-2 py-0.5 text-xs font-bold text-[var(--gold-link)]">
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
    </div>
  );
}
