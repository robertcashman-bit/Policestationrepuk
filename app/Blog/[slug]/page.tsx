import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { buildMetadata } from '@/lib/seo';
import {
  getAllBlogPosts,
  getBlogPostBySlug,
  loadBlogCrawlFile,
  isPlaceholderBlogRecord,
  getLiveBlogArticleUrl,
} from '@/lib/blog-data';

export const dynamic = 'force-static';
export const revalidate = false;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllBlogPosts().map((p) => ({ slug: p.slug }));
}

export const dynamicParams = true;

function metaDescriptionForBlogPost(title: string, crawlContent: string, placeholder: boolean): string {
  const fallback = `${title} — Practical guides on police station representation, interviews, and cautions. Free UK directory and resources on PoliceStationRepUK.`;
  if (placeholder) return fallback;
  const oneLine = crawlContent.replace(/\s+/g, ' ').trim();
  if (!oneLine) return fallback;
  const max = 155;
  if (oneLine.length <= max) return oneLine;
  const cut = oneLine.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  const snippet = (lastSpace > 80 ? cut.slice(0, lastSpace) : cut).trimEnd();
  return `${snippet}…`;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  if (!post) return {};
  const crawl = loadBlogCrawlFile(slug);
  const placeholder = isPlaceholderBlogRecord(crawl);
  const rawContent = (crawl?.content ?? '').trim();
  return buildMetadata({
    title: `${post.title} | Blog`,
    description: metaDescriptionForBlogPost(post.title, rawContent, placeholder),
    path: `/Blog/${slug}`,
  });
}

function Heading({ level, text }: { level: number; text: string }) {
  const Tag = `h${Math.min(Math.max(level, 2), 6)}` as 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  const styles: Record<number, string> = {
    2: 'text-2xl font-bold mt-10 mb-4 pb-2 border-b-2 border-[var(--gold-pale)] text-[var(--navy)]',
    3: 'text-xl font-semibold mt-8 mb-3 text-[var(--navy)]',
    4: 'text-lg font-semibold mt-6 mb-2 text-[var(--navy)]',
    5: 'text-base font-semibold mt-5 mb-2 text-[var(--navy)]',
    6: 'text-sm font-bold mt-4 mb-2 uppercase tracking-wide text-[var(--muted)]',
  };
  return (
    <Tag className={`tracking-tight first:mt-0 ${styles[Math.min(level, 6)] || styles[4]}`}>{text}</Tag>
  );
}

