import type { BlogArticle, BlogListItem } from './types';
import { BLOG_ARTICLES } from './articles-data';

const bySlug = new Map<string, BlogArticle>(BLOG_ARTICLES.map((a) => [a.slug, a]));

export const BLOG_SLUG_SET = new Set(BLOG_ARTICLES.map((a) => a.slug));

export function getAllBlogArticles(): BlogArticle[] {
  return [...BLOG_ARTICLES].sort(
    (a, b) => new Date(b.published).getTime() - new Date(a.published).getTime()
  );
}

export function getBlogArticle(slug: string): BlogArticle | null {
  return bySlug.get(slug) ?? null;
}

export function toListItem(a: BlogArticle): BlogListItem {
  return {
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt,
    published: a.published,
    modified: a.modified,
    categories: a.categories,
    image: { src: a.image.src, alt: a.image.alt },
  };
}

export function getRelatedArticles(slug: string, relatedSlugs: string[], limit = 3): BlogArticle[] {
  const out: BlogArticle[] = [];
  for (const s of relatedSlugs) {
    if (s === slug) continue;
    const a = bySlug.get(s);
    if (a) out.push(a);
    if (out.length >= limit) break;
  }
  if (out.length < limit) {
    for (const a of getAllBlogArticles()) {
      if (a.slug === slug || out.some((x) => x.slug === a.slug)) continue;
      out.push(a);
      if (out.length >= limit) break;
    }
  }
  return out.slice(0, limit);
}
