import { createClient } from '@base44/sdk';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');

const APP_ID = '68ae310c7e166df6a2a697f1';

console.log(`\n=== Base44 Data Bridge ===`);
console.log(`App ID: ${APP_ID}`);
console.log(`Auth: Public access (no login required)\n`);

const base44 = createClient({ appId: APP_ID });

async function fetchAll(entityName) {
  const LIMIT = 500;
  let skip = 0;
  const all = [];

  console.log(`Fetching ${entityName} records...`);

  while (true) {
    const batch = await base44.entities[entityName].list('-created_date', LIMIT, skip);
    all.push(...batch);
    console.log(`  -> fetched ${batch.length} (total so far: ${all.length})`);
    if (batch.length < LIMIT) break;
    skip += LIMIT;
  }

  console.log(`  TOTAL ${entityName}: ${all.length}\n`);
  return all;
}

try {
  const reps = await fetchAll('Rep');
  const stations = await fetchAll('Station');

  // Log schemas
  if (reps.length > 0) {
    console.log('--- Rep fields ---');
    console.log(Object.keys(reps[0]).join(', '));
  }
  if (stations.length > 0) {
    console.log('--- Station fields ---');
    console.log(Object.keys(stations[0]).join(', '));
  }
  console.log('');

  // Derive counties
  const countySet = new Set();
  reps.forEach(r => {
    if (r.county) countySet.add(r.county);
  });
  const countyNames = [...countySet].sort();

  // Coverage report
  console.log('=== DATA COVERAGE REPORT ===');
  console.log(`Total Reps:     ${reps.length}`);
  console.log(`Total Stations: ${stations.length}`);
  console.log(`Total Counties: ${countyNames.length}`);
  console.log('');

  const repsByCounty = {};
  reps.forEach(r => {
    const c = r.county || 'Unknown';
    repsByCounty[c] = (repsByCounty[c] || 0) + 1;
  });
  console.log('Reps per county:');
  Object.entries(repsByCounty).sort((a, b) => b[1] - a[1]).forEach(([county, count]) => {
    console.log(`  ${county}: ${count}`);
  });
  console.log('');

  const stationsByForce = {};
  stations.forEach(s => {
    const f = s.force_name || 'Unknown';
    stationsByForce[f] = (stationsByForce[f] || 0) + 1;
  });
  console.log('Stations per force:');
  Object.entries(stationsByForce).sort((a, b) => b[1] - a[1]).forEach(([force, count]) => {
    console.log(`  ${force}: ${count}`);
  });
  console.log('');

  // Save raw data
  mkdirSync(resolve(ROOT, 'data'), { recursive: true });

  writeFileSync(resolve(ROOT, 'data/reps-base44-raw.json'), JSON.stringify(reps, null, 2));
  console.log(`Wrote data/reps-base44-raw.json (${reps.length} records)`);

  writeFileSync(resolve(ROOT, 'data/stations-base44-raw.json'), JSON.stringify(stations, null, 2));
  console.log(`Wrote data/stations-base44-raw.json (${stations.length} records)`);

  // Build station lookup (id -> station) for resolving rep.stations_served references
  const stationById = {};
  stations.forEach(s => { stationById[s.id] = s; });

  // Transform reps for the app
  const transformedReps = reps.filter(r => !r.is_sample).map(r => {
    const resolvedStations = (r.stations_served || [])
      .map(sid => stationById[sid])
      .filter(Boolean)
      .map(s => s.station_name);

    return {
      id: r.id,
      name: r.name || '',
      phone: r.phone || '',
      email: r.email || '',
      availability: r.availability || '',
      stations: resolvedStations,
      stationsCovered: r.stations_covered || [],
      county: r.county || '',
      addressCounty: r.address_county || '',
      postcode: r.postcode || '',
      accreditation: r.accreditation || '',
      notes: r.notes || '',
      featured: r.is_featured || false,
      featuredLevel: r.featured_level || 'basic',
      featuredUntil: r.featured_until || null,
      featuredBadgeText: r.featured_badge_text || null,
      whatsappLink: r.whatsapp_link || '',
      websiteUrl: r.website_url || '',
      dsccPin: r.dscc_pin || '',
      spotlightNote: r.spotlight_note || '',
      holidayAvailability: r.holiday_availability || [],
      slug: (r.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    };
  });

  // Transform stations for the app
  const transformedStations = stations.filter(s => !s.is_sample).map(s => ({
    id: s.id,
    name: s.station_name || '',
    stationId: s.station_id || '',
    address: s.address || '',
    postcode: s.postcode || '',
    phone: s.phone || '',
    custodyPhone: s.custody_phone || '',
    custodyPhone2: s.custody_phone_2 || '',
    nonEmergencyPhone: s.non_emergency_phone || '',
    forceName: s.force_name || '',
    forceCode: s.force_code || '',
    category: s.category || '',
    status: s.status || 'active',
    isCustodyStation: s.is_custody_station || false,
    latitude: s.latitude || null,
    longitude: s.longitude || null,
    slug: (s.station_name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
  }));

  // Build counties with stats
  const counties = countyNames.map(name => {
    const countyReps = transformedReps.filter(r => r.county === name);
    const countyStationNames = new Set();
    countyReps.forEach(r => r.stations.forEach(s => countyStationNames.add(s)));
    return {
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      repCount: countyReps.length,
      stationCount: countyStationNames.size,
    };
  });

  writeFileSync(resolve(ROOT, 'data/reps.json'), JSON.stringify(transformedReps, null, 2));
  console.log(`Wrote data/reps.json (${transformedReps.length} transformed records)`);

  writeFileSync(resolve(ROOT, 'data/stations.json'), JSON.stringify(transformedStations, null, 2));
  console.log(`Wrote data/stations.json (${transformedStations.length} transformed records)`);

  writeFileSync(resolve(ROOT, 'data/counties.json'), JSON.stringify(counties, null, 2));
  console.log(`Wrote data/counties.json (${counties.length} records)`);

  // Print some sample reps
  console.log('\n--- Sample Transformed Reps ---');
  transformedReps.slice(0, 3).forEach(r => {
    console.log(`  ${r.name} | ${r.county} | ${r.phone} | ${r.availability} | stations: ${r.stations.join(', ') || 'none resolved'}`);
  });

  console.log('\n--- Sample Transformed Stations ---');
  transformedStations.slice(0, 3).forEach(s => {
    console.log(`  ${s.name} | ${s.forceName} | ${s.postcode} | custody: ${s.isCustodyStation}`);
  });

  console.log('\n=== BRIDGE COMPLETE ===');
  console.log('All data extracted from Base44 and saved locally.');

  base44.cleanup();

} catch (err) {
  console.error('Error during extraction:', err.message || err);
  if (err.response) {
    console.error('Response status:', err.response.status);
    console.error('Response data:', JSON.stringify(err.response.data, null, 2));
  }
  base44.cleanup();
  process.exit(1);
}