function ArticleBody({
  headings,
  content,
}: {
  headings: { level: number; text: string }[];
  content: string;
}) {
  const subHeadings = headings.filter((h) => h.level > 1);
  const contentParagraphs = content
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  const chunkSize =
    subHeadings.length > 0 ? Math.ceil(contentParagraphs.length / (subHeadings.length + 1)) : contentParagraphs.length;

  if (subHeadings.length > 0) {
    return (
      <article className="content-section">
        {contentParagraphs.length > 0 && chunkSize > 0 && (
          <div className="mb-6 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)] sm:p-8">
            <div className="space-y-4 leading-[1.8] text-[var(--muted)]">
              {contentParagraphs.slice(0, chunkSize).map((p, i) => (
                <p key={i} className="whitespace-pre-line">
                  {p}
                </p>
              ))}
            </div>
          </div>
        )}
        {subHeadings.map((h, idx) => {
          const start = chunkSize * (idx + 1);
          const end = chunkSize * (idx + 2);
          const sectionParas = contentParagraphs.slice(start, end);
          return (
            <section
              key={idx}
              className="mb-6 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)] sm:p-8"
            >
              <Heading level={h.level} text={h.text} />
              {sectionParas.length > 0 && (
                <div className="mt-3 space-y-4 leading-[1.8] text-[var(--muted)]">
                  {sectionParas.map((p, i) => (
                    <p key={i} className="whitespace-pre-line">
                      {p}
                    </p>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </article>
    );
  }

  return (
    <article className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)] sm:p-8">
      <div className="max-w-none space-y-5 break-words leading-[1.8] text-[var(--muted)]">
        {content.split(/\n{2,}/).map((p, i) => (
          <p key={i} className="whitespace-pre-line">
            {p.trim()}
          </p>
        ))}
      </div>
    </article>
  );
}

export default async function BlogArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  if (!post) notFound();

  const crawl = loadBlogCrawlFile(slug);
  const placeholder = isPlaceholderBlogRecord(crawl);
  const liveUrl = getLiveBlogArticleUrl(slug);

  const h1 = post.title;
  const headings = crawl?.headings?.length ? crawl.headings : [{ level: 1, text: h1 }];
  const content = (crawl?.content || '').trim();

  return (
    <>
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Blog', href: '/Blog' },
              { label: post.title },
            ]}
          />
          <h1 className="mt-3 text-h1 text-white">{h1}</h1>
          <p className="mt-3 max-w-2xl text-lg text-slate-300">
            Practical context for police station interviews, cautions, and criminal defence in England &amp; Wales.
          </p>
        </div>
      </section>

      <div className="page-container">
        <div className="mx-auto max-w-3xl">
          {placeholder ? (
            <div className="space-y-8">
              <div className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-white p-6 shadow-[var(--card-shadow)] sm:p-8">
                <p className="leading-relaxed text-[var(--muted)]">
                  This article is listed in the PoliceStationRepUK blog index. The in-app crawl did not capture the full
                  article body (legacy host routing). You can read the complete post on the original directory site, or
                  use our free guides below while we migrate long-form content.
                </p>
                <a
                  href={liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-gold mt-6 inline-flex !no-underline"
                >
                  Read full article on PoliceStationRepUK.com →
                </a>
              </div>

              <div className="rounded-[var(--radius-lg)] border border-[var(--gold-pale)] bg-[var(--gold-pale)] p-6">
                <h2 className="text-lg font-bold text-[var(--navy)]">Related on this site</h2>
                <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-[var(--navy)]">
                  <li>
                    <Link href="/Directory" className="font-semibold text-[var(--gold-hover)] hover:underline">
                      Find accredited reps — directory hub
                    </Link>
                  </li>
                  <li>
                    <Link href="/search" className="font-semibold text-[var(--gold-hover)] hover:underline">
                      Advanced search &amp; filters
                    </Link>
                  </li>
                  <li>
                    <Link href="/InterviewUnderCaution" className="font-semibold text-[var(--gold-hover)] hover:underline">
                      Interview under caution
                    </Link>
                  </li>
                  <li>
                    <Link href="/PACE" className="font-semibold text-[var(--gold-hover)] hover:underline">
                      PACE &amp; custody rights
                    </Link>
                  </li>
                  <li>
                    <Link href="/Resources" className="font-semibold text-[var(--gold-hover)] hover:underline">
                      Resources hub
                    </Link>
                  </li>
                  <li>
                    <Link href="/Blog" className="font-semibold text-[var(--gold-hover)] hover:underline">
                      All blog posts
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <ArticleBody headings={headings} content={content} />
          )}

          <aside className="mt-10 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--gold-pale)] p-6 sm:p-8">
            <h2 className="text-lg font-bold text-[var(--navy)]">Need police station cover?</h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
              Browse accredited representatives by area or narrow results with filters — free for firms and reps.
            </p>
            <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
              <Link
                href="/Directory"
                className="btn-gold inline-flex justify-center !px-4 !py-2.5 !text-sm !no-underline sm:inline-flex"
              >
                Find reps — directory
              </Link>
              <Link
                href="/search"
                className="inline-flex justify-center rounded-lg border-2 border-[var(--navy)]/20 bg-white px-4 py-2.5 text-sm font-semibold text-[var(--navy)] no-underline transition-colors hover:border-[var(--gold-hover)] hover:text-[var(--gold-hover)] sm:inline-flex"
              >
                Advanced search
              </Link>
            </div>
          </aside>

          <p className="mt-10">
            <Link href="/Blog" className="font-medium text-[var(--gold-hover)] no-underline hover:text-[var(--gold)]">
              ← Back to blog
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
