#!/usr/bin/env node
/**
 * Automated test suite for the PoliceStationRepUK portal.
 * Covers: page loads, gated registration contract, directory/auth, lead-magnet removal.
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
  if (ok) passed++;
  else failed++;
  console.log(`  [${tag}] ${label}${detail ? ` — ${detail}` : ''}`);
}

function get(url, { followRedirects = true, maxRedirects = 5 } = {}) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, { headers: { 'User-Agent': 'PoliceStationRepUK-QA/1.0' } }, (res) => {
      if (
        followRedirects &&
        [301, 302, 307, 308].includes(res.statusCode) &&
        res.headers.location &&
        maxRedirects > 0
      ) {
        const next = new URL(res.headers.location, url).href;
        res.resume();
        return resolve(get(next, { followRedirects, maxRedirects: maxRedirects - 1 }));
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () =>
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: Buffer.concat(chunks).toString(),
          url,
        }),
      );
    }).on('error', reject);
  });
}

function post(url, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const mod = u.protocol === 'https:' ? https : http;
    const payload = JSON.stringify(body);
    const req = mod.request(
      {
        hostname: u.hostname,
        port: u.port || (u.protocol === 'https:' ? 443 : 80),
        path: u.pathname + u.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          'User-Agent': 'PoliceStationRepUK-QA/1.0',
        },
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          let json = null;
          const raw = Buffer.concat(chunks).toString();
          try {
            json = JSON.parse(raw);
          } catch {
            /* not json */
          }
          resolve({ status: res.statusCode, body: raw, json, headers: res.headers });
        });
      },
    );
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
    { path: '/PoliceStationRates', expect: 200, label: 'Rates guide loads' },
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

async function testRegisterGatePage() {
  console.log('\n── B. REGISTER GATE PAGE (initial HTML) ──');
  try {
    const res = await get(`${BASE}/register`);
    const html = res.body;
    const hasGate =
      /eligibility check/i.test(html) &&
      /Verify eligibility/i.test(html) &&
      /id="gate-email"/.test(html);
    const hasFullForm =
      /id="fullName"/.test(html) ||
      /id="firmName"/.test(html) ||
      /Step 2 of 2/.test(html) ||
      /confirmAccredited/.test(html);

    log(res.status === 200, 'Register page HTTP 200', `status=${res.status}`);
    log(hasGate, 'Gate UI present (eligibility + gate-email)');
    log(!hasFullForm, 'Full registration form absent from initial HTML');
    log(html.includes('type="email"'), 'Gate has email field');
    log(/Professional status/i.test(html), 'Gate has professional status');
    log(/Proof of accreditation/i.test(html), 'Gate asks for accreditation proof');
    log(/DSCC \/ PIN number/i.test(html) || /PIN number/i.test(html), 'Gate mentions PIN');
  } catch (err) {
    log(false, 'Register gate page check', err.message);
  }
}

async function testRegisterAPIValidation() {
  console.log('\n── C. REGISTER / GATE API CONTRACT ──');

  // Gate: missing email
  try {
    const res = await post(`${BASE}/api/register/gate`, {});
    log(
      res.status === 400 && res.json?.reason === 'invalid-email',
      'Gate empty body rejected',
      `status=${res.status} reason=${res.json?.reason}`,
    );
  } catch (err) {
    log(false, 'Gate empty body', err.message);
  }

  // Gate: bad email
  try {
    const res = await post(`${BASE}/api/register/gate`, {
      email: 'not-an-email',
      category: 'psras-accredited',
    });
    log(
      res.status === 400 && res.json?.reason === 'invalid-email',
      'Gate invalid email rejected',
      `status=${res.status}`,
    );
  } catch (err) {
    log(false, 'Gate invalid email', err.message);
  }

  // Gate: no evidence
  try {
    const res = await post(`${BASE}/api/register/gate`, {
      email: `qa-autotest-${Date.now()}@example.com`,
      category: 'psras-accredited',
    });
    log(
      res.status === 400 && res.json?.reason === 'missing-evidence',
      'Gate without PIN/SRA/proof rejected',
      `status=${res.status} reason=${res.json?.reason}`,
    );
  } catch (err) {
    log(false, 'Gate missing evidence', err.message);
  }

  // Gate: PIN path — production requires email code; local may mint token or lack KV
  try {
    const res = await post(`${BASE}/api/register/gate`, {
      email: `qa-autotest-pin-${Date.now()}@example.com`,
      category: 'psras-accredited',
      pinNumber: 'QAAUTO12345',
    });
    const ok =
      (res.status === 200 && res.json?.ok === true && res.json?.gateToken) ||
      (res.status === 400 && res.json?.code === 'EMAIL_CODE_REQUIRED') ||
      res.status === 503 ||
      (res.status === 200 && res.json?.ok === false && res.json?.reason === 'temporary-unavailable');
    log(
      ok,
      'Gate with PIN accepts path (token, email-code, or KV unavailable)',
      `status=${res.status} code=${res.json?.code || res.json?.reason || 'ok'}`,
    );
  } catch (err) {
    log(false, 'Gate with PIN', err.message);
  }

  // Register: empty body
  try {
    const res = await post(`${BASE}/api/register`, {});
    log(res.status === 400, 'Register empty body rejected', `status=${res.status}`);
    log(
      /full name|email|mobile/i.test(res.json?.error || ''),
      'Register error mentions required identity fields',
      res.json?.error,
    );
  } catch (err) {
    log(false, 'Register empty body', err.message);
  }

  // Register: legacy field names without mobile/fullName
  try {
    const res = await post(`${BASE}/api/register`, {
      name: 'QA Test Rep',
      email: 'qa-autotest-noreply@policestationrepuk.org',
      phone: '07700900000',
      counties: ['Kent'],
    });
    log(
      res.status === 400,
      'Legacy name/phone payload rejected',
      `status=${res.status}`,
    );
  } catch (err) {
    log(false, 'Legacy payload', err.message);
  }

  // Register: honeypot
  try {
    const res = await post(`${BASE}/api/register`, {
      fullName: 'Bot User',
      email: 'bot@spam.com',
      mobile: '07700900000',
      _hp: 'filled-by-bot',
    });
    log(res.status === 200, 'Honeypot returns 200 (silent reject)', `status=${res.status}`);
    log(res.json?.id === 'noop', 'Honeypot response is noop', `id=${res.json?.id}`);
  } catch (err) {
    log(false, 'Honeypot test', err.message);
  }

  // Register: complete-looking body without gate token
  try {
    const res = await post(`${BASE}/api/register`, {
      fullName: 'QA Full Test Rep',
      email: 'qa-fulltest-noreply@policestationrepuk.org',
      mobile: '07700900000',
      category: 'psras-accredited',
      pinNumber: 'QAAUTO12345',
      counties: 'Kent, London, Essex',
      stations: 'Maidstone, Canterbury',
      availability: 'full-time',
      confirmAccredited: true,
      confirmAccurate: true,
    });
    log(
      res.status === 403 && res.json?.requiresGate === true,
      'Register without gateToken requires gate',
      `status=${res.status} requiresGate=${res.json?.requiresGate}`,
    );
  } catch (err) {
    log(false, 'Register without gateToken', err.message);
  }

  // Register: stale gate token
  try {
    const res = await post(`${BASE}/api/register`, {
      gateToken: `not-a-real-token-${Date.now()}`,
      fullName: 'QA Full Test Rep',
      email: 'qa-fulltest-noreply@policestationrepuk.org',
      mobile: '07700900000',
      category: 'psras-accredited',
      pinNumber: 'QAAUTO12345',
      counties: 'Kent',
      confirmAccredited: true,
      confirmAccurate: true,
    });
    log(
      res.status === 403 && res.json?.requiresGate === true,
      'Register with stale gateToken rejected',
      `status=${res.status}`,
    );
  } catch (err) {
    log(false, 'Stale gateToken', err.message);
  }
}

