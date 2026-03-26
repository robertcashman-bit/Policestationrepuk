export type BlogCategoryId = 'freelance-reps' | 'law-firms' | 'best-practice' | 'attendance';

export interface BlogArticle {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  primaryKeyword: string;
  categories: BlogCategoryId[];
  published: string;
  modified: string;
  excerpt: string;
  summary: string;
  image: { src: string; alt: string; width: number; height: number };
  relatedSlugs: string[];
  faqs?: { q: string; a: string }[];
  /** Markdown body: use ## / ### only (H1 is the page hero). */
  bodyMarkdown: string;
}

export interface BlogListItem {
  slug: string;
  title: string;
  excerpt: string;
  published: string;
  modified: string;
  categories: BlogCategoryId[];
  image: { src: string; alt: string };
}
