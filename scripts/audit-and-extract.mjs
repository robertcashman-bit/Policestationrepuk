import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const CRAWL_DIR = resolve(ROOT, 'content/crawl');
const APP_DIR = resolve(ROOT, 'app');

// Pages that are admin/test/internal and should NOT be recreated
const SKIP_PAGES = new Set([
  '/Account', '/ComprehensiveTestSuite', '/DataEnrichment', '/DiagnosticReport',
  '/EmailTest', '/FeaturedCheckout', '/FeaturedSuccess', '/FinalDiagnosticReport',
  '/HealthCheck', '/PaymentCancel', '/PaymentSuccess', '/SEOStrategy',
  '/StripePaymentSimulator', '/SubscriptionTest', '/TestPaywallGuard',
  '/TestStripeFlow', '/SendablePost', '/google03385fbe80cfcd6b',
  '/admin', '/functions-sitemap', '/feed.xml', '/feed',
]);

// Pages handled by dynamic routes or rewrites
const DYNAMIC_PAGES = new Set([
  '/FindYourRep', '/Directory', '/RepProfile', '/SpotlightProfile',
  '/FirmProfile', '/ForumPost', '/LegalUpdateDetail', '/WikiArticle',
  '/CountyReps', '/Register',
]);

// County SEO pages handled by rewrites
const COUNTY_SEO = new Set([
  '/PoliceStationRepsBerkshire', '/PoliceStationRepsEssex',
  '/PoliceStationRepsHampshire', '/PoliceStationRepsHertfordshire',
  '/PoliceStationRepsKent', '/PoliceStationRepsLondon',
  '/PoliceStationRepsManchester', '/PoliceStationRepsNorfolk',
  '/PoliceStationRepsSuffolk', '/PoliceStationRepsSurrey',
  '/PoliceStationRepsSussex', '/PoliceStationRepsWestMidlands',
  '/PoliceStationRepsWestYorkshire',
]);

// Read manifest
const manifest = JSON.parse(readFileSync(resolve(CRAWL_DIR, 'manifest.json'), 'utf-8'));

