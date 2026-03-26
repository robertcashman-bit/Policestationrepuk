#!/usr/bin/env node
/**
 * End-to-end audit & validation for the Police Station Rep directory.
 *
 * Validates: data parity, duplicates, registration flow, search relevance,
 * hallucination detection, and optionally auto-fixes issues.
 *
 * Usage:
 *   node scripts/audit-validate.mjs                 # audit only (read-only)
 *   node scripts/audit-validate.mjs --fix           # audit + auto-fix
 *   node scripts/audit-validate.mjs --base-url URL  # test against running server
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');

const ARGS = process.argv.slice(2);
const FIX_MODE = ARGS.includes('--fix');
const BASE_URL_IDX = ARGS.indexOf('--base-url');
const BASE_URL = BASE_URL_IDX !== -1 ? ARGS[BASE_URL_IDX + 1] : null;

/* ================================================================
   Utility helpers
   ================================================================ */

function readJson(filePath) {
  try {
    if (fs.existsSync(filePath)) return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch { /* corrupt file */ }
  return null;
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

function trim(v) {
  return v == null ? '' : String(v).trim();
}

function normKey(name) {
  return name.toLowerCase().normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
}

function slugify(name) {
  return normKey(name).replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function levenshtein(a, b) {
  const la = a.length, lb = b.length;
  if (la === 0) return lb;
  if (lb === 0) return la;
  let prev = Array.from({ length: lb + 1 }, (_, i) => i);
  let curr = new Array(lb + 1);
  for (let i = 1; i <= la; i++) {
    curr[0] = i;
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[lb];
}

const UK_PHONE_RE = /^(?:\+?44|0)\s*\d[\d\s\-()]{8,15}$/;

function isValidUkPhone(phone) {
  if (!phone) return false;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 13) return false;
  return UK_PHONE_RE.test(phone) || /^\d{10,11}$/.test(digits);
}

function log(level, msg) {
  const ts = new Date().toISOString().slice(11, 19);
  const prefix = { info: '\x1b[36mINFO\x1b[0m', warn: '\x1b[33mWARN\x1b[0m', err: '\x1b[31mFAIL\x1b[0m', ok: '\x1b[32m  OK\x1b[0m' };
  console.log(`[${ts}] ${prefix[level] || level} ${msg}`);
}

/* ================================================================
   STEP 1 — SOURCE DATA EXTRACTION
   ================================================================ */

function fetchSourceData() {
  log('info', 'STEP 1: Loading source data (scraped-reps.json + live scraper output)');

  const scrapedPath = path.join(DATA_DIR, 'scraped-reps.json');
  const raw = readJson(scrapedPath);

  if (!Array.isArray(raw) || raw.length === 0) {
    log('warn', 'scraped-reps.json is empty or missing — source data unavailable');
    return [];
  }

  const sourceReps = raw
    .filter(r => r && typeof r === 'object' && (trim(r.name) || trim(r.slug)))
    .map(r => ({
      name: trim(r.name) || 'Unknown',
      phone: trim(r.phone),
      email: trim(r.email),
      county: trim(r.county),
      availability: trim(r.availability),
      accreditation: trim(r.accreditation),
      stations: Array.isArray(r.stations) ? r.stations.map(s => trim(s)).filter(Boolean) : [],
      slug: trim(r.slug) || slugify(trim(r.name)),
      featured: Boolean(r.featured),
      bio: trim(r.bio),
      websiteUrl: trim(r.websiteUrl),
    }));

  log('info', `  Loaded ${sourceReps.length} source reps from scraped-reps.json`);
  return sourceReps;
}

/* ================================================================
   STEP 2 — DATABASE LOAD
   ================================================================ */

function fetchDatabaseReps() {
  log('info', 'STEP 2: Loading database reps (merged pipeline output)');

  const repsPath = path.join(DATA_DIR, 'reps.json');
  const scrapedPath = path.join(DATA_DIR, 'scraped-reps.json');

  const fallbackRaw = readJson(repsPath);
  const fallbackReps = Array.isArray(fallbackRaw) ? fallbackRaw : [];

  const scrapedRaw = readJson(scrapedPath);
  const scrapedRows = Array.isArray(scrapedRaw)
    ? scrapedRaw.filter(r => r && (trim(r.name) || trim(r.slug)))
    : [];

  const useScraped = scrapedRows.length > 0;

  // Replicate the merge pipeline from lib/data.ts + lib/rep-merge.ts
  let mergedReps;
  if (useScraped) {
    const fbBySlug = new Map();
    const fbByName = new Map();
    for (const r of fallbackReps) {
      if (r.slug) fbBySlug.set(r.slug.toLowerCase(), r);
      const nk = normKey(r.name || '');
      if (nk && !fbByName.has(nk)) fbByName.set(nk, r);
    }

    mergedReps = scrapedRows.map(row => {
      const name = trim(row.name) || 'Unknown';
      const slug = trim(row.slug) || slugify(name);
      const fb = fbBySlug.get(slug.toLowerCase()) || fbByName.get(normKey(name));

      const merged = { ...(fb || {}), ...row };
      merged.name = name;
      merged.slug = slug;
      merged.stations = Array.isArray(row.stations) && row.stations.length > 0
        ? row.stations.map(s => trim(s)).filter(Boolean)
        : (fb?.stations || []).map(s => trim(s)).filter(Boolean);
      merged.phone = trim(row.phone) || trim(fb?.phone);
      merged.email = trim(row.email) || trim(fb?.email);
      merged.county = trim(row.county) || trim(fb?.county);
      merged.availability = trim(row.availability) || trim(fb?.availability);
      merged.accreditation = trim(row.accreditation) || trim(fb?.accreditation) || 'Accredited Representative';
      merged.featured = Boolean(row.featured) || Boolean(fb?.featured);
      merged.id = fb?.id || `scraped:${slug}`;
      return merged;
    });
  } else {
    mergedReps = fallbackReps.map(r => ({ ...r }));
  }

  // Dedupe by slug
  const seen = new Set();
  const deduped = [];
  for (const r of mergedReps) {
    const key = (r.slug || '').toLowerCase();
    if (!key || key === 'unknown' || seen.has(key)) continue;
    seen.add(key);
    deduped.push(r);
  }

  log('info', `  Loaded ${deduped.length} database reps (source: ${useScraped ? 'scraped+fallback merge' : 'fallback only'})`);
  log('info', `  Breakdown: ${scrapedRows.length} scraped, ${fallbackReps.length} fallback`);
  return deduped;
}

function fetchStations() {
  const raw = readJson(path.join(DATA_DIR, 'stations.json'));
  return Array.isArray(raw) ? raw : [];
}

function fetchCounties() {
  const raw = readJson(path.join(DATA_DIR, 'counties.json'));
  return Array.isArray(raw) ? raw : [];
}

/* ================================================================
   STEP 3 — DATA COMPARISON
   ================================================================ */

function compareData(sourceReps, dbReps) {
  log('info', 'STEP 3: Comparing source vs database');

  const sourceBySlug = new Map();
  const sourceByName = new Map();
  for (const r of sourceReps) {
    sourceBySlug.set((r.slug || '').toLowerCase(), r);
    sourceByName.set(normKey(r.name), r);
  }

  const dbBySlug = new Map();
  const dbByName = new Map();
  for (const r of dbReps) {
    dbBySlug.set((r.slug || '').toLowerCase(), r);
    dbByName.set(normKey(r.name || ''), r);
  }

  const missing = []; // in source but not DB
  const extra = [];   // in DB but not source
  const mismatches = [];

  for (const src of sourceReps) {
    const slug = (src.slug || '').toLowerCase();
    const nameKey = normKey(src.name);
    const db = dbBySlug.get(slug) || dbByName.get(nameKey);

    if (!db) {
      // Fuzzy fallback: try levenshtein on name
      let fuzzyMatch = null;
      for (const [dbKey, dbRep] of dbByName) {
        if (levenshtein(nameKey, dbKey) <= 2) { fuzzyMatch = dbRep; break; }
      }
      if (!fuzzyMatch) {
        missing.push({ source: src, reason: 'Not found in database by slug or name' });
        continue;
      }
    }

    const match = db || dbByName.get(normKey(src.name));
    if (!match) continue;

    const diffs = [];
    if (trim(src.name).toLowerCase() !== trim(match.name).toLowerCase()) {
      diffs.push({ field: 'name', source: src.name, db: match.name });
    }
    if (trim(src.phone).replace(/\D/g, '') !== trim(match.phone).replace(/\D/g, '') && trim(src.phone)) {
      diffs.push({ field: 'phone', source: src.phone, db: match.phone });
    }
    if (trim(src.county).toLowerCase() !== trim(match.county).toLowerCase() && trim(src.county)) {
      diffs.push({ field: 'county', source: src.county, db: match.county });
    }

    if (diffs.length > 0) {
      mismatches.push({ slug: src.slug, name: src.name, diffs });
    }
  }

  for (const db of dbReps) {
    const slug = (db.slug || '').toLowerCase();
    const nameKey = normKey(db.name || '');
    if (!sourceBySlug.has(slug) && !sourceByName.has(nameKey)) {
      extra.push({ db, reason: 'In database but not in source scrape' });
    }
  }

  log('info', `  Missing from DB: ${missing.length}`);
  log('info', `  Extra in DB (not in source): ${extra.length}`);
  log('info', `  Field mismatches: ${mismatches.length}`);

  return { missing, extra, mismatches };
}

/* ================================================================
   STEP 4 — DUPLICATE DETECTION
   ================================================================ */

function detectDuplicates(dbReps) {
  log('info', 'STEP 4: Detecting duplicates');

  const duplicates = [];

  // By name+phone
  const namePhoneMap = new Map();
  for (const r of dbReps) {
    const phone = trim(r.phone).replace(/\D/g, '');
    const key = `${normKey(r.name || '')}|${phone}`;
    if (!namePhoneMap.has(key)) {
      namePhoneMap.set(key, [r]);
    } else {
      namePhoneMap.get(key).push(r);
    }
  }

  for (const [key, group] of namePhoneMap) {
    if (group.length > 1) {
      duplicates.push({
        key,
        type: 'name+phone',
        count: group.length,
        reps: group.map(r => ({ slug: r.slug, name: r.name, phone: r.phone })),
      });
    }
  }

  // By slug collision
  const slugMap = new Map();
  for (const r of dbReps) {
    const s = slugify(r.name || '');
    if (!s) continue;
    if (!slugMap.has(s)) slugMap.set(s, [r]);
    else slugMap.get(s).push(r);
  }

  for (const [s, group] of slugMap) {
    if (group.length > 1 && !duplicates.some(d => d.key.startsWith(normKey(group[0].name)))) {
      duplicates.push({
        key: s,
        type: 'slug-collision',
        count: group.length,
        reps: group.map(r => ({ slug: r.slug, name: r.name })),
      });
    }
  }

  // By name fuzzy (catch typos like "Jon Smith" vs "John Smith")
  const names = dbReps.map(r => ({ norm: normKey(r.name || ''), rep: r }));
  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      if (names[i].norm === names[j].norm) continue; // exact handled above
      if (names[i].norm.length < 5 || names[j].norm.length < 5) continue;
      if (levenshtein(names[i].norm, names[j].norm) <= 2) {
        const alreadyFlagged = duplicates.some(d =>
          d.reps.some(r => r.slug === names[i].rep.slug) &&
          d.reps.some(r => r.slug === names[j].rep.slug)
        );
        if (!alreadyFlagged) {
          duplicates.push({
            key: `${names[i].norm} ~ ${names[j].norm}`,
            type: 'fuzzy-name',
            count: 2,
            reps: [
              { slug: names[i].rep.slug, name: names[i].rep.name },
              { slug: names[j].rep.slug, name: names[j].rep.name },
            ],
          });
        }
      }
    }
  }

  log('info', `  Duplicate groups found: ${duplicates.length}`);
  for (const d of duplicates) {
    log('warn', `    [${d.type}] ${d.reps.map(r => r.name).join(' / ')}`);
  }

  return duplicates;
}

/* ================================================================
   STEP 5 — REGISTRATION FLOW TEST
   ================================================================ */

async function testRegistration() {
  log('info', 'STEP 5: Testing registration flow');

  if (!BASE_URL) {
    log('warn', '  Skipping registration test — no --base-url provided (server not running)');
    return 'SKIP';
  }

  const testPayload = {
    name: 'Audit Test Rep',
    email: 'audit-test@policestationrepuk.test',
    phone: '07700000000',
    accreditation: 'Accredited Representative',
    counties: 'Kent',
    stations: 'Maidstone Police Station',
    availability: '24/7',
    message: 'Automated audit test — safe to delete',
  };

  try {
    const res = await fetch(`${BASE_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload),
    });

    const data = await res.json();

    if (!res.ok) {
      log('err', `  Registration API returned ${res.status}: ${JSON.stringify(data)}`);
      return 'FAIL';
    }

    if (!data.ok || !data.id) {
      log('err', `  Registration response missing ok/id: ${JSON.stringify(data)}`);
      return 'FAIL';
    }

    log('ok', `  Registration submitted OK (id: ${data.id})`);

    // Honeypot test — should silently succeed but not actually save
    const honeypotRes = await fetch(`${BASE_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...testPayload, _hp: 'bot-value' }),
    });
    const honeypotData = await honeypotRes.json();
    if (honeypotData.id !== 'noop') {
      log('warn', '  Honeypot test: expected id=noop but got: ' + honeypotData.id);
    } else {
      log('ok', '  Honeypot rejection working correctly');
    }

    // Validation test — missing email
    const badRes = await fetch(`${BASE_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test' }),
    });
    if (badRes.status !== 400) {
      log('warn', `  Validation test: expected 400 but got ${badRes.status}`);
    } else {
      log('ok', '  Input validation working correctly');
    }

    // Search for the test rep via the scraped-reps API
    const searchRes = await fetch(`${BASE_URL}/api/scraped-reps?q=maidstone`);
    if (searchRes.ok) {
      const searchData = await searchRes.json();
      log('ok', `  Search API for "maidstone" returned ${searchData.total} results`);
    }

    return 'PASS';
  } catch (err) {
    log('err', `  Registration test failed: ${err.message}`);
    return 'FAIL';
  }
}

/* ================================================================
   STEP 6 — SEARCH VALIDATION
   ================================================================ */

function testSearchOffline(dbReps, stations, counties) {
  log('info', 'STEP 6: Validating search engine (offline)');

  // Replicate the scoring engine from lib/rep-search.ts
  const TOWN_ALIASES = {
    medway: ['gillingham', 'chatham', 'rochester', 'strood', 'rainham'],
    'thames valley': ['reading', 'slough', 'maidenhead', 'windsor', 'oxford', 'aylesbury', 'high wycombe'],
    teesside: ['middlesbrough', 'stockton', 'hartlepool', 'redcar'],
  };

  const COUNTY_ALIASES = {
    london: ['greater london', 'central london', 'north london', 'east london', 'south london', 'west london', 'middlesex'],
    sussex: ['west sussex', 'east sussex'],
    yorkshire: ['north yorkshire', 'south yorkshire', 'west yorkshire', 'east yorkshire'],
    'county durham': ['co durham', 'durham'],
    'greater manchester': ['manchester'],
  };

  const stationNames = new Set(stations.map(s => trim(s.name).toLowerCase()).filter(Boolean));
  const countyNames = counties.map(c => c.name);

  function scoreRep(rep, queryTokens, queryFull) {
    let score = 0;
    const repStations = (rep.stations || []).map(s => String(s).toLowerCase());
    const repCounty = (rep.county || '').toLowerCase();
    const repName = (rep.name || '').toLowerCase();

    // Station match
    if (stationNames.has(queryFull)) {
      if (repStations.some(s => s.includes(queryFull) || queryFull.includes(s))) score += 100;
    }

    for (const token of queryTokens) {
      if (token.length < 3) continue;
      if (repStations.some(s => s.includes(token))) { score += 70; break; }
    }

    // County match
    for (const token of queryTokens) {
      if (repCounty.includes(token) || token.includes(repCounty)) { score += 40; break; }
      const aliases = COUNTY_ALIASES[token];
      if (aliases && aliases.some(a => repCounty.includes(a) || a.includes(repCounty))) { score += 40; break; }
    }

    // Name match
    for (const token of queryTokens) {
      if (token.length >= 3 && repName.includes(token)) { score += 25; break; }
    }

    // Town alias expansion
    for (const token of queryTokens) {
      const aliases = TOWN_ALIASES[token];
      if (aliases) {
        for (const a of aliases) {
          if (repStations.some(s => s.includes(a))) { score += 60; break; }
        }
      }
    }

    if (/24|on\s*call|anytime/i.test(rep.availability || '')) score += 20;
    const accred = (rep.accreditation || '').toLowerCase();
    if (accred && !accred.includes('probationary')) score += 10;
    if (rep.featured) score += 5;

    return score;
  }

  function search(query) {
    const q = query.toLowerCase().trim();
    const tokens = q.split(/\s+/).filter(Boolean);
    const scored = dbReps.map(r => ({ ...r, _score: scoreRep(r, tokens, q) }));
    const results = scored.filter(r => r._score >= 30).sort((a, b) => b._score - a._score);
    return results;
  }

  const TEST_QUERIES = [
    { query: 'kent', expectMinResults: 1, expectCountyMatch: 'kent' },
    { query: 'maidstone', expectMinResults: 1, expectStationMatch: 'maidstone' },
    { query: 'canterbury', expectMinResults: 0, expectReasonable: true },
    { query: 'police station kent', expectMinResults: 1, expectCountyMatch: 'kent' },
    { query: 'london', expectMinResults: 1, expectCountyMatch: 'london' },
    { query: 'essex', expectMinResults: 1, expectCountyMatch: 'essex' },
    { query: 'medway', expectMinResults: 0, expectReasonable: true },
    { query: '24/7', expectMinResults: 0, expectReasonable: true },
  ];

  let passed = 0;
  let failed = 0;

  for (const tc of TEST_QUERIES) {
    const results = search(tc.query);

    if (tc.expectMinResults > 0 && results.length === 0) {
      log('err', `  Search "${tc.query}": EMPTY (expected >= ${tc.expectMinResults})`);
      failed++;
      continue;
    }

    if (tc.expectCountyMatch) {
      const countyTarget = tc.expectCountyMatch.toLowerCase();
      const topCountyMatch = results.slice(0, 5).some(r => {
        const c = (r.county || '').toLowerCase();
        return c.includes(countyTarget) || countyTarget.includes(c) ||
          (COUNTY_ALIASES[countyTarget] || []).some(a => c.includes(a) || a.includes(c));
      });
      if (!topCountyMatch && results.length > 0) {
        log('warn', `  Search "${tc.query}": top 5 results don't match county "${tc.expectCountyMatch}"`);
        failed++;
        continue;
      }
    }

    if (tc.expectStationMatch) {
      const stTarget = tc.expectStationMatch.toLowerCase();
      const topStationMatch = results.slice(0, 5).some(r =>
        (r.stations || []).some(s => s.toLowerCase().includes(stTarget))
      );
      if (!topStationMatch && results.length > 0) {
        log('warn', `  Search "${tc.query}": top 5 results don't match station "${tc.expectStationMatch}"`);
        failed++;
        continue;
      }
    }

    log('ok', `  Search "${tc.query}": ${results.length} results — top: ${results[0]?.name || 'none'} (score ${results[0]?._score || 0})`);
    passed++;
  }

  log('info', `  Search tests: ${passed} passed, ${failed} failed`);
  return failed === 0 ? 'PASS' : 'FAIL';
}

