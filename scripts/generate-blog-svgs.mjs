/**
 * Generates cohesive SVG hero images for blog articles (local, licence-free).
 * Run: node scripts/generate-blog-svgs.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'public', 'images', 'blog');

const SLUGS = [
  'what-does-a-freelance-police-station-representative-do',
  'how-firms-can-instruct-freelance-police-station-reps',
  'police-station-attendance-checklist',
  'what-to-include-in-a-police-station-brief',
  'freelance-police-station-representative-vs-duty-solicitor',
  'common-mistakes-when-instructing-freelance-police-station-reps',
  'best-practice-handover-notes-after-police-station-attendance',
  'out-of-hours-police-station-cover-for-law-firms',
  'accreditation-and-standards-in-freelance-police-station-work',
  'how-freelance-police-station-reps-win-repeat-instructions',
  'what-makes-a-good-police-station-representative',
  'why-fast-clear-communication-matters-in-police-station-representation',
];

const LABELS = {
  'what-does-a-freelance-police-station-representative-do': 'Role & custody attendance',
  'how-firms-can-instruct-freelance-police-station-reps': 'Briefing & instructions',
  'police-station-attendance-checklist': 'Field checklist',
  'what-to-include-in-a-police-station-brief': 'Police station brief',
  'freelance-police-station-representative-vs-duty-solicitor': 'Rep vs duty solicitor',
  'common-mistakes-when-instructing-freelance-police-station-reps': 'Avoiding firm mistakes',
  'best-practice-handover-notes-after-police-station-attendance': 'Handover notes',
  'out-of-hours-police-station-cover-for-law-firms': 'Out-of-hours cover',
  'accreditation-and-standards-in-freelance-police-station-work': 'Accreditation & standards',
  'how-freelance-police-station-reps-win-repeat-instructions': 'Repeat instructions',
  'what-makes-a-good-police-station-representative': 'What firms look for',
  'why-fast-clear-communication-matters-in-police-station-representation': 'Clear communication',
};

function svgFor(slug) {
  const label = LABELS[slug] ?? slug;
  const title = `PoliceStationRepUK blog — ${label}`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-labelledby="t">
  <title id="t">${escapeXml(title)}</title>
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e3a5f"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-opacity="0.35"/>
    </filter>
  </defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <rect x="0" y="0" width="1200" height="8" fill="#c9a227"/>
  <g opacity="0.07" stroke="#ffffff" stroke-width="1">
    <path d="M0 120 H1200 M0 240 H1200 M0 360 H1200 M0 480 H1200"/>
    <path d="M150 0 V630 M300 0 V630 M450 0 V630 M600 0 V630 M750 0 V630 M900 0 V630 M1050 0 V630"/>
  </g>
  <rect x="72" y="420" width="200" height="6" rx="3" fill="#c9a227" filter="url(#shadow)"/>
  <text x="72" y="120" fill="#94a3b8" font-size="22" font-family="ui-sans-serif,system-ui,sans-serif">PoliceStationRepUK · Blog</text>
  <text x="72" y="200" fill="#f8fafc" font-size="40" font-family="ui-sans-serif,system-ui,sans-serif" font-weight="700">${escapeXml(
    label
  )}</text>
  <text x="72" y="260" fill="#cbd5e1" font-size="24" font-family="ui-sans-serif,system-ui,sans-serif">Freelance reps &amp; criminal defence firms</text>
  <rect x="900" y="72" width="228" height="140" rx="12" fill="#1e293b" stroke="#c9a227" stroke-opacity="0.35" stroke-width="2"/>
  <path d="M930 180 L960 130 L990 160 L1020 110 L1050 150 L1080 125" fill="none" stroke="#c9a227" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>
  <circle cx="1080" cy="118" r="6" fill="#c9a227"/>
</svg>
`;
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

fs.mkdirSync(OUT, { recursive: true });
for (const slug of SLUGS) {
  fs.writeFileSync(path.join(OUT, `${slug}.svg`), svgFor(slug), 'utf8');
}
console.log(`Wrote ${SLUGS.length} SVGs to ${OUT}`);