// Check which pages exist in app/ directory
function pageExists(pagePath) {
  // Normalize: /About -> app/About/page.tsx
  const name = pagePath.replace(/^\//, '');
  const candidates = [
    resolve(APP_DIR, name, 'page.tsx'),
    resolve(APP_DIR, name, 'page.ts'),
    resolve(APP_DIR, name, 'page.jsx'),
    resolve(APP_DIR, name.toLowerCase(), 'page.tsx'),
  ];
  return candidates.some(c => existsSync(c));
}

console.log('=== CRAWL PAGE AUDIT ===\n');

const existing = [];
const missing = [];
const skipped = [];
const dynamic = [];
const countySeo = [];

for (const page of manifest.pages) {
  const p = page.path;
  if (SKIP_PAGES.has(p)) {
    skipped.push(p);
  } else if (DYNAMIC_PAGES.has(p)) {
    dynamic.push(p);
  } else if (COUNTY_SEO.has(p)) {
    countySeo.push(p);
  } else if (pageExists(p)) {
    existing.push(p);
  } else {
    missing.push(p);
  }
}

console.log(`Existing pages: ${existing.length}`);
existing.forEach(p => console.log(`  ✓ ${p}`));

console.log(`\nSkipped (admin/test): ${skipped.length}`);
skipped.forEach(p => console.log(`  ⊘ ${p}`));

console.log(`\nDynamic (handled by routes): ${dynamic.length}`);
dynamic.forEach(p => console.log(`  ↻ ${p}`));

console.log(`\nCounty SEO (handled by rewrites): ${countySeo.length}`);
countySeo.forEach(p => console.log(`  ↻ ${p}`));

console.log(`\n=== MISSING PAGES (need to create): ${missing.length} ===`);
missing.forEach(p => console.log(`  ✗ ${p}`));

// Now read each missing page's crawl file and extract content
console.log('\n\n=== EXTRACTING CONTENT FOR MISSING PAGES ===\n');

const pageData = [];

for (const page of manifest.pages) {
  const p = page.path;
  if (SKIP_PAGES.has(p) || DYNAMIC_PAGES.has(p) || COUNTY_SEO.has(p)) continue;
  
  try {
    const crawlFile = resolve(CRAWL_DIR, page.file);
    const data = JSON.parse(readFileSync(crawlFile, 'utf-8'));
    
    pageData.push({
      path: p,
      title: data.title || '',
      headings: data.headings || [],
      content: data.content || '',
      links: data.links || [],
      exists: pageExists(p),
    });
  } catch { /* skip unreadable */ }
}

// Save extracted page data
writeFileSync(
  resolve(ROOT, 'data/crawl-pages.json'),
  JSON.stringify(pageData, null, 2)
);
console.log(`Saved data/crawl-pages.json (${pageData.length} pages)`);

// Also scan ALL crawl files (not just manifest) for additional pages
console.log('\n=== SCANNING ALL CRAWL FILES (beyond manifest) ===\n');

const allCrawlFiles = readdirSync(CRAWL_DIR).filter(f => f.endsWith('.json') && f !== 'manifest.json');
const manifestFiles = new Set(manifest.pages.map(p => p.file));
const extraFiles = allCrawlFiles.filter(f => !manifestFiles.has(f));

console.log(`Total crawl JSONs: ${allCrawlFiles.length}`);
console.log(`In manifest: ${manifestFiles.size}`);
console.log(`Extra files (not in manifest): ${extraFiles.length}`);

// Categorize extra files
const blogPosts = [];
const kentPages = [];
const stationPages = [];
const solicitorPages = [];
const otherExtras = [];

for (const file of extraFiles) {
  try {
    const data = JSON.parse(readFileSync(resolve(CRAWL_DIR, file), 'utf-8'));
    const entry = {
      file,
      path: data.path || data.url || '',
      title: data.title || file.replace('.json', ''),
      contentLength: (data.content || '').length,
    };
    
    if (file.startsWith('blog-') || (data.path || '').includes('/blog')) {
      blogPosts.push(entry);
    } else if (file.includes('kent') || file.includes('Kent') || file.includes('maidstone') || 
               file.includes('medway') || file.includes('tonbridge') || file.includes('swanley') ||
               file.includes('gravesend') || file.includes('sevenoaks') || file.includes('ashford') ||
               file.includes('canterbury') || file.includes('tunbridge') || file.includes('sittingbourne') ||
               file.includes('deal') || file.includes('bromley') || file.includes('bluewater')) {
      kentPages.push(entry);
    } else if (file.includes('police-station') || file.includes('station')) {
      stationPages.push(entry);
    } else if (file.includes('solicitor')) {
      solicitorPages.push(entry);
    } else {
      otherExtras.push(entry);
    }
  } catch { /* skip */ }
}

console.log(`\n  Blog posts: ${blogPosts.length}`);
blogPosts.forEach(p => console.log(`    📝 ${p.title.substring(0, 80)}`));

console.log(`\n  Kent-specific pages: ${kentPages.length}`);
kentPages.forEach(p => console.log(`    📍 ${p.title.substring(0, 80)}`));

console.log(`\n  Station pages: ${stationPages.length}`);
stationPages.forEach(p => console.log(`    🏢 ${p.title.substring(0, 80)}`));

console.log(`\n  Solicitor pages: ${solicitorPages.length}`);
solicitorPages.forEach(p => console.log(`    ⚖️ ${p.title.substring(0, 80)}`));

console.log(`\n  Other extras: ${otherExtras.length}`);
otherExtras.forEach(p => console.log(`    📄 ${p.title.substring(0, 80)}`));

// Summary
console.log('\n\n=== FINAL SUMMARY ===\n');
console.log(`Pages in manifest: ${manifest.pages.length}`);
console.log(`Already built: ${existing.length}`);
console.log(`Missing (to create): ${missing.length}`);
console.log(`Skipped (admin): ${skipped.length}`);
console.log(`Dynamic/rewrite: ${dynamic.length + countySeo.length}`);
console.log(`Extra crawl files: ${extraFiles.length}`);
console.log(`  Blog posts: ${blogPosts.length}`);
console.log(`  Kent pages: ${kentPages.length}`);
console.log(`  Station pages: ${stationPages.length}`);
console.log(`  Solicitor pages: ${solicitorPages.length}`);
console.log(`  Other: ${otherExtras.length}`);

// Write detailed missing pages for the next step
const missingDetails = [];
for (const p of missing) {
  const page = manifest.pages.find(pg => pg.path === p);
  if (!page) continue;
  try {
    const data = JSON.parse(readFileSync(resolve(CRAWL_DIR, page.file), 'utf-8'));
    missingDetails.push({
      path: p,
      title: data.title,
      headings: data.headings,
      content: data.content,
      contentLength: (data.content || '').length,
    });
  } catch { /* skip */ }
}

writeFileSync(
  resolve(ROOT, 'data/missing-pages.json'),
  JSON.stringify(missingDetails, null, 2)
);
console.log(`\nSaved data/missing-pages.json (${missingDetails.length} pages with content)`);

console.log('\n=== DONE ===');
