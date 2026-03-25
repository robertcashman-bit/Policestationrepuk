import fs from 'fs';
import path from 'path';

export interface BlogPost {
  title: string;
  slug: string;
}

export interface BlogCrawlRecord {
  url?: string;
  path?: string;
  title?: string;
  headings?: { level: number; text: string }[];
  content?: string;
  links?: { href: string; text: string }[];
}

const CRAWL_DIR = path.join(process.cwd(), 'content', 'crawl');

/**
 * When crawl JSON is placeholder-only, link to a host that still has the long-form post.
 * Default: legacy .com mirror. Override with NEXT_PUBLIC_LEGACY_BLOG_MIRROR_ORIGIN when fully migrated.
 */
const LEGACY_BLOG_MIRROR_ORIGIN =
  process.env.NEXT_PUBLIC_LEGACY_BLOG_MIRROR_ORIGIN?.replace(/\/$/, '').trim() || 'https://www.policestationrepuk.com';

export function getLiveBlogArticleUrl(slug: string): string {
  return `${LEGACY_BLOG_MIRROR_ORIGIN}/blog/${encodeURI(slug)}`;
}

let _cache: BlogPost[] | null = null;

export function getAllBlogPosts(): BlogPost[] {
  if (_cache) return _cache;

  if (!fs.existsSync(CRAWL_DIR)) {
    _cache = [];
    return _cache;
  }

  const files = fs.readdirSync(CRAWL_DIR).filter((f) => f.startsWith('blog-') && f.endsWith('.json'));

  const posts: BlogPost[] = [];

  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(CRAWL_DIR, file), 'utf-8');
      const data = JSON.parse(raw);
      const slug = file.replace(/\.json$/, '').replace(/^blog-/, '');

      const h1 = data.headings?.find((h: { level: number; text: string }) => h.level === 1)?.text;
      const cleanH1 = h1 ? h1.replace(/\s*\|\s*PoliceStationRepUK.*$/i, '').replace(/\s*\|\s*PSR Connect.*$/i, '').trim() : '';
      const title = cleanH1 && cleanH1 !== '404' && cleanH1.length > 3
        ? cleanH1
        : slug
            .replace(/-/g, ' ')
            .replace(/\b\w/g, (c: string) => c.toUpperCase());

      if (title && slug) {
        posts.push({ title, slug });
      }
    } catch {
      // skip malformed files
    }
  }

  posts.sort((a, b) => a.title.localeCompare(b.title));
  _cache = posts;
  return _cache;
}

const SAFE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i;

/** Load raw crawl JSON for a blog post slug (file name `blog-{slug}.json`). */
export function loadBlogCrawlFile(slug: string): BlogCrawlRecord | null {
  if (!slug || !SAFE_SLUG.test(slug)) return null;
  const filePath = path.join(CRAWL_DIR, `blog-${slug}.json`);
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as BlogCrawlRecord;
  } catch {
    return null;
  }
}

/** Crawl snapshots that only captured Wix “app shell” 404s — no article body on .org yet. */
export function isPlaceholderBlogRecord(data: BlogCrawlRecord | null): boolean {
  if (!data) return true;
  const h1 = data.headings?.find((h) => h.level === 1)?.text?.trim();
  if (h1 === '404') return true;
  const c = data.content ?? '';
  return (
    /could not be found in this application/i.test(c) ||
    /^404\s*Page Not Found/i.test(c.trim())
  );
}

export function getBlogPostBySlug(slug: string): BlogPost | null {
  return getAllBlogPosts().find((p) => p.slug === slug) ?? null;
}
