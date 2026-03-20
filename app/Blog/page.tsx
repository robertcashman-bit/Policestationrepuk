import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { buildMetadata } from '@/lib/seo';
import { getAllBlogPosts } from '@/lib/blog-data';

export const metadata = buildMetadata({
  title: 'Blog | Legal Insights & Advice',
  description:
    'Legal insights, advice and guides for police station representatives, solicitors and criminal defence professionals across England & Wales.',
  path: '/Blog',
});

export default function BlogPage() {
  const posts = getAllBlogPosts();

  return (
    <>
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Blog', href: '/Blog' },
            ]}
          />
          <h1 className="mt-3 text-h1 text-white">Legal Insights &amp; Advice</h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-slate-300">
            Guides, articles and insights for police station representatives, criminal defence
            solicitors and anyone needing to understand their rights at a police station.
          </p>
          {posts.length > 0 && (
            <p className="mt-3 text-sm text-slate-300">{posts.length} articles available</p>
          )}
        </div>
      </section>

      <div className="page-container">

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/Blog/${post.slug}`}
            className="group block rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 no-underline shadow-[var(--card-shadow)] transition-all hover:-translate-y-0.5 hover:border-[var(--gold)]/40 hover:shadow-[var(--card-shadow-hover)]"
          >
            <p className="text-sm font-medium leading-snug text-[var(--navy)] group-hover:text-[var(--gold-hover)]">
              {post.title}
            </p>
            <p className="mt-2 text-xs font-medium text-[var(--gold-hover)]">Read article →</p>
          </Link>
        ))}
      </div>

      <div className="mt-12 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 text-center">
        <p className="text-sm text-[var(--muted)]">
          Are you an accredited police station representative?{' '}
          <Link href="/register" className="font-medium text-[var(--gold-hover)] hover:underline">
            Join our free directory
          </Link>{' '}
          and reach criminal defence firms nationwide.
        </p>
      </div>
    </div>
    </>
  );
}
