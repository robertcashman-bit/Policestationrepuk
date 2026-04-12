/**
 * Merge content/wiki-expanded/*.md into data/wiki-articles.json by slug.
 * Adds hub article if missing.
 * Run: node scripts/merge-wiki-expanded-from-markdown.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const wikiPath = path.join(root, 'data', 'wiki-articles.json');
const expandedDir = path.join(root, 'content', 'wiki-expanded');

const UPDATES = [
  { slug: 'adverse-inference-section-34-guide', file: 'adverse-inference-section-34-guide.md' },
  { slug: 'fitness-for-interview-custody', file: 'fitness-for-interview-custody.md' },
  { slug: 'digital-evidence-police-station-basics', file: 'digital-evidence-police-station-basics.md' },
];

const HUB = {
  id: '692f5c10a1b2c3d4e5f6a004',
  title: 'Police station interview & evidence hub',
  slug: 'police-station-interview-evidence-hub',
  category: 'Interview Techniques',
  difficulty: 'Intermediate',
  tags: ['hub', 'interview', 'evidence', 'disclosure', 'PACE', 'police station'],
  views: 0,
  helpfulCount: 0,
  factCheckStatus: 'pending',
  publishedDate: '2026-04-11T12:00:00.000Z',
  lastImprovedDate: '2026-04-11T12:00:00.000Z',
  excerpt:
    'Index of Rep Wiki articles on interview tactics, disclosure, custody, fitness for interview, digital evidence, and property — quick links for representatives.',
  file: 'police-station-interview-evidence-hub.md',
};

function wordCount(s) {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

const raw = fs.readFileSync(wikiPath, 'utf8');
const data = JSON.parse(raw);

for (const u of UPDATES) {
  const fp = path.join(expandedDir, u.file);
  const content = fs.readFileSync(fp, 'utf8');
  const idx = data.findIndex((a) => a.slug === u.slug);
  if (idx === -1) {
    console.error('Missing slug in wiki-articles.json:', u.slug);
    process.exit(1);
  }
  data[idx].content = content;
  data[idx].wordCount = wordCount(content);
  data[idx].lastImprovedDate = new Date().toISOString();
  console.log('Updated', u.slug, 'words:', data[idx].wordCount);
}

const hubSlug = HUB.slug;
const hubIdx = data.findIndex((a) => a.slug === hubSlug);
const hubContent = fs.readFileSync(path.join(expandedDir, HUB.file), 'utf8');
const wc = wordCount(hubContent);

if (hubIdx === -1) {
  const { file, ...rest } = HUB;
  data.push({
    ...rest,
    content: hubContent,
    wordCount: wc,
  });
  console.log('Added hub', hubSlug, 'words:', wc);
} else {
  data[hubIdx].content = hubContent;
  data[hubIdx].wordCount = wc;
  data[hubIdx].lastImprovedDate = new Date().toISOString();
  console.log('Updated hub', hubSlug, 'words:', wc);
}

fs.writeFileSync(wikiPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
console.log('Done. Total wiki articles:', data.length);
