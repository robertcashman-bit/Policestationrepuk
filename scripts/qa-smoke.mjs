#!/usr/bin/env node
/**
 * Smoke-check core routes after deploy or locally (`next start`).
 * Usage: npm run qa:smoke
 *        node scripts/qa-smoke.mjs http://localhost:3000
 */
const base = process.argv[2] || process.env.QA_BASE_URL || 'http://localhost:3000';
const paths = ['/', '/sitemap.xml', '/robots.txt', '/Blog', '/directory', '/Advertising'];

async function check() {
  const results = [];
  for (const p of paths) {
    const url = new URL(p, base).href;
    try {
      const res = await fetch(url, { redirect: 'follow' });
      const ok = res.ok;
      results.push({ path: p, status: res.status, ok });
      if (!ok) console.error(`FAIL ${p} -> ${res.status}`);
      else console.log(`OK   ${p} -> ${res.status}`);
    } catch (e) {
      console.error(`FAIL ${p} -> ${e instanceof Error ? e.message : e}`);
      results.push({ path: p, status: 0, ok: false });
    }
  }
  const failed = results.filter((r) => !r.ok);
  if (failed.length) {
    console.error(`\nqa:smoke: ${failed.length} request(s) failed. Start the server: npm run start`);
    process.exit(1);
  }
  console.log('\nqa:smoke: all checks passed.');
}

check();
