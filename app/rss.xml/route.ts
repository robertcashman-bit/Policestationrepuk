/**
 * GET /rss.xml
 *
 * Generates a valid RSS 2.0 feed from the 20 most-recent blog articles.
 *
 * The feed is also reachable at /feed.xml and /feed via permanent 301 redirects
 * defined in next.config.ts (source: /feed.xml → destination: /rss.xml, etc.).
 *
 * The RSS autodiscovery <link> tag is declared in app/layout.tsx so browsers
 * and feed readers can detect the feed automatically.
 *
 * RSS 2.0 spec: https://www.rssboard.org/rss-specification
 */

import { getAllBlogArticles } from '@/lib/blog/registry';
import { SITE_NAME, SITE_URL } from '@/lib/seo-layer/config';
import type { BlogCategoryId } from '@/lib/blog/types';

/** Human-readable labels for the internal blog category IDs used in <category> elements. */
const CATEGORY_LABELS: Record<BlogCategoryId, string> = {
  'freelance-reps': 'Freelance Reps',
  'law-firms':      'Law Firms',
  'best-practice':  'Best Practice',
  'attendance':     'Attendance',
};

/**
 * Escape the five XML special characters so the feed is well-formed XML
 * and validates correctly in feed validators such as validator.w3.org/feed/.
 */
function escapeXml(raw: string): string {
  return raw
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&apos;');
}

/** RSS 2.0 date format: RFC 2822 / RFC 822. */
function toRssDate(iso: string): string {
  return new Date(iso).toUTCString();
}

/** Maximum number of items returned in the feed (RSS readers typically display the most recent). */
const FEED_ITEM_LIMIT = 20;

export function GET(): Response {
  // getAllBlogArticles() already returns articles sorted by published date descending.
  const posts = getAllBlogArticles().slice(0, FEED_ITEM_LIMIT);

  const feedUrl  = `${SITE_URL}/rss.xml`;
  const blogUrl  = `${SITE_URL}/Blog`;
  const iconUrl  = `${SITE_URL}/icons/icon-192.png`;

  // Build each <item> block. Each item maps one blog article to RSS 2.0 fields:
  //   title       → article title
  //   link        → absolute canonical URL
  //   guid        → same as link (isPermaLink=true guarantees uniqueness)
  //   pubDate     → RFC 2822 formatted publication date
  //   description → plain-text excerpt (not HTML, so no CDATA needed)
  //   author      → RFC 2822 format: email (Display Name)
  //   category    → one <category> per BlogCategoryId
  const items = posts
    .map((post) => {
      const url        = `${SITE_URL}/Blog/${post.slug}`;
      const pubDate    = toRssDate(post.published);
      const categories = post.categories
        .map((c) => `    <category>${escapeXml(CATEGORY_LABELS[c] ?? c)}</category>`)
        .join('\n');

      return `  <item>
    <title>${escapeXml(post.title)}</title>
    <link>${url}</link>
    <guid isPermaLink="true">${url}</guid>
    <pubDate>${pubDate}</pubDate>
    <description>${escapeXml(post.excerpt)}</description>
    <author>noreply@policestationrepuk.org (${escapeXml(SITE_NAME)} Editorial)</author>
${categories}
  </item>`;
    })
    .join('\n');

  // The <lastBuildDate> reflects when this response was generated.
  // Because of the s-maxage=3600 cache header, readers will see a fresh
  // date at most once per hour, which is fine for a content site.
  const lastBuildDate = new Date().toUTCString();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_NAME)} — Police Station Rep News &amp; Updates</title>
    <link>${blogUrl}</link>
    <description>Practical articles and legal updates for freelance police station representatives and criminal defence firms across England and Wales.</description>
    <language>en-gb</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml"/>
    <image>
      <url>${iconUrl}</url>
      <title>${escapeXml(SITE_NAME)}</title>
      <link>${SITE_URL}</link>
    </image>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type':  'application/rss+xml; charset=utf-8',
      // Cache for 1 hour at the CDN; stale responses served for up to 24 h
      // while a revalidation is in flight, keeping latency low.
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
