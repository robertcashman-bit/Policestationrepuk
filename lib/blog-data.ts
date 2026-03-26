import type { BlogCategoryId } from '@/lib/blog/types';
import {
  getAllBlogArticles,
  getBlogArticle,
  getRelatedArticles,
  toListItem,
} from '@/lib/blog/registry';

export type { BlogCategoryId };

/** List card + navigation (blog index, sitemap). */
export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  published: string;
  modified: string;
  categories: BlogCategoryId[];
  image: { src: string; alt: string };
}

export function getAllBlogPosts(): BlogPost[] {
  return getAllBlogArticles().map(toListItem);
}

export function getBlogPostBySlug(slug: string): BlogPost | null {
  const a = getBlogArticle(slug);
  return a ? toListItem(a) : null;
}

export function getFullBlogArticle(slug: string) {
  return getBlogArticle(slug);
}

export function getBlogRelatedForSlug(slug: string, relatedSlugs: string[]) {
  return getRelatedArticles(slug, relatedSlugs, 3);
}