async function testLeadMagnetRemoved() {
  console.log('\n── D. LEAD MAGNET REMOVED ──');
  try {
    const res = await post(`${BASE}/api/lead-magnet`, {
      email: 'qa-autotest-noreply@policestationrepuk.org',
      source: 'autotest',
    });
    // Tombstone returns 410; deleted handlers may 404/405 depending on platform.
    log(
      res.status === 410 || res.status === 404 || res.status === 405,
      'POST /api/lead-magnet is retired (no admin email)',
      `status=${res.status}`,
    );
  } catch (err) {
    log(false, 'Lead-magnet API check', err.message);
  }

  try {
    const res = await get(`${BASE}/PoliceStationRates`);
    const html = res.body;
    const stillCapturing =
      /lead.?magnet/i.test(html) ||
      /Get the PDF/i.test(html) ||
      /Send me the rates/i.test(html) ||
      /action="\/api\/lead-magnet"/i.test(html);
    log(!stillCapturing, 'Rates page has no lead-magnet capture UI');
  } catch (err) {
    log(false, 'Rates page lead-magnet check', err.message);
  }
}

async function testDirectoryData() {
  console.log('\n── E. DIRECTORY / DATA TESTS ──');

  try {
    const res = await get(`${BASE}/directory`);
    log(res.status === 200, 'Directory page loads', `status=${res.status}`);
    log(
      res.body.includes('representative') || res.body.includes('rep'),
      'Directory mentions representatives',
    );
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
  console.log('\n── F. AUTH FLOW TESTS ──');

  try {
    const res = await get(`${BASE}/Account`);
    log(res.status === 200, 'Account page loads', `status=${res.status}`);
    log(res.body.includes('Sign in') || res.body.includes('login'), 'Shows login form');
  } catch (err) {
    log(false, 'Account page load', err.message);
  }

  try {
    const res = await post(`${BASE}/api/auth/send-code`, {
      email: 'nonexistent-qatest@example.com',
    });
    if (res.status === 503) {
      log(false, 'Auth send-code: KV not configured', res.json?.error || res.body?.slice(0, 100));
    } else {
      log(res.status === 200, 'Auth send-code returns 200 for unknown email', `status=${res.status}`);
    }
  } catch (err) {
    log(false, 'Auth send-code test', err.message);
  }

  try {
    const res = await post(`${BASE}/api/auth/verify-code`, {
      email: 'nonexistent@example.com',
      code: '000000',
    });
    log([401, 400].includes(res.status), 'Bad verify-code rejected', `status=${res.status}`);
  } catch (err) {
    log(false, 'Auth verify-code test', err.message);
  }
}

async function testCrossDomainRedirects() {
  console.log('\n── G. CROSS-DOMAIN / REDIRECT TESTS ──');
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
  console.log(`\nPoliceStationRepUK — Portal QA\n${'─'.repeat(48)}\nTarget: ${BASE}\n`);

  await testPageLoads();
  await testRegisterGatePage();
  await testRegisterAPIValidation();
  await testLeadMagnetRemoved();
  await testDirectoryData();
  await testAuthFlow();
  await testCrossDomainRedirects();

  console.log(`\n${'═'.repeat(48)}`);
  console.log(`  TOTAL: ${passed + failed}  |  PASS: ${passed}  |  FAIL: ${failed}`);
  console.log(`${'═'.repeat(48)}\n`);

  if (failed > 0) {
    console.log('FAILED TESTS:');
    for (const r of results.filter((x) => !x.ok)) {
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
