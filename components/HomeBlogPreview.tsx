import Link from 'next/link';
import { getAllBlogPosts } from '@/lib/blog-data';

export async function HomeBlogPreview() {
  const posts = getAllBlogPosts().slice(0, 2);

  if (posts.length === 0) {
    return (
      <section className="section-pad bg-white" aria-label="Latest blog articles">
        <div className="page-container !py-0 text-center">
          <h2 className="text-h2 mt-0 text-[var(--navy)]">Latest Legal Insights</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            <Link href="/Blog" className="font-semibold text-[var(--gold-hover)] no-underline hover:underline">
              Browse the blog →
            </Link>
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="section-pad bg-white" aria-label="Latest blog articles">
      <div className="page-container !py-0">
        <div className="text-center">
          <h2 className="text-h2 mt-0 text-[var(--navy)]">Latest Legal Insights</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">Expert guidance from the PSR Kent Blog</p>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 sm:gap-6">
          {posts.map((article) => (
            <Link
              key={article.slug}
              href={`/blog/${article.slug}`}
              className="group card-surface no-underline transition-shadow hover:shadow-[var(--card-shadow-hover)] hover:border-[var(--gold)]/40"
            >
              <h3 className="mt-0 text-lg font-bold leading-snug text-[var(--navy)] group-hover:text-[var(--gold-hover)]">
                {article.title}
              </h3>
              <div className="mt-4 flex justify-end">
                <span className="text-sm font-semibold text-[var(--gold-hover)]">Read →</span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 flex flex-col items-center gap-3">
          <Link
            href="/Blog"
            className="text-sm font-semibold text-[var(--gold-hover)] no-underline hover:text-[var(--gold)]"
          >
            Browse blog articles
          </Link>
          <Link href="/Blog" className="btn-gold !text-sm">
            Browse All Articles
          </Link>
        </div>
      </div>
    </section>
  );
}
