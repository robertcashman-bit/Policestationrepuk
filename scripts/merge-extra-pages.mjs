import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const CRAWL_DIR = resolve(ROOT, 'content/crawl');

const pagesPath = resolve(ROOT, 'data/pages.json');
const pagesData = JSON.parse(readFileSync(pagesPath, 'utf-8'));
const existingPaths = new Set(pagesData.pages.map(p => p.path.toLowerCase()));

console.log(`Existing pages.json: ${pagesData.pages.length} pages\n`);

// Read all crawl files and find ones NOT in pages.json
const allFiles = readdirSync(CRAWL_DIR).filter(f => f.endsWith('.json') && f !== 'manifest.json');

let added = 0;
let skipped = 0;

// Skip patterns
const SKIP = [
  /^www\./i, /^blog-/i, /^feed/i, /^functions/i, /^admin/i,
  /^502/i, /^Not /i, /^N\.json$/i, /^Home\b/i, /^Profile\b/i,
  /^Register\b/i,
];

for (const file of allFiles) {
  const base = file.replace('.json', '');
  if (SKIP.some(p => p.test(base))) { skipped++; continue; }

  try {
    const data = JSON.parse(readFileSync(resolve(CRAWL_DIR, file), 'utf-8'));
    const pagePath = data.path || '/' + base;
    
    if (existingPaths.has(pagePath.toLowerCase())) {
      skipped++;
      continue;
    }
    
    if (!data.content || data.content.length < 100) {
      skipped++;
      continue;
    }

    // Add to pages.json in the same format
    pagesData.pages.push({
      url: data.url || `https://policestationrepuk.com${pagePath}`,
      path: pagePath,
      title: data.title || base.replace(/-/g, ' '),
      headings: data.headings || [],
      content: data.content || '',
      links: data.links || [],
      images: [],
      crawledAt: data.crawledAt || new Date().toISOString(),
    });
    existingPaths.add(pagePath.toLowerCase());
    added++;
    console.log(`  + ${pagePath}`);
  } catch {
    skipped++;
  }
}

pagesData.count = pagesData.pages.length;
writeFileSync(pagesPath, JSON.stringify(pagesData));
console.log(`\nAdded ${added} pages. Skipped ${skipped}. Total: ${pagesData.pages.length}`);