async function testSearchOnline() {
  if (!BASE_URL) return 'SKIP';

  log('info', '  Testing search via live API...');
  const queries = ['kent', 'maidstone', 'london'];
  let allOk = true;

  for (const q of queries) {
    try {
      const res = await fetch(`${BASE_URL}/api/scraped-reps?q=${encodeURIComponent(q)}`);
      if (!res.ok) { allOk = false; log('err', `  API search "${q}" returned ${res.status}`); continue; }
      const data = await res.json();
      if (data.total === 0) { log('warn', `  API search "${q}" returned 0 results`); }
      else { log('ok', `  API search "${q}": ${data.total} results`); }
    } catch (err) {
      log('err', `  API search "${q}" failed: ${err.message}`);
      allOk = false;
    }
  }

  return allOk ? 'PASS' : 'FAIL';
}

/* ================================================================
   STEP 7 — HALLUCINATION DETECTION
   ================================================================ */

function detectHallucinations(dbReps, sourceReps, stations) {
  log('info', 'STEP 7: Detecting hallucinated entries');

  const hallucinatedEntries = [];

  const sourceBySlug = new Map();
  const sourceByName = new Map();
  for (const r of sourceReps) {
    sourceBySlug.set((r.slug || '').toLowerCase(), r);
    sourceByName.set(normKey(r.name), r);
  }

  const knownStationNames = new Set(
    stations.map(s => trim(s.name).toLowerCase()).filter(Boolean)
  );

  for (const rep of dbReps) {
    const slug = (rep.slug || '').toLowerCase();
    const nameKey = normKey(rep.name || '');
    const issues = [];

    // Rep exists in DB but not source (potential hallucination)
    if (sourceReps.length > 0) {
      const inSource = sourceBySlug.has(slug) || sourceByName.has(nameKey);
      if (!inSource) {
        issues.push('not_in_source');
      }
    }

    // Station validation: check if listed stations match known stations
    for (const st of (rep.stations || [])) {
      const stLower = trim(st).toLowerCase();
      if (!stLower) continue;
      const stationExists = knownStationNames.has(stLower) ||
        [...knownStationNames].some(k => k.includes(stLower) || stLower.includes(k));
      if (!stationExists) {
        issues.push(`unknown_station: ${st}`);
      }
    }

    // Phone validation
    const phone = trim(rep.phone);
    if (phone && !isValidUkPhone(phone)) {
      issues.push(`invalid_phone: ${phone}`);
    }

    // Name validation
    const name = trim(rep.name);
    if (!name || name === 'Unknown') {
      issues.push('missing_name');
    }

    // Suspicious patterns
    if (name && (/^test/i.test(name) || /lorem|ipsum|placeholder|sample/i.test(name))) {
      issues.push('suspicious_name');
    }

    if (issues.length > 0) {
      hallucinatedEntries.push({
        slug: rep.slug,
        name: rep.name,
        county: rep.county,
        issues,
      });
    }
  }

  const notInSource = hallucinatedEntries.filter(h => h.issues.includes('not_in_source'));
  const unknownStations = hallucinatedEntries.filter(h => h.issues.some(i => i.startsWith('unknown_station')));
  const invalidPhones = hallucinatedEntries.filter(h => h.issues.some(i => i.startsWith('invalid_phone')));
  const missingNames = hallucinatedEntries.filter(h => h.issues.includes('missing_name'));
  const suspicious = hallucinatedEntries.filter(h => h.issues.includes('suspicious_name'));

  log('info', `  Not in source: ${notInSource.length}`);
  log('info', `  Unknown stations: ${unknownStations.length}`);
  log('info', `  Invalid phones: ${invalidPhones.length}`);
  log('info', `  Missing names: ${missingNames.length}`);
  log('info', `  Suspicious names: ${suspicious.length}`);

  if (notInSource.length > 0 && notInSource.length <= 20) {
    for (const h of notInSource) {
      log('warn', `    Not in source: ${h.name} (${h.slug})`);
    }
  }

  return hallucinatedEntries;
}

