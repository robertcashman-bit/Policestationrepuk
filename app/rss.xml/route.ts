import { getAllBlogArticles } from '@/lib/blog/registry';
import { SITE_NAME, SITE_URL } from '@/lib/seo-layer/config';

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function GET(): Response {
  const posts = getAllBlogArticles();
  const items = posts
    .map((post) => {
      const url = `${SITE_URL}/Blog/${post.slug}`;
      const pub = new Date(post.published).toUTCString();
      return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <pubDate>${pub}</pubDate>
      <description>${escapeXml(post.excerpt)}</description>
    </item>`;
    })
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_NAME)} Blog</title>
    <link>${escapeXml(`${SITE_URL}/Blog`)}</link>
    <description>Articles for freelance police station representatives and criminal defence firms.</description>
    <language>en-gb</language>
    <atom:link href="${escapeXml(`${SITE_URL}/rss.xml`)}" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
