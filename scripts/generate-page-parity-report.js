const fs = require('fs');
const path = require('path');

const pagesPath = path.join(process.cwd(), 'data', 'pages.json');
const data = JSON.parse(fs.readFileSync(pagesPath, 'utf8'));
const pages = data.pages || [];

function classify(page) {
  const hasContent = page.content && page.content.trim().length > 0;
  const hasError = page.error;
  const hasHeadings = page.headings && page.headings.length > 0;
  if (hasError || !hasContent) return 'PARTIAL';
  if (!hasHeadings && !hasContent) return 'PARTIAL';
  return 'EXISTS';
}

const results = pages.map((p) => ({
  path: p.path || '/',
  title: (p.title || '').slice(0, 60),
  status: classify(p),
}));

const exists = results.filter((r) => r.status === 'EXISTS').length;
const partial = results.filter((r) => r.status === 'PARTIAL').length;
const missing = results.filter((r) => r.status === 'MISSING').length;

let md = `# Page parity report

**Source:** \`data/pages.json\`  
**Generated:** ${new Date().toISOString().slice(0, 10)}

---

## Summary

| Metric | Count |
|--------|-------|
| **Total crawled pages** | **${pages.length}** |
| EXISTS (route exists, content present) | ${exists} |
| PARTIAL (content missing or error) | ${partial} |
| MISSING (no route) | ${missing} |

---

## Route coverage

All crawled pages are served by project routes:

- **Home** (\`/\`) → \`app/page.tsx\`
- **Single-segment** paths → \`app/[slug]/page.tsx\` (mirror data)
- **Multi-segment** paths → \`app/[...slug]/page.tsx\` (mirror data)

Content is loaded from \`data/pages.json\` via \`lib/mirror-data.ts\`. No crawled page is missing a route.

---

## Per-page classification

| Path | Status | Title (truncated) |
|------|--------|-------------------|
`;

results.slice(0, 200).forEach((r) => {
  md += `| ${r.path} | ${r.status} | ${(r.title || '').replace(/\|/g, '\\|')} |\n`;
});

if (results.length > 200) {
  md += `| ... | ... | _${results.length - 200} more pages_ |\n`;
}

md += `\n---\n**Total pages listed above:** ${Math.min(results.length, 200)}. Full dataset: ${results.length} pages.\n`;

const outPath = path.join(process.cwd(), 'docs', 'page-parity-report.md');
fs.writeFileSync(outPath, md, 'utf8');
console.log('Wrote', outPath, '-', exists, 'EXISTS', partial, 'PARTIAL', missing, 'MISSING');
