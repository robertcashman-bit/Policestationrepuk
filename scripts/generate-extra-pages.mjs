import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const CRAWL_DIR = resolve(ROOT, 'content/crawl');
const APP_DIR = resolve(ROOT, 'app');

function escapeJsx(str) {
  return str.replace(/&/g, '&amp;').replace(/'/g, "&apos;").replace(/`/g, '\\`').replace(/\$/g, '\\$');
}

function escapeString(str) {
  return str.replace(/'/g, "\\'").replace(/\\/g, '\\\\');
}

// Pages to skip entirely — admin, external sites, feeds, duplicates, etc.
const SKIP_PATTERNS = [
  /^www\./,           // External sites
  /^blog-/,           // Blog posts redirect to external
  /^feed/,            // RSS/feed
  /^functions/,       // Base44 functions
  /^admin/,           // Admin
  /^502/,             // Error pages
  /^Not /,            // Error pages
  /^N\.json/,         // Invalid
  /^Profile/,         // Dynamic
  /^Register/,        // Already exists
  /^Home/,            // Already exists (/)
  /^Admin/,           // Admin
];

// Pages that already exist (manifest pages are already handled)
const manifest = JSON.parse(readFileSync(resolve(CRAWL_DIR, 'manifest.json'), 'utf-8'));
const manifestFiles = new Set(manifest.pages.map(p => p.file));

// Get all extra crawl files
const allFiles = readdirSync(CRAWL_DIR).filter(f => f.endsWith('.json') && f !== 'manifest.json');
const extraFiles = allFiles.filter(f => !manifestFiles.has(f));

function shouldSkip(filename) {
  const base = filename.replace('.json', '');
  return SKIP_PATTERNS.some(p => p.test(base));
}

function pathToAppDir(pagePath) {
  // /police-station-rep-kent -> app/[...slug]/
  // These all go under the catch-all route
  return pagePath.replace(/^\//, '');
}

function pageExistsInApp(pagePath) {
  const name = pagePath.replace(/^\//, '');
  const candidates = [
    resolve(APP_DIR, name, 'page.tsx'),
    resolve(APP_DIR, name.toLowerCase(), 'page.tsx'),
  ];
  return candidates.some(c => existsSync(c));
}

console.log('=== PROCESSING EXTRA CRAWL FILES ===\n');

const contentPages = [];
let skippedCount = 0;
let alreadyExists = 0;
let validPages = 0;

for (const file of extraFiles) {
  if (shouldSkip(file)) {
    skippedCount++;
    continue;
  }

  try {
    const data = JSON.parse(readFileSync(resolve(CRAWL_DIR, file), 'utf-8'));
    const pagePath = data.path || '/' + file.replace('.json', '');
    const title = data.title || file.replace('.json', '').replace(/-/g, ' ');
    const content = data.content || '';
    const headings = data.headings || [];

    // Skip empty or very short pages
    if (content.length < 100) {
      skippedCount++;
      continue;
    }

    // Skip if page already exists
    if (pageExistsInApp(pagePath)) {
      alreadyExists++;
      continue;
    }

    contentPages.push({
      path: pagePath,
      file,
      title: title.replace(/\s*\|.*$/, '').trim(),
      content,
      headings,
      contentLength: content.length,
    });
    validPages++;
  } catch {
    skippedCount++;
  }
}

console.log(`Total extra files: ${extraFiles.length}`);
console.log(`Skipped (admin/external/empty): ${skippedCount}`);
console.log(`Already exists: ${alreadyExists}`);
console.log(`Valid content pages: ${validPages}\n`);

// Save as structured data for the catch-all route
const pageDataForCatchAll = contentPages.map(p => {
  const h1 = p.headings.find(h => h.level === 1)?.text || p.title;
  const h2s = p.headings.filter(h => h.level === 2);

  // Extract sections
  const sections = [];
  for (let i = 0; i < h2s.length; i++) {
    const heading = h2s[i].text;
    const nextHeading = h2s[i + 1]?.text;
    const startIdx = p.content.indexOf(heading);
    if (startIdx === -1) continue;
    const afterHeading = startIdx + heading.length;
    let endIdx = nextHeading ? p.content.indexOf(nextHeading, afterHeading) : p.content.length;
    if (endIdx === -1) endIdx = p.content.length;
    const text = p.content.substring(afterHeading, endIdx).trim().substring(0, 1000);
    sections.push({ heading, text });
  }

  // Extract intro
  let intro = '';
  const h1Idx = p.content.indexOf(h1);
  const firstH2 = h2s[0]?.text;
  if (h1Idx >= 0 && firstH2) {
    const firstH2Idx = p.content.indexOf(firstH2, h1Idx);
    if (firstH2Idx > h1Idx) {
      intro = p.content.substring(h1Idx + h1.length, firstH2Idx).trim().substring(0, 400);
    }
  } else if (h1Idx >= 0) {
    intro = p.content.substring(h1Idx + h1.length).trim().substring(0, 400);
  }

  const slug = p.path.replace(/^\//, '').toLowerCase();

  return {
    slug,
    path: p.path,
    title: p.title,
    h1,
    intro,
    sections,
    metaDescription: intro.substring(0, 155) || `${p.title} — PoliceStationRepUK`,
  };
});

writeFileSync(
  resolve(ROOT, 'data/extra-pages.json'),
  JSON.stringify(pageDataForCatchAll, null, 2)
);

console.log(`Saved data/extra-pages.json (${pageDataForCatchAll.length} pages)\n`);

// List pages by category
const kentPages = pageDataForCatchAll.filter(p => 
  p.slug.includes('kent') || p.slug.includes('ashford') || p.slug.includes('canterbury') ||
  p.slug.includes('maidstone') || p.slug.includes('medway') || p.slug.includes('tonbridge') ||
  p.slug.includes('swanley') || p.slug.includes('gravesend') || p.slug.includes('sevenoaks') ||
  p.slug.includes('tunbridge') || p.slug.includes('sittingbourne') || p.slug.includes('deal') ||
  p.slug.includes('bromley') || p.slug.includes('bluewater') || p.slug.includes('dover') ||
  p.slug.includes('folkestone') || p.slug.includes('margate') || p.slug.includes('chatham') ||
  p.slug.includes('rochester') || p.slug.includes('herne') || p.slug.includes('ramsgate') ||
  p.slug.includes('whitstable') || p.slug.includes('sandwich') || p.slug.includes('faversham') ||
  p.slug.includes('gillingham') || p.slug.includes('dartford') || p.slug.includes('coldharbour')
);

const infoPages = pageDataForCatchAll.filter(p => !kentPages.includes(p));

console.log(`Kent/local pages: ${kentPages.length}`);
kentPages.forEach(p => console.log(`  📍 ${p.slug} — ${p.title}`));

console.log(`\nInformational pages: ${infoPages.length}`);
infoPages.forEach(p => console.log(`  📄 ${p.slug} — ${p.title}`));

console.log('\n=== DONE ===');
