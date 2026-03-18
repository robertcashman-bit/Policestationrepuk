import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// Proper CSV parser that handles quoted fields with commas and newlines
function parseCSV(text) {
  const rows = [];
  let i = 0;
  const len = text.length;

  function readField() {
    if (i >= len) return '';
    if (text[i] === '"') {
      i++; // skip opening quote
      let field = '';
      while (i < len) {
        if (text[i] === '"') {
          if (i + 1 < len && text[i + 1] === '"') {
            field += '"';
            i += 2;
          } else {
            i++; // skip closing quote
            break;
          }
        } else {
          field += text[i];
          i++;
        }
      }
      return field;
    } else {
      let field = '';
      while (i < len && text[i] !== ',' && text[i] !== '\n' && text[i] !== '\r') {
        field += text[i];
        i++;
      }
      return field;
    }
  }

  while (i < len) {
    const row = [];
    while (true) {
      row.push(readField());
      if (i >= len) { rows.push(row); break; }
      if (text[i] === ',') { i++; continue; }
      if (text[i] === '\r') i++;
      if (text[i] === '\n') { i++; rows.push(row); break; }
      rows.push(row);
      break;
    }
  }

  return rows;
}

const COUNTY_NORMALIZE = {
  'essex': 'Essex',
  'kent': 'Kent',
  'london': 'London',
  'greater london': 'London',
  'west yorkshire': 'West Yorkshire',
  'west midlands': 'West Midlands',
  'lancashire': 'Lancashire',
  'surrey': 'Surrey',
  'hampshire': 'Hampshire',
  'sussex': 'Sussex',
  'west sussex': 'Sussex',
  'east sussex': 'Sussex',
  'middlesex': 'Middlesex',
  'middx': 'Middlesex',
  'greater manchester': 'Greater Manchester',
  'cheshire': 'Cheshire',
  'leicestershire': 'Leicestershire',
  'northamptonshire': 'Northamptonshire',
  'bedfordshire': 'Bedfordshire',
  'devon': 'Devon',
  'tyne and wear': 'Tyne and Wear',
  'staffordshire': 'Staffordshire',
  'lincolnshire': 'Lincolnshire',
  'south yorkshire': 'South Yorkshire',
  'berkshire': 'Berkshire',
  'shropshire': 'Shropshire',
  'norfolk': 'Norfolk',
  'suffolk': 'Suffolk',
  'northumberland': 'Northumberland',
  'buckinghamshire': 'Buckinghamshire',
  'gloucestershire': 'Gloucestershire',
  'yorkshire': 'Yorkshire',
  'bradford': 'West Yorkshire',
  'nottinghamshire': 'Nottinghamshire',
  'merseyside': 'Merseyside',
  'crawley': 'Sussex',
  'co durham': 'County Durham',
  'county durham': 'County Durham',
  'powys': 'Powys',
  'cardiff': 'Cardiff',
  'hertfordshire': 'Hertfordshire',
  'cambridgeshire': 'Cambridgeshire',
  'oxfordshire': 'Oxfordshire',
  'dorset': 'Dorset',
  'somerset': 'Somerset',
  'warwickshire': 'Warwickshire',
  'derbyshire': 'Derbyshire',
  'county': '',
  'gb': '',
  'uk': '',
  'united kingdom': '',
};

function normalizeCounty(raw) {
  if (!raw) return '';
  const key = raw.toLowerCase().trim();
  if (COUNTY_NORMALIZE[key] !== undefined) return COUNTY_NORMALIZE[key];
  // Title-case if not in map
  return raw.trim().replace(/\b\w/g, c => c.toUpperCase());
}

console.log('=== CSV Import Script ===\n');

const csvPath = resolve(ROOT, 'data/reps-export.csv');
const rawCSV = readFileSync(csvPath, 'utf-8');

const rows = parseCSV(rawCSV);
const headers = rows[0].map(h => h.trim());
const dataRows = rows.slice(1).filter(r => r.length >= 5 && r[0].trim());

console.log(`Headers: ${headers.length} columns`);
console.log(`Data rows: ${dataRows.length}\n`);
console.log('Columns:', headers.join(' | '));
console.log('');

