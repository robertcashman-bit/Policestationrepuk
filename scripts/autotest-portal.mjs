#!/usr/bin/env node
/**
 * Automated test suite for the PoliceStationRepUK registration flow.
 * Covers: page loads, form validation, API contracts, data integrity.
 *
 * Usage:  node scripts/autotest-portal.mjs [base_url]
 * Default base: https://policestationrepuk.org
 */

import https from 'https';
import http from 'http';

const BASE = (process.argv[2] || 'https://policestationrepuk.org').replace(/\/$/, '');
const results = [];
let passed = 0;
let failed = 0;

function log(ok, label, detail) {
  const tag = ok ? 'PASS' : 'FAIL';
  results.push({ ok, label, detail });
  if (ok) passed++; else failed++;
  console.log(`  [${tag}] ${label}${detail ? ` — ${detail}` : ''}`);
}

function get(url, { followRedirects = true, maxRedirects = 5 } = {}) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, { headers: { 'User-Agent': 'PoliceStationRepUK-QA/1.0' } }, (res) => {
      if (followRedirects && [301, 302, 307, 308].includes(res.statusCode) && res.headers.location && maxRedirects > 0) {
        const next = new URL(res.headers.location, url).href;
        res.resume();
        return resolve(get(next, { followRedirects, maxRedirects: maxRedirects - 1 }));
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString(), url }));
    }).on('error', reject);
  });
}

