/**
 * Optional: download 16:9 heroes from Pexels when PEXELS_API_KEY is set.
 * Falls back to rasterising local SVGs (same as build-blog-hero-webp.mjs) if the key is missing.
 *
 * Usage: PEXELS_API_KEY=... node scripts/blog/fetch-hero-images.mjs
 *
 * Curated queries per slug — editorial, custody/law-adjacent stock (not case-specific).
 */
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

const ROOT = process.cwd();
const BLOG_DIR = path.join(ROOT, 'public', 'images', 'blog');
const OUT_DIR = path.join(BLOG_DIR, 'raster');

const SLUG_QUERIES = {
  'what-does-a-freelance-police-station-representative-do': 'office teamwork professional',
  'how-firms-can-instruct-freelance-police-station-reps': 'law office documents',
  'police-station-attendance-checklist': 'notebook checklist professional',
  'what-to-include-in-a-police-station-brief': 'legal documents folder',
  'freelance-police-station-representative-vs-duty-solicitor': 'scales of justice courthouse',
  'common-mistakes-when-instructing-freelance-police-station-reps': 'business meeting serious',
  'best-practice-handover-notes-after-police-station-attendance': 'typing report laptop',
  'out-of-hours-police-station-cover-for-law-firms': 'night city street lights',
  'accreditation-and-standards-in-freelance-police-station-work': 'certificate diploma professional',
  'how-freelance-police-station-reps-win-repeat-instructions': 'handshake business trust',
  'what-makes-a-good-police-station-representative': 'professional interview serious',
  'why-fast-clear-communication-matters-in-police-station-representation': 'smartphone message communication',
};

const WIDE = { w: 1200, h: 675 };
const NARROW = { w: 768, h: 432 };

async function fetchPexelsPhoto(query) {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return null;
  const u = new URL('https://api.pexels.com/v1/search');
  u.searchParams.set('query', query);
  u.searchParams.set('per_page', '1');
  u.searchParams.set('orientation', 'landscape');
  const res = await fetch(u, { headers: { Authorization: key } });
  if (!res.ok) throw new Error(`Pexels ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const p = data.photos?.[0];
  if (!p) return null;
  const src = p.src?.large2x || p.src?.large;
  if (!src) return null;
  const imgRes = await fetch(src);
  if (!imgRes.ok) throw new Error(`Image fetch ${imgRes.status}`);
  return { buffer: Buffer.from(await imgRes.arrayBuffer()), photographer: p.photographer, url: p.url };
}

async function toWebpFromBuffer(buf, width, height, maxBytes) {
  let quality = 82;
  let out;
  for (let i = 0; i < 10; i++) {
    out = await sharp(buf)
      .resize(width, height, { fit: 'cover', position: 'attention' })
      .webp({ quality, effort: 6 })
      .toBuffer();
    if (out.length <= maxBytes || quality <= 60) break;
    quality -= 3;
  }
  return out;
}

async function fromSvgFile(svgPath, width, height, maxBytes) {
  let quality = 88;
  let buf;
  for (let i = 0; i < 8; i++) {
    buf = await sharp(svgPath)
      .resize(width, height, { fit: 'cover', position: 'centre' })
      .webp({ quality, effort: 6 })
      .toBuffer();
    if (buf.length <= maxBytes || quality <= 65) break;
    quality -= 4;
  }
  return buf;
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const key = process.env.PEXELS_API_KEY;
  if (!key) {
    console.log('PEXELS_API_KEY not set — rasterising local SVGs only.');
  }

  for (const slug of Object.keys(SLUG_QUERIES)) {
    const svgPath = path.join(BLOG_DIR, `${slug}.svg`);
    let wideBuf;
    let narrowBuf;
    try {
      if (key) {
        const query = SLUG_QUERIES[slug];
        const got = await fetchPexelsPhoto(query);
        if (got) {
          console.log(`${slug}: Pexels — ${got.photographer}`);
          wideBuf = await toWebpFromBuffer(got.buffer, WIDE.w, WIDE.h, 150 * 1024);
          narrowBuf = await toWebpFromBuffer(got.buffer, NARROW.w, NARROW.h, 90 * 1024);
        }
      }
    } catch (e) {
      console.warn(`${slug}: Pexels failed (${e.message}), falling back to SVG`);
    }
    if (!wideBuf) {
      await fs.access(svgPath);
      console.log(`${slug}: SVG → WebP`);
      wideBuf = await fromSvgFile(svgPath, WIDE.w, WIDE.h, 150 * 1024);
      narrowBuf = await fromSvgFile(svgPath, NARROW.w, NARROW.h, 90 * 1024);
    }
    await fs.writeFile(path.join(OUT_DIR, `${slug}.webp`), wideBuf);
    await fs.writeFile(path.join(OUT_DIR, `${slug}-768.webp`), narrowBuf);
  }
  console.log('Done — heroes in', OUT_DIR);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
