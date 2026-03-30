/**
 * Sanity-check JSON-LD objects for blog posts (shape only, no external validator).
 * Run: npx tsx scripts/audit/validate-blog-schema.ts
 */
import { getAllBlogArticles } from '../../lib/blog/registry';
import { SITE_URL } from '../../lib/seo-layer/config';
import { blogPostingSchema } from '../../lib/seo-layer/schemas';

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

function main() {
  for (const a of getAllBlogArticles()) {
    const imageUrl = `${SITE_URL}${a.image.src}`;
    const o = blogPostingSchema({
      title: a.title,
      slug: a.slug,
      description: a.metaDescription,
      datePublished: a.published,
      dateModified: a.modified,
      imageUrl,
    }) as Record<string, unknown>;

    assert(o['@type'] === 'BlogPosting', `${a.slug}: @type`);
    assert(typeof o.headline === 'string' && o.headline.length > 0, `${a.slug}: headline`);
    assert(Array.isArray(o.image) && (o.image as string[]).length > 0, `${a.slug}: image`);
    assert(typeof o.datePublished === 'string', `${a.slug}: datePublished`);
    assert(o.author && typeof o.author === 'object', `${a.slug}: author`);
    assert(o.publisher && typeof o.publisher === 'object', `${a.slug}: publisher`);
    const author = o.author as Record<string, unknown>;
    assert(author['@type'] === 'Person', `${a.slug}: author @type Person`);
    assert(typeof author.name === 'string' && author.name.length > 0, `${a.slug}: author.name`);
    const pub = o.publisher as Record<string, unknown>;
    assert(pub['@type'] === 'Organization', `${a.slug}: publisher @type Organization`);
  }
  console.log('BlogPosting schema shape OK');
}

main();