function post(url, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const mod = u.protocol === 'https:' ? https : http;
    const payload = JSON.stringify(body);
    const req = mod.request({
      hostname: u.hostname,
      port: u.port || (u.protocol === 'https:' ? 443 : 80),
      path: u.pathname + u.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'User-Agent': 'PoliceStationRepUK-QA/1.0',
      },
    }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        let json = null;
        const raw = Buffer.concat(chunks).toString();
        try { json = JSON.parse(raw); } catch { /* not json */ }
        resolve({ status: res.statusCode, body: raw, json, headers: res.headers });
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// ──────────────────────── Test groups ────────────────────────

async function testPageLoads() {
  console.log('\n── A. PAGE / ROUTE TESTS ──');
  const routes = [
    { path: '/register', expect: 200, label: 'Register page loads' },
    { path: '/directory', expect: 200, label: 'Directory page loads' },
    { path: '/search', expect: 200, label: 'Search page loads' },
    { path: '/Account', expect: 200, label: 'Account/login page loads' },
    { path: '/', expect: 200, label: 'Homepage loads' },
  ];
  for (const r of routes) {
    try {
      const res = await get(`${BASE}${r.path}`);
      log(res.status === r.expect, r.label, `status=${res.status}`);
    } catch (err) {
      log(false, r.label, err.message);
    }
  }
}

async function testRegisterPageContent() {
  console.log('\n── B. REGISTER PAGE CONTENT ──');
  try {
    const res = await get(`${BASE}/register`);
    const html = res.body;
    log(html.includes('Full name'), 'Form has "Full name" field');
    log(html.includes('type="email"'), 'Form has email field');
    log(html.includes('Submit registration'), 'Form has submit button');
    log(html.includes('Counties covered'), 'Form has counties field');
    log(html.includes('Stations covered'), 'Form has stations field');
    log(html.includes('Availability'), 'Form has availability field');
    log(html.includes('Accreditation'), 'Form has accreditation field');
    log(html.includes('type="tel"'), 'Form has phone field');
  } catch (err) {
    log(false, 'Register page content check', err.message);
  }
}

async function testAPIValidation() {
  console.log('\n── C. API VALIDATION TESTS ──');

  // Missing fields
  try {
    const res = await post(`${BASE}/api/register`, {});
    log(res.status === 400, 'Empty body rejected', `status=${res.status} body=${res.body?.slice(0, 120)}`);
    log(res.json?.error?.includes('name') || res.json?.error?.includes('required'), 'Error mentions missing fields', res.json?.error);
  } catch (err) {
    log(false, 'Empty body test', err.message);
  }

  // Missing email
  try {
    const res = await post(`${BASE}/api/register`, { name: 'Test User' });
    log(res.status === 400, 'Missing email rejected', `status=${res.status}`);
  } catch (err) {
    log(false, 'Missing email test', err.message);
  }

  // Invalid email
  try {
    const res = await post(`${BASE}/api/register`, { name: 'Test', email: 'not-an-email' });
    log(res.status === 400, 'Invalid email rejected', `status=${res.status}`);
    log(res.json?.error?.toLowerCase().includes('email'), 'Error mentions email', res.json?.error);
  } catch (err) {
    log(false, 'Invalid email test', err.message);
  }

  // Oversized payload
  try {
    const big = 'x'.repeat(25000);
    const res = await post(`${BASE}/api/register`, { name: big, email: 'test@example.com' });
    log(res.status === 400, 'Oversized payload rejected', `status=${res.status}`);
  } catch (err) {
    log(false, 'Oversized payload test', err.message);
  }

  // Honeypot filled
  try {
    const res = await post(`${BASE}/api/register`, {
      name: 'Bot User', email: 'bot@spam.com', _hp: 'filled-by-bot',
    });
    log(res.status === 200, 'Honeypot returns 200 (silent reject)', `status=${res.status}`);
    log(res.json?.id === 'noop', 'Honeypot response is noop', `id=${res.json?.id}`);
  } catch (err) {
    log(false, 'Honeypot test', err.message);
  }

  // Valid minimal submission
  try {
    const res = await post(`${BASE}/api/register`, {
      name: 'QA Test Rep',
      email: 'qa-autotest-noreply@policestationrepuk.org',
    });
    log(res.status === 200, 'Valid minimal submission accepted', `status=${res.status}`);
    log(res.json?.ok === true, 'Response has ok: true', JSON.stringify(res.json));
    log(!!res.json?.id && res.json.id !== 'noop', 'Response has real submission id', res.json?.id);
  } catch (err) {
    log(false, 'Valid minimal submission', err.message);
  }

  // Valid full submission (with counties as array — the bug trigger)
  try {
    const res = await post(`${BASE}/api/register`, {
      name: 'QA Full Test Rep',
      email: 'qa-fulltest-noreply@policestationrepuk.org',
      phone: '07700900000',
      accreditation: 'PSRAS',
      counties: ['Kent', 'London', 'Essex'],
      stations: ['Maidstone', 'Canterbury'],
      availability: 'full-time',
      message: 'Automated QA test — please ignore.',
    });
    log(res.status === 200, 'Full submission with array counties accepted', `status=${res.status}`);
    log(res.json?.ok === true, 'Full submission ok: true', JSON.stringify(res.json));
    log(!!res.json?.id && res.json.id !== 'noop', 'Full submission has real id', res.json?.id);
  } catch (err) {
    log(false, 'Full submission with array counties', err.message);
  }

  // Counties as string (alternative)
  try {
    const res = await post(`${BASE}/api/register`, {
      name: 'QA String Counties',
      email: 'qa-strtest-noreply@policestationrepuk.org',
      counties: 'Kent, London',
      stations: 'Maidstone',
    });
    log(res.status === 200, 'String counties accepted', `status=${res.status}`);
    log(res.json?.ok === true, 'String counties ok: true');
  } catch (err) {
    log(false, 'String counties test', err.message);
  }
}

async function testDirectoryData() {
  console.log('\n── D. DIRECTORY / DATA TESTS ──');

  try {
    const res = await get(`${BASE}/directory`);
    log(res.status === 200, 'Directory page loads', `status=${res.status}`);
    const repCount = (res.body.match(/DirectoryCard|rep-card|data-rep/gi) || []).length;
    log(res.body.includes('representative') || res.body.includes('rep'), 'Directory mentions representatives');
  } catch (err) {
    log(false, 'Directory data test', err.message);
  }

  try {
    const res = await get(`${BASE}/api/stations`);
    log(res.status === 200, 'Stations API loads', `status=${res.status}`);
    try {
      const data = JSON.parse(res.body);
      log(Array.isArray(data), 'Stations returns array', `length=${data?.length}`);
      log(data.length > 0, 'Stations has data');
    } catch {
      log(false, 'Stations response is valid JSON');
    }
  } catch (err) {
    log(false, 'Stations API test', err.message);
  }
}

async function testAuthFlow() {
  console.log('\n── E. AUTH FLOW TESTS ──');

  // Login page loads
  try {
    const res = await get(`${BASE}/Account`);
    log(res.status === 200, 'Account page loads', `status=${res.status}`);
    log(res.body.includes('Sign in') || res.body.includes('login'), 'Shows login form');
  } catch (err) {
    log(false, 'Account page load', err.message);
  }

  // Send code with non-existent email (should still 200 — doesn't reveal membership)
  try {
    const res = await post(`${BASE}/api/auth/send-code`, {
      email: 'nonexistent-qatest@example.com',
    });
    // Could be 200 (ok silently) or 503 if KV not configured
    if (res.status === 503) {
      log(false, 'Auth send-code: KV not configured', res.json?.error || res.body?.slice(0, 100));
    } else {
      log(res.status === 200, 'Auth send-code returns 200 for unknown email', `status=${res.status}`);
    }
  } catch (err) {
    log(false, 'Auth send-code test', err.message);
  }

  // Verify code with bad data
  try {
    const res = await post(`${BASE}/api/auth/verify-code`, {
      email: 'nonexistent@example.com', code: '000000',
    });
    log([401, 400].includes(res.status), 'Bad verify-code rejected', `status=${res.status}`);
  } catch (err) {
    log(false, 'Auth verify-code test', err.message);
  }
}

async function testCrossDomainRedirects() {
  console.log('\n── F. CROSS-DOMAIN / REDIRECT TESTS ──');
  try {
    const res = await get(`${BASE}/Register`, { followRedirects: false });
    if (res.status === 301 || res.status === 308) {
      const loc = res.headers.location || '';
      log(loc.includes('/register'), '/Register redirects to /register', loc);
    } else if (res.status === 200) {
      log(true, '/Register loads (case-insensitive match)', `status=${res.status}`);
    } else {
      log(false, '/Register redirect', `status=${res.status}`);
    }
  } catch (err) {
    log(false, '/Register redirect test', err.message);
  }
}

// ──────────────────────── Run all ────────────────────────

async function main() {
  console.log(`\nPoliceStationRepUK — Registration Flow QA\n${'─'.repeat(48)}\nTarget: ${BASE}\n`);

  await testPageLoads();
  await testRegisterPageContent();
  await testAPIValidation();
  await testDirectoryData();
  await testAuthFlow();
  await testCrossDomainRedirects();

  console.log(`\n${'═'.repeat(48)}`);
  console.log(`  TOTAL: ${passed + failed}  |  PASS: ${passed}  |  FAIL: ${failed}`);
  console.log(`${'═'.repeat(48)}\n`);

  if (failed > 0) {
    console.log('FAILED TESTS:');
    for (const r of results.filter((r) => !r.ok)) {
      console.log(`  ✗ ${r.label}${r.detail ? ` — ${r.detail}` : ''}`);
    }
    console.log();
  }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(2);
});
