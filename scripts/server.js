#!/usr/bin/env node
/**
 * Express API server for scraped rep data.
 *
 * Endpoints:
 *   GET /reps              — all reps (supports ?county=&q=&availability=&accreditation=)
 *   GET /reps/:slug        — single rep by slug
 *   GET /counties          — unique county list with counts
 *   GET /stats             — quick summary stats
 *   GET /health            — healthcheck
 *
 * Usage:  node scripts/server.js
 * Port:   defaults to 4000, override with PORT env var
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 4000;

const DATA_PATH = path.join(__dirname, '..', 'data', 'scraped-reps.json');
const FALLBACK_PATH = path.join(__dirname, '..', 'data', 'reps.json');

function loadReps() {
  const filePath = fs.existsSync(DATA_PATH) ? DATA_PATH : FALLBACK_PATH;

  if (!fs.existsSync(filePath)) {
    console.warn(`[server] No data file found at ${filePath}`);
    return [];
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) throw new Error('Data is not an array');
    return data;
  } catch (err) {
    console.error(`[server] Failed to load ${filePath}: ${err.message}`);
    return [];
  }
}

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  const reps = loadReps();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    repCount: reps.length,
    dataFile: fs.existsSync(DATA_PATH) ? 'scraped-reps.json' : 'reps.json (fallback)',
  });
});

app.get('/reps', (req, res) => {
  let reps = loadReps();
  const { county, q, availability, accreditation, featured, limit, offset } = req.query;

  if (county) {
    reps = reps.filter(
      (r) => (r.county || '').toLowerCase() === county.toLowerCase()
    );
  }

  if (q) {
    const query = q.toLowerCase();
    reps = reps.filter(
      (r) =>
        (r.name || '').toLowerCase().includes(query) ||
        (r.county || '').toLowerCase().includes(query) ||
        (r.stations || []).some((s) => s.toLowerCase().includes(query))
    );
  }

  if (availability) {
    reps = reps.filter(
      (r) => (r.availability || '').toLowerCase().includes(availability.toLowerCase())
    );
  }

  if (accreditation) {
    reps = reps.filter(
      (r) =>
        (r.accreditation || '').toLowerCase().includes(accreditation.toLowerCase())
    );
  }

  if (featured === 'true') {
    reps = reps.filter((r) => r.featured === true);
  }

  const total = reps.length;

  if (offset) {
    reps = reps.slice(parseInt(offset, 10));
  }
  if (limit) {
    reps = reps.slice(0, parseInt(limit, 10));
  }

  res.json({
    total,
    count: reps.length,
    reps,
  });
});

app.get('/reps/:slug', (req, res) => {
  const reps = loadReps();
  const rep = reps.find((r) => r.slug === req.params.slug);
  if (!rep) return res.status(404).json({ error: 'Rep not found' });
  res.json(rep);
});

app.get('/counties', (_req, res) => {
  const reps = loadReps();
  const countyMap = {};

  reps.forEach((r) => {
    const c = r.county || 'Unknown';
    countyMap[c] = (countyMap[c] || 0) + 1;
  });

  const counties = Object.entries(countyMap)
    .map(([name, count]) => ({ name, count, slug: name.toLowerCase().replace(/\s+/g, '-') }))
    .sort((a, b) => a.name.localeCompare(b.name));

  res.json({ total: counties.length, counties });
});

app.get('/stats', (_req, res) => {
  const reps = loadReps();
  const counties = new Set(reps.map((r) => r.county).filter(Boolean));
  const stations = new Set(reps.flatMap((r) => r.stations || []));
  const featured = reps.filter((r) => r.featured).length;
  const withPhone = reps.filter((r) => r.phone).length;
  const withEmail = reps.filter((r) => r.email).length;
  const accredited = reps.filter(
    (r) => r.accreditation && r.accreditation.toLowerCase().includes('accredited')
  ).length;

  res.json({
    totalReps: reps.length,
    totalCounties: counties.size,
    totalStations: stations.size,
    featuredReps: featured,
    withPhone,
    withEmail,
    accredited,
    lastUpdated: fs.existsSync(DATA_PATH)
      ? fs.statSync(DATA_PATH).mtime.toISOString()
      : fs.existsSync(FALLBACK_PATH)
        ? fs.statSync(FALLBACK_PATH).mtime.toISOString()
        : null,
  });
});

app.listen(PORT, () => {
  const reps = loadReps();
  console.log('============================================');
  console.log('  PoliceStationRepUK API Server');
  console.log('============================================');
  console.log(`  Port:     ${PORT}`);
  console.log(`  Reps:     ${reps.length}`);
  console.log(`  Data:     ${fs.existsSync(DATA_PATH) ? DATA_PATH : FALLBACK_PATH}`);
  console.log('');
  console.log('  Endpoints:');
  console.log(`  GET http://localhost:${PORT}/reps`);
  console.log(`  GET http://localhost:${PORT}/reps/:slug`);
  console.log(`  GET http://localhost:${PORT}/counties`);
  console.log(`  GET http://localhost:${PORT}/stats`);
  console.log(`  GET http://localhost:${PORT}/health`);
  console.log('============================================');
});
