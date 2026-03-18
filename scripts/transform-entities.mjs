import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const RAW_DIR = resolve(ROOT, 'data/base44-raw');
const DATA_DIR = resolve(ROOT, 'data');

function loadRaw(name) {
  const p = resolve(RAW_DIR, `${name}.json`);
  if (!existsSync(p)) return [];
  return JSON.parse(readFileSync(p, 'utf-8')).filter(r => !r.is_sample);
}

function writeData(name, data) {
  writeFileSync(resolve(DATA_DIR, `${name}.json`), JSON.stringify(data, null, 2));
  console.log(`  Wrote data/${name}.json (${data.length} records)`);
}

console.log('=== Transform Base44 Entities ===\n');

// 1. WikiArticles -> wiki-articles.json
console.log('--- WikiArticle ---');
const wikiRaw = loadRaw('WikiArticle');
const wikiArticles = wikiRaw
  .filter(a => a.published)
  .map(a => ({
    id: a.id,
    title: a.title,
    slug: a.slug || a.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    category: a.category || 'General',
    content: a.content || '',
    excerpt: a.excerpt || '',
    difficulty: a.difficulty || '',
    tags: a.tags || [],
    views: a.views || 0,
    helpfulCount: a.helpful_count || 0,
    wordCount: a.word_count || 0,
    factCheckStatus: a.fact_check_status || '',
    publishedDate: a.created_date,
    lastImprovedDate: a.last_improved_date || null,
  }))
  .sort((a, b) => (b.views || 0) - (a.views || 0));

writeData('wiki-articles', wikiArticles);
console.log(`  Categories: ${[...new Set(wikiArticles.map(a => a.category))].join(', ')}`);

// 2. LawFirm -> law-firms.json
console.log('\n--- LawFirm ---');
const firmsRaw = loadRaw('LawFirm');
const lawFirms = firmsRaw
  .filter(f => f.status === 'active')
  .map(f => ({
    id: f.id,
    name: f.firm_name,
    sraNumber: f.sra_number || '',
    address: f.address || '',
    postcode: f.postcode || '',
    phone: f.phone || '',
    email: f.email || '',
    website: f.website || '',
    specialisms: f.specialisms || [],
    county: f.county || '',
    region: f.region || '',
    sizeCategory: f.size_category || '',
    criminalLawPractice: f.criminal_law_practice || false,
    policeStationWork: f.police_station_work || false,
    dutySolicitorScheme: f.duty_solicitor_scheme || false,
    lastVerified: f.last_verified || null,
    slug: (f.firm_name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

writeData('law-firms', lawFirms);
const firmsByCounty = {};
lawFirms.forEach(f => { firmsByCounty[f.county || 'Unknown'] = (firmsByCounty[f.county || 'Unknown'] || 0) + 1; });
console.log(`  Firms by county (top 10):`);
Object.entries(firmsByCounty).sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([c, n]) => {
  console.log(`    ${c}: ${n}`);
});

// 3. LegalUpdate -> legal-updates.json
console.log('\n--- LegalUpdate ---');
const updatesRaw = loadRaw('LegalUpdate');
const legalUpdates = updatesRaw
  .filter(u => u.published)
  .map(u => ({
    id: u.id,
    title: u.title,
    slug: u.slug,
    excerpt: u.excerpt || '',
    content: u.content || '',
    category: u.category || '',
    tags: u.tags || [],
    author: u.author || '',
    featuredImageUrl: u.featured_image_url || null,
    isFeatured: u.is_featured || false,
    publishedDate: u.published_date || u.created_date,
    views: u.views || 0,
  }))
  .sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime());

writeData('legal-updates', legalUpdates);

// 4. FormDocument -> form-documents.json
console.log('\n--- FormDocument ---');
const formsRaw = loadRaw('FormDocument');
const formDocuments = formsRaw.map(f => ({
  id: f.id,
  title: f.title,
  description: f.description || '',
  fileUrl: f.file_url || '',
  category: f.category || '',
  isFeatured: f.is_featured || false,
})).sort((a, b) => {
  if (a.isFeatured !== b.isFeatured) return b.isFeatured ? 1 : -1;
  return a.title.localeCompare(b.title);
});

writeData('form-documents', formDocuments);
const formsByCategory = {};
formDocuments.forEach(f => { formsByCategory[f.category || 'Other'] = (formsByCategory[f.category || 'Other'] || 0) + 1; });
console.log(`  Categories: ${Object.entries(formsByCategory).map(([c, n]) => `${c} (${n})`).join(', ')}`);

// 5. RedirectRule -> redirects.json
console.log('\n--- RedirectRule ---');
const redirectsRaw = loadRaw('RedirectRule');
const redirects = redirectsRaw
  .filter(r => r.enabled)
  .map(r => ({
    from: r.from_path,
    to: r.to_path,
    statusCode: parseInt(r.status_code) || 301,
    notes: r.notes || '',
  }));

writeData('redirects', redirects);
redirects.forEach(r => console.log(`  ${r.from} -> ${r.to} (${r.statusCode})`));

// Summary
console.log('\n=== TRANSFORMATION SUMMARY ===\n');
console.log(`  Wiki Articles:   ${wikiArticles.length} published (${wikiRaw.length} total)`);
console.log(`  Law Firms:       ${lawFirms.length} active (${firmsRaw.length} total)`);
console.log(`  Legal Updates:   ${legalUpdates.length} published (${updatesRaw.length} total)`);
console.log(`  Form Documents:  ${formDocuments.length}`);
console.log(`  Redirect Rules:  ${redirects.length} enabled`);
console.log('\n=== DONE ===');
