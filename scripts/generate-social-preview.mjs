/**
 * Generates public/social-preview.jpg (1200×630) for Open Graph / Twitter / Sendible.
 * Run: node scripts/generate-social-preview.mjs
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, '..', 'public', 'social-preview.jpg');

const accent = '#c9a227';
const navy = '#1e3a8a';

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${navy}"/>
      <stop offset="100%" style="stop-color:#0f1d45"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="0" y="0" width="1200" height="8" fill="${accent}"/>
  <text x="600" y="260" font-family="Segoe UI, Arial, Helvetica, sans-serif" font-size="52" font-weight="700" fill="#ffffff" text-anchor="middle">Police Station Reps UK</text>
  <text x="600" y="330" font-family="Segoe UI, Arial, Helvetica, sans-serif" font-size="28" font-weight="400" fill="#cbd5e1" text-anchor="middle">Find accredited representatives across England &amp; Wales</text>
  <text x="600" y="400" font-family="Segoe UI, Arial, Helvetica, sans-serif" font-size="20" font-weight="500" fill="${accent}" text-anchor="middle">policestationrepuk.org</text>
</svg>`;

await sharp(Buffer.from(svg))
  .jpeg({ quality: 82, mozjpeg: true, chromaSubsampling: '4:2:0' })
  .toFile(outPath);

const meta = await sharp(outPath).metadata();
console.log('Wrote', outPath, `(${meta.width}×${meta.height})`);
