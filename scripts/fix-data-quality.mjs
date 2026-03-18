import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DATA = resolve(ROOT, 'data');

function load(name) {
  return JSON.parse(readFileSync(resolve(DATA, name), 'utf-8'));
}

function save(name, data) {
  writeFileSync(resolve(DATA, name), JSON.stringify(data, null, 2));
}

console.log('=== DATA QUALITY FIXES ===\n');

// 1. Fix reps with empty county — try to infer from raw Base44 data
console.log('--- REPS: Fix empty county ---');
const reps = load('reps.json');
const rawReps = load('base44-raw/Rep.json');

let fixedCounty = 0;
for (const rep of reps) {
  if (!rep.county || rep.county.trim() === '') {
    // Try to find in raw data
    const raw = rawReps.find(r => r.id === rep.id || r.name === rep.name);
    if (raw) {
      const county = raw.county || raw.address_county || '';
      if (county.trim()) {
        rep.county = county.trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
        fixedCounty++;
        console.log(`  Fixed: ${rep.name} → ${rep.county}`);
      } else {
        // Try to extract from address
        const addr = raw.address || '';
        const parts = addr.split(',').map(p => p.trim()).filter(Boolean);
        if (parts.length >= 2) {
          const maybeCounty = parts[parts.length - 1].replace(/\d+.*/, '').trim();
          if (maybeCounty.length > 2 && !maybeCounty.match(/^\d/)) {
            rep.county = maybeCounty.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
            fixedCounty++;
            console.log(`  Fixed (from address): ${rep.name} → ${rep.county}`);
          }
        }
      }
    }
  }
}

const stillEmpty = reps.filter(r => !r.county || r.county.trim() === '');
console.log(`  Fixed ${fixedCounty} reps. Still empty: ${stillEmpty.length}`);
if (stillEmpty.length > 0) {
  console.log(`  Remaining unfixed:`);
  stillEmpty.forEach(r => console.log(`    - ${r.name} (id: ${r.id})`));
}

save('reps.json', reps);

// 2. Fix stations — trailing spaces, duplicate slugs, malformed forceCodes
console.log('\n--- STATIONS: Fix data quality ---');
const stations = load('stations.json');

let trimmedNames = 0;
let fixedForceCodes = 0;
const slugCounts = {};

for (const s of stations) {
  // Trim names
  if (s.name !== s.name.trim()) {
    s.name = s.name.trim();
    trimmedNames++;
  }
  // Fix forceCode trailing dash
  if (s.forceCode && s.forceCode.endsWith('-')) {
    s.forceCode = s.forceCode.replace(/-$/, '');
    fixedForceCodes++;
  }
  // Track slug duplicates
  slugCounts[s.slug] = (slugCounts[s.slug] || 0) + 1;
}

// Deduplicate slugs by appending index
const slugSeen = {};
for (const s of stations) {
  if (slugCounts[s.slug] > 1) {
    slugSeen[s.slug] = (slugSeen[s.slug] || 0) + 1;
    if (slugSeen[s.slug] > 1) {
      const oldSlug = s.slug;
      s.slug = `${s.slug}-${slugSeen[s.slug]}`;
      console.log(`  Dedup slug: ${oldSlug} → ${s.slug} (${s.name})`);
    }
  }
}

console.log(`  Trimmed names: ${trimmedNames}`);
console.log(`  Fixed forceCodes: ${fixedForceCodes}`);
console.log(`  Dedup slugs: ${Object.values(slugSeen).filter(v => v > 1).length}`);

save('stations.json', stations);

// 3. Fix wiki articles — deduplicate slugs
console.log('\n--- WIKI ARTICLES: Fix duplicate slugs ---');
const wiki = load('wiki-articles.json');
const wikiSlugCounts = {};
wiki.forEach(a => { wikiSlugCounts[a.slug] = (wikiSlugCounts[a.slug] || 0) + 1; });

const wikiSlugSeen = {};
for (const a of wiki) {
  if (wikiSlugCounts[a.slug] > 1) {
    wikiSlugSeen[a.slug] = (wikiSlugSeen[a.slug] || 0) + 1;
    if (wikiSlugSeen[a.slug] > 1) {
      const oldSlug = a.slug;
      a.slug = `${a.slug}-${wikiSlugSeen[a.slug]}`;
      console.log(`  Dedup wiki slug: ${oldSlug} → ${a.slug}`);
    }
  }
}

save('wiki-articles.json', wiki);

// 4. Fix law firms — deduplicate slugs
console.log('\n--- LAW FIRMS: Fix duplicate slugs ---');
const firms = load('law-firms.json');
const firmSlugCounts = {};
firms.forEach(f => { firmSlugCounts[f.slug] = (firmSlugCounts[f.slug] || 0) + 1; });

let firmDeduped = 0;
const firmSlugSeen = {};
for (const f of firms) {
  if (firmSlugCounts[f.slug] > 1) {
    firmSlugSeen[f.slug] = (firmSlugSeen[f.slug] || 0) + 1;
    if (firmSlugSeen[f.slug] > 1) {
      const county = (f.county || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      f.slug = county ? `${f.slug}-${county}` : `${f.slug}-${firmSlugSeen[f.slug]}`;
      firmDeduped++;
    }
  }
}
console.log(`  Deduped firm slugs: ${firmDeduped}`);

save('law-firms.json', firms);

// 5. Fix form documents — empty categories
console.log('\n--- FORM DOCUMENTS: Fix empty categories ---');
const forms = load('form-documents.json');
let catFixed = 0;
for (const f of forms) {
  if (!f.category || f.category.trim() === '') {
    if (f.title.includes('CRM14') || f.title.includes('CRM1') || f.title.includes('CRM2') || f.title.includes('Crim14')) {
      f.category = 'Legal Aid Application';
      catFixed++;
    } else {
      f.category = 'Other';
      catFixed++;
    }
  }
}
console.log(`  Fixed categories: ${catFixed}`);

save('form-documents.json', forms);

// 6. Rebuild counties.json with corrected rep county data
console.log('\n--- COUNTIES: Rebuild from fixed rep data ---');
const countyMap = {};
for (const r of reps) {
  const c = r.county || '';
  if (!c.trim()) continue;
  if (!countyMap[c]) {
    countyMap[c] = {
      name: c,
      slug: c.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      repCount: 0,
      stationCount: 0,
    };
  }
  countyMap[c].repCount++;
}

// Count stations per county
for (const s of stations) {
  const c = s.forceName || s.county || '';
  if (!c.trim()) continue;
  const match = Object.keys(countyMap).find(k => k.toLowerCase() === c.toLowerCase());
  if (match) countyMap[match].stationCount++;
}

const counties = Object.values(countyMap).sort((a, b) => a.name.localeCompare(b.name));
console.log(`  Counties: ${counties.length} (was 32)`);
save('counties.json', counties);

console.log('\n=== ALL FIXES APPLIED ===');
