import fs from 'fs';
import path from 'path';

export interface BlogPost {
  title: string;
  slug: string;
}

const CRAWL_DIR = path.join(process.cwd(), 'content', 'crawl');

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