// Map header names to indices
const col = {};
headers.forEach((h, i) => { col[h] = i; });

const reps = dataRows.map(row => {
  const get = (name) => (row[col[name]] || '').trim();

  const rawCounty = get('County');
  const county = normalizeCounty(rawCounty);

  // Parse stations from semicolon-separated names
  const stationNamesRaw = get('Stations Served (Names)');
  const stations = stationNamesRaw
    ? stationNamesRaw.split(';').map(s => s.trim()).filter(Boolean)
    : [];

  const name = get('Name').trim();

  return {
    id: get('ID'),
    name,
    email: get('Email'),
    phone: get('Phone'),
    county,
    addressCounty: normalizeCounty(get('Address County')),
    availability: get('Availability').replace(/^24-Jul$/i, '24/7'),
    accreditation: get('Accreditation'),
    address: get('Address').replace(/\n/g, ', ').replace(/,\s*,/g, ',').trim(),
    postcode: get('Postcode'),
    dsccPin: get('DSCC PIN'),
    whatsappLink: get('WhatsApp Link'),
    featured: get('Is Featured').toLowerCase() === 'yes',
    featuredLevel: get('Featured Level') || 'basic',
    featuredUntil: get('Featured Until') || null,
    featuredBadgeText: get('Featured Badge Text') || null,
    websiteUrl: get('Website URL'),
    spotlightNote: get('Spotlight Note'),
    stations,
    notes: get('Notes').replace(/\n/g, ' ').trim(),
    holidayAvailability: get('Holiday Availability') ? get('Holiday Availability').split(';').map(s => s.trim()).filter(Boolean) : [],
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
  };
}).filter(r => r.name);

// Deduplicate by name (in case of dupes)
const seen = new Set();
const dedupedReps = [];
reps.forEach(r => {
  const key = r.name.toLowerCase().trim();
  if (!seen.has(key)) {
    seen.add(key);
    dedupedReps.push(r);
  }
});

console.log(`Parsed: ${reps.length} reps, deduped: ${dedupedReps.length}\n`);

// Build counties
const countySet = new Set();
dedupedReps.forEach(r => { if (r.county) countySet.add(r.county); });
const countyNames = [...countySet].sort();

const counties = countyNames.map(name => {
  const countyReps = dedupedReps.filter(r => r.county === name);
  const stationNames = new Set();
  countyReps.forEach(r => r.stations.forEach(s => stationNames.add(s)));
  return {
    name,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    repCount: countyReps.length,
    stationCount: stationNames.size,
  };
});

// Coverage report
console.log('=== DATA COVERAGE REPORT ===');
console.log(`Total Reps:     ${dedupedReps.length}`);
console.log(`Total Counties: ${counties.length}`);
const totalStations = new Set();
dedupedReps.forEach(r => r.stations.forEach(s => totalStations.add(s)));
console.log(`Unique Stations (from reps): ${totalStations.size}\n`);

console.log('Reps per county:');
const repsByCounty = {};
dedupedReps.forEach(r => {
  const c = r.county || '(no county)';
  repsByCounty[c] = (repsByCounty[c] || 0) + 1;
});
Object.entries(repsByCounty).sort((a, b) => b[1] - a[1]).forEach(([county, count]) => {
  console.log(`  ${county}: ${count}`);
});
console.log('');

// Sample reps
console.log('--- Sample reps ---');
dedupedReps.slice(0, 5).forEach(r => {
  console.log(`  ${r.name} | ${r.county} | ${r.phone} | ${r.availability} | ${r.stations.length} stations`);
});
console.log('');

// Write files
writeFileSync(resolve(ROOT, 'data/reps.json'), JSON.stringify(dedupedReps, null, 2));
console.log(`Wrote data/reps.json (${dedupedReps.length} records)`);

writeFileSync(resolve(ROOT, 'data/counties.json'), JSON.stringify(counties, null, 2));
console.log(`Wrote data/counties.json (${counties.length} records)`);

console.log('\n=== CSV IMPORT COMPLETE ===');
