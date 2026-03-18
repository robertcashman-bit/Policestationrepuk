/**
 * Generate public/sitemap.xml and public/robots.txt from data/pages.json.
 * Run after crawl: node scripts/generate-static-seo.js
 * Or: npm run generate-seo
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(process.cwd(), 'data');
const PUBLIC_DIR = path.join(process.cwd(), 'public');
const PAGES_PATH = path.join(DATA_DIR, 'pages.json');
const BASE_URL = 'https://policestationrepuk.com';

function main() {
  if (!fs.existsSync(PAGES_PATH)) {
    console.warn('data/pages.json not found. Run: node scripts/crawl-site.js');
    return;
  }
  const data = JSON.parse(fs.readFileSync(PAGES_PATH, 'utf-8'));
  const pages = data.pages || [];
  const urls = pages.map((p) => (p.path === '/' ? BASE_URL : BASE_URL + p.path));

  fs.mkdirSync(PUBLIC_DIR, { recursive: true });

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${escapeXml(u)}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`).join('\n')}
</urlset>`;
  fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap.xml'), sitemap, 'utf-8');
  console.log('Wrote public/sitemap.xml (' + urls.length + ' URLs)');

  const robots = `User-agent: *
Allow: /

Sitemap: ${BASE_URL}/sitemap.xml
`;
  fs.writeFileSync(path.join(PUBLIC_DIR, 'robots.txt'), robots, 'utf-8');
  console.log('Wrote public/robots.txt');
}

function escapeXml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

main();
