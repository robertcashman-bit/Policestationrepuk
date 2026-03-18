import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const CRAWL_DIR = resolve(ROOT, 'content/crawl');
const APP_DIR = resolve(ROOT, 'app');

const missing = JSON.parse(readFileSync(resolve(ROOT, 'data/missing-pages.json'), 'utf-8'));

function escapeJsx(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/{/g, '&#123;')
    .replace(/}/g, '&#125;');
}

function escapeString(str) {
  return str.replace(/\\/g, '').replace(/'/g, "\\'");
}

function parseContentToSections(crawlData) {
  const headings = crawlData.headings || [];
  const rawContent = crawlData.content || '';

  const sections = [];
  let currentH2 = null;
  let currentH3s = [];
  let intro = '';

  // Extract H1
  const h1 = headings.find(h => h.level === 1)?.text || crawlData.title?.split('|')[0]?.trim() || 'Page';

  // Use headings to split content into sections
  const h2s = headings.filter(h => h.level === 2);

  if (h2s.length === 0) {
    // No sections, just intro
    return { h1, intro: rawContent.substring(0, 500), sections: [] };
  }

  // Try to extract text between headings from the raw content
  for (let i = 0; i < h2s.length; i++) {
    const heading = h2s[i].text;
    const nextHeading = h2s[i + 1]?.text;

    const startIdx = rawContent.indexOf(heading);
    if (startIdx === -1) continue;

    const afterHeading = startIdx + heading.length;
    let endIdx = nextHeading ? rawContent.indexOf(nextHeading, afterHeading) : rawContent.length;
    if (endIdx === -1) endIdx = rawContent.length;

    let sectionText = rawContent.substring(afterHeading, endIdx).trim();
    // Clean up: remove duplicate heading text, nav items
    sectionText = sectionText.substring(0, 800);

    sections.push({ heading, text: sectionText });
  }

  // Extract intro (text before first H2)
  const firstH2Idx = rawContent.indexOf(h2s[0]?.text);
  if (firstH2Idx > 0) {
    // Find H1 text to skip nav
    const h1Idx = rawContent.indexOf(h1);
    if (h1Idx >= 0) {
      intro = rawContent.substring(h1Idx + h1.length, firstH2Idx).trim().substring(0, 400);
    }
  }

  return { h1, intro, sections };
}

function generatePageComponent(crawlData) {
  const { h1, intro, sections } = parseContentToSections(crawlData);
  const path = crawlData.path;
  const pageName = path.replace(/^\//, '');
  const title = crawlData.title?.split('|')[0]?.trim() || h1;
  const metaDesc = intro ? intro.substring(0, 155).replace(/"/g, '\\"') : `${title} — PoliceStationRepUK`;

  const sectionBlocks = sections.map(s => {
    const escapedHeading = escapeJsx(s.heading);
    const escapedText = escapeJsx(s.text);
    // Split text into paragraphs
    const paragraphs = escapedText.split(/\.\s+/).filter(p => p.trim().length > 20);
    const paraJsx = paragraphs.length > 0
      ? paragraphs.map(p => `            <p className="text-[var(--muted)] leading-relaxed">${p.trim()}${p.endsWith('.') ? '' : '.'}</p>`).join('\n')
      : `            <p className="text-[var(--muted)] leading-relaxed">${escapedText}</p>`;

    return `
          <section>
            <h2 className="text-h2 text-[var(--navy)]">${escapedHeading}</h2>
${paraJsx}
          </section>`;
  }).join('\n');

  const breadcrumbLabel = title.length > 40 ? title.substring(0, 37) + '...' : title;

  return `import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: '${escapeString(title)} | PoliceStationRepUK',
  description: '${escapeString(metaDesc)}',
  path: '${path}',
});

export default function ${pageName.replace(/[^a-zA-Z0-9]/g, '')}Page() {
  return (
    <>
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: '${escapeString(breadcrumbLabel)}' },
            ]}
          />
          <h1 className="mt-3 text-h1 text-white">${escapeJsx(h1)}</h1>
${intro ? `          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-slate-300">${escapeJsx(intro.substring(0, 250))}</p>` : ''}
        </div>
      </section>

      <div className="page-container">
        <div className="mx-auto max-w-4xl space-y-10">
${sectionBlocks}

          <section className="rounded-[var(--radius-lg)] bg-[var(--navy)] p-8 text-center">
            <h2 className="text-xl font-bold text-white">Need Help?</h2>
            <p className="mt-2 text-slate-300">
              Find an accredited police station representative or get in touch with our team.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Link href="/directory" className="btn-gold no-underline">
                Find a Rep
              </Link>
              <Link href="/Contact" className="btn-outline no-underline">
                Contact Us
              </Link>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
`;
}

console.log('=== GENERATING MISSING PAGES ===\n');

let created = 0;
let skipped = 0;

for (const page of missing) {
  const pageName = page.path.replace(/^\//, '');
  const dir = resolve(APP_DIR, pageName);
  const filePath = resolve(dir, 'page.tsx');

  if (existsSync(filePath)) {
    console.log(`  SKIP (exists): ${page.path}`);
    skipped++;
    continue;
  }

  try {
    mkdirSync(dir, { recursive: true });
    const component = generatePageComponent(page);
    writeFileSync(filePath, component);
    console.log(`  CREATED: ${page.path}`);
    created++;
  } catch (err) {
    console.log(`  ERROR: ${page.path} — ${err.message}`);
  }
}

console.log(`\n=== DONE: ${created} created, ${skipped} skipped ===`);
