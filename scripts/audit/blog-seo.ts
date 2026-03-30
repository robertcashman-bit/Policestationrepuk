/**
 * Validates editorial blog articles for SEO invariants (CI-safe).
 * Run: npx tsx scripts/audit/blog-seo.ts
 */
import { getAllBlogArticles } from '../../lib/blog/registry';

const MIN_META_DESC = 120;
const MAX_META_DESC = 165;
const MIN_META_TITLE = 25;
const MAX_META_TITLE = 65;
const MIN_INTERNAL_LINK_MARKDOWN = 3; // [text](path) same-site paths

function countInternalLinks(md: string): number {
  const re = /\]\((\/[a-zA-Z0-9/_?=&%-]*)\)/g;
  let n = 0;
  let m;
  while ((m = re.exec(md)) !== null) {
    if (m[1].startsWith('//')) continue;
    n++;
  }
  return n;
}

function countH2(md: string): number {
  return (md.match(/^## /gm) || []).length;
}

function main() {
  const articles = getAllBlogArticles();
  const errors: string[] = [];
  const titles = new Map<string, string>();
  const descs = new Map<string, string>();

  for (const a of articles) {
    const L = (s: string) => `[${a.slug}] ${s}`;

    if (a.metaTitle.length < MIN_META_TITLE || a.metaTitle.length > MAX_META_TITLE) {
      errors.push(L(`metaTitle length ${a.metaTitle.length} (want ${MIN_META_TITLE}-${MAX_META_TITLE})`));
    }
    if (a.metaDescription.length < MIN_META_DESC || a.metaDescription.length > MAX_META_DESC) {
      errors.push(L(`metaDescription length ${a.metaDescription.length} (want ${MIN_META_DESC}-${MAX_META_DESC})`));
    }
    if (!a.primaryKeyword?.trim()) errors.push(L('missing primaryKeyword'));

    const h2 = countH2(a.bodyMarkdown);
    if (h2 < 3) errors.push(L(`expected at least 3 ## headings, got ${h2}`));

    const links = countInternalLinks(a.bodyMarkdown);
    if (links < MIN_INTERNAL_LINK_MARKDOWN) {
      errors.push(L(`expected at least ${MIN_INTERNAL_LINK_MARKDOWN} internal markdown links, got ${links}`));
    }

    if (!a.faqs || a.faqs.length < 3) {
      errors.push(L(`expected at least 3 FAQs, got ${a.faqs?.length ?? 0}`));
    }

    const tKey = a.metaTitle.trim().toLowerCase();
    if (titles.has(tKey)) errors.push(L(`duplicate metaTitle with ${titles.get(tKey)}`));
    else titles.set(tKey, a.slug);

    const dKey = a.metaDescription.trim().toLowerCase();
    if (descs.has(dKey)) errors.push(L(`duplicate metaDescription with ${descs.get(dKey)}`));
    else descs.set(dKey, a.slug);

    const early = a.bodyMarkdown.slice(0, 600).toLowerCase();
    if (!early.includes(a.primaryKeyword.toLowerCase().split(/\s+/)[0])) {
      errors.push(L('primary keyword stem not found in first ~600 chars of body'));
    }
  }

  if (errors.length) {
    console.error('Blog SEO validation failed:\n' + errors.join('\n'));
    process.exit(1);
  }
  console.log(`Blog SEO OK — ${articles.length} articles`);
}

main();