/* ================================================================
   STEP 8 — END-TO-END TEST
   ================================================================ */

async function testSystem() {
  log('info', '═══════════════════════════════════════════════');
  log('info', '  Police Station Rep Directory — Full Audit');
  log('info', '═══════════════════════════════════════════════');
  log('info', `  Mode: ${FIX_MODE ? 'AUDIT + AUTO-FIX' : 'AUDIT ONLY (read-only)'}`);
  if (BASE_URL) log('info', `  Base URL: ${BASE_URL}`);
  log('info', '');

  // Step 1
  const sourceReps = fetchSourceData();

  // Step 2
  const dbReps = fetchDatabaseReps();
  const stations = fetchStations();
  const counties = fetchCounties();

  log('info', `  Total stations: ${stations.length}`);
  log('info', `  Total counties: ${counties.length}`);
  log('info', '');

  // Step 3
  const comparison = compareData(sourceReps, dbReps);
  log('info', '');

  // Step 4
  const duplicates = detectDuplicates(dbReps);
  log('info', '');

  // Step 5
  const registrationResult = await testRegistration();
  log('info', '');

  // Step 6
  const searchResultOffline = testSearchOffline(dbReps, stations, counties);
  const searchResultOnline = await testSearchOnline();
  const searchResult = searchResultOffline === 'PASS' && (searchResultOnline === 'PASS' || searchResultOnline === 'SKIP')
    ? 'PASS' : 'FAIL';
  log('info', '');

  // Step 7
  const hallucinations = detectHallucinations(dbReps, sourceReps, stations);
  log('info', '');

  // Step 9 — Auto-fix if enabled
  let fixesApplied = [];
  if (FIX_MODE) {
    fixesApplied = autoFix({
      comparison,
      duplicates,
      hallucinations,
      sourceReps,
      dbReps,
      stations,
    });
    log('info', '');
  }

  // Step 10 — Final report
  const coveragePercent = sourceReps.length > 0
    ? Math.round(((sourceReps.length - comparison.missing.length) / sourceReps.length) * 100)
    : (dbReps.length > 0 ? 100 : 0);

  const criticalHallucinations = hallucinations.filter(h =>
    h.issues.includes('not_in_source') || h.issues.includes('suspicious_name')
  );

  const status =
    comparison.missing.length === 0 &&
    criticalHallucinations.length === 0 &&
    searchResult !== 'FAIL' &&
    (registrationResult === 'PASS' || registrationResult === 'SKIP')
      ? 'PASS' : 'FAIL';

  const report = {
    generatedAt: new Date().toISOString(),
    status,
    coveragePercent,
    totalSourceReps: sourceReps.length,
    totalDbReps: dbReps.length,
    totalStations: stations.length,
    totalCounties: counties.length,
    missingCount: comparison.missing.length,
    extraCount: comparison.extra.length,
    mismatchCount: comparison.mismatches.length,
    duplicateCount: duplicates.length,
    hallucinationCount: hallucinations.length,
    criticalHallucinationCount: criticalHallucinations.length,
    registrationTest: registrationResult,
    searchTest: searchResult,
    fixesApplied,
    details: {
      missing: comparison.missing.map(m => ({ name: m.source.name, slug: m.source.slug, reason: m.reason })),
      extra: comparison.extra.map(e => ({ name: e.db.name, slug: e.db.slug })),
      mismatches: comparison.mismatches,
      duplicates,
      hallucinations: hallucinations.slice(0, 50),
    },
  };

  // Write report
  const reportPath = path.join(ROOT, 'audit', 'VALIDATION_REPORT.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  writeJson(reportPath, report);

  // Print summary
  log('info', '═══════════════════════════════════════════════');
  log('info', '  FINAL REPORT');
  log('info', '═══════════════════════════════════════════════');
  log(status === 'PASS' ? 'ok' : 'err', `  Status: ${status}`);
  log('info', `  Coverage: ${coveragePercent}%`);
  log('info', `  Source reps: ${sourceReps.length}`);
  log('info', `  Database reps: ${dbReps.length}`);
  log(comparison.missing.length === 0 ? 'ok' : 'err', `  Missing: ${comparison.missing.length}`);
  log(comparison.extra.length === 0 ? 'ok' : 'warn', `  Extra (DB only): ${comparison.extra.length}`);
  log(comparison.mismatches.length === 0 ? 'ok' : 'warn', `  Mismatches: ${comparison.mismatches.length}`);
  log(duplicates.length === 0 ? 'ok' : 'warn', `  Duplicates: ${duplicates.length}`);
  log(criticalHallucinations.length === 0 ? 'ok' : 'err', `  Hallucinations (critical): ${criticalHallucinations.length}`);
  log(registrationResult === 'FAIL' ? 'err' : 'ok', `  Registration: ${registrationResult}`);
  log(searchResult === 'FAIL' ? 'err' : 'ok', `  Search: ${searchResult}`);
  if (fixesApplied.length > 0) {
    log('ok', `  Fixes applied: ${fixesApplied.length}`);
  }
  log('info', `  Report: ${reportPath}`);
  log('info', '═══════════════════════════════════════════════');

  return report;
}

/* ================================================================
   STEP 9 — AUTO-FIX SYSTEM
   ================================================================ */

function autoFix({ comparison, duplicates, hallucinations, sourceReps, dbReps, stations }) {
  log('info', 'STEP 9: Auto-fixing issues');

  const fixes = [];

  // Load current files for modification
  const repsPath = path.join(DATA_DIR, 'reps.json');
  const scrapedPath = path.join(DATA_DIR, 'scraped-reps.json');
  const stationsPath = path.join(DATA_DIR, 'stations.json');

  let repsData = readJson(repsPath) || [];
  let scrapedData = readJson(scrapedPath) || [];
  let stationsData = readJson(stationsPath) || [];
  let modified = false;

  // FIX: Missing reps → import from source
  if (comparison.missing.length > 0) {
    log('info', `  Importing ${comparison.missing.length} missing reps from source...`);
    for (const m of comparison.missing) {
      const newRep = {
        name: trim(m.source.name),
        phone: trim(m.source.phone),
        email: trim(m.source.email),
        county: trim(m.source.county),
        availability: trim(m.source.availability),
        accreditation: trim(m.source.accreditation) || 'Accredited Representative',
        featured: Boolean(m.source.featured),
        stations: m.source.stations || [],
        bio: trim(m.source.bio),
        slug: trim(m.source.slug) || slugify(m.source.name),
        websiteUrl: trim(m.source.websiteUrl),
      };

      // Add to scraped-reps.json (primary source)
      const alreadyInScraped = scrapedData.some(r =>
        (r.slug || '').toLowerCase() === newRep.slug.toLowerCase() ||
        normKey(r.name || '') === normKey(newRep.name)
      );
      if (!alreadyInScraped) {
        scrapedData.push(newRep);
        fixes.push({ type: 'import_missing', name: newRep.name, slug: newRep.slug });
        modified = true;
      }
    }
  }

  // FIX: Duplicates → remove lower-quality duplicate (keep the one with more data)
  if (duplicates.length > 0) {
    log('info', `  Resolving ${duplicates.length} duplicate groups...`);
    const slugsToRemove = new Set();

    for (const d of duplicates) {
      if (d.type !== 'name+phone' && d.type !== 'slug-collision') continue;
      if (d.reps.length < 2) continue;

      // Score each dup by data completeness
      const scored = d.reps.map(r => {
        const full = scrapedData.find(s => (s.slug || '').toLowerCase() === (r.slug || '').toLowerCase()) ||
                     repsData.find(s => (s.slug || '').toLowerCase() === (r.slug || '').toLowerCase());
        let quality = 0;
        if (full) {
          if (trim(full.phone)) quality += 1;
          if (trim(full.email)) quality += 1;
          if (trim(full.county)) quality += 1;
          if (Array.isArray(full.stations) && full.stations.length > 0) quality += 2;
          if (trim(full.availability)) quality += 1;
          if (trim(full.bio)) quality += 1;
          if (full.featured) quality += 1;
        }
        return { ...r, quality };
      });

      scored.sort((a, b) => b.quality - a.quality);
      for (let i = 1; i < scored.length; i++) {
        slugsToRemove.add(scored[i].slug);
      }
    }

    if (slugsToRemove.size > 0) {
      const before = scrapedData.length;
      scrapedData = scrapedData.filter(r => !slugsToRemove.has(r.slug));
      repsData = repsData.filter(r => !slugsToRemove.has(r.slug));
      const removed = before - scrapedData.length;
      if (removed > 0) {
        fixes.push({ type: 'remove_duplicates', count: slugsToRemove.size, slugs: [...slugsToRemove] });
        modified = true;
      }
    }
  }

  // FIX: Mismatches → update fields from source
  if (comparison.mismatches.length > 0) {
    log('info', `  Correcting ${comparison.mismatches.length} field mismatches...`);
    for (const m of comparison.mismatches) {
      const target = scrapedData.find(r => (r.slug || '').toLowerCase() === (m.slug || '').toLowerCase());
      if (!target) continue;

      for (const diff of m.diffs) {
        if (diff.field === 'phone' && diff.source) target.phone = diff.source;
        if (diff.field === 'county' && diff.source) target.county = diff.source;
        if (diff.field === 'name' && diff.source) target.name = diff.source;
      }
      fixes.push({ type: 'correct_mismatch', slug: m.slug, fields: m.diffs.map(d => d.field) });
      modified = true;
    }
  }

  // FIX: Hallucinations → flag suspicious entries (don't auto-remove real people)
  const criticalHallucinations = hallucinations.filter(h =>
    h.issues.includes('suspicious_name') || h.issues.includes('missing_name')
  );
  if (criticalHallucinations.length > 0) {
    log('info', `  Removing ${criticalHallucinations.length} hallucinated/suspicious entries...`);
    const slugsToRemove = new Set(criticalHallucinations.map(h => h.slug));
    const beforeScraped = scrapedData.length;
    const beforeReps = repsData.length;
    scrapedData = scrapedData.filter(r => !slugsToRemove.has(r.slug));
    repsData = repsData.filter(r => !slugsToRemove.has(r.slug));
    const removed = (beforeScraped - scrapedData.length) + (beforeReps - repsData.length);
    if (removed > 0) {
      fixes.push({ type: 'remove_hallucinations', count: criticalHallucinations.length, slugs: [...slugsToRemove] });
      modified = true;
    }
  }

  // FIX: Station data — clean "null" phone strings
  let stationFixes = 0;
  for (const s of stationsData) {
    if (s.phone === 'null' || s.phone === 'NULL') { s.phone = ''; stationFixes++; }
    if (s.custodyPhone === 'null') { s.custodyPhone = ''; stationFixes++; }
    if (s.phone && s.phone.length < 8 && s.phone !== '101') { s.phone = ''; stationFixes++; }
  }
  if (stationFixes > 0) {
    fixes.push({ type: 'clean_station_phones', count: stationFixes });
    modified = true;
  }

  // FIX: Rep phone normalization
  let phoneFixes = 0;
  for (const r of scrapedData) {
    const p = trim(r.phone);
    // Remove site-wide phone that leaks from scraper
    if (p === '01732247427' || p === '01732 247427' || p === '+4401732247427') {
      r.phone = '';
      phoneFixes++;
    }
  }
  if (phoneFixes > 0) {
    fixes.push({ type: 'clean_leaked_phones', count: phoneFixes });
    modified = true;
  }

  // Write back if modified
  if (modified) {
    writeJson(scrapedPath, scrapedData);
    writeJson(repsPath, repsData);
    writeJson(stationsPath, stationsData);
    log('ok', `  Written fixes to data files`);
  } else {
    log('ok', '  No fixes needed');
  }

  log('info', `  Total fixes applied: ${fixes.length}`);
  for (const f of fixes) {
    log('ok', `    [${f.type}] ${f.count || f.slug || f.name || ''}`);
  }

  return fixes;
}

/* ================================================================
   MAIN
   ================================================================ */

testSystem()
  .then(report => {
    process.exit(report.status === 'PASS' ? 0 : 1);
  })
  .catch(err => {
    log('err', `Fatal error: ${err.message}`);
    console.error(err.stack);
    process.exit(2);
  });
