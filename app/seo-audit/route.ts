import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * GET /seo-audit
 *
 * Serves the self-contained SEO audit dashboard from public/seo-audit.html.
 * Using a route handler instead of relying on public/ file serving avoids
 * conflicts with the [slug] dynamic catch-all route.
 */
export function GET(): Response {
  const html = readFileSync(
    join(process.cwd(), 'public', 'seo-audit.html'),
    'utf-8',
  );

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      'X-Robots-Tag': 'noindex',
    },
  });
}
