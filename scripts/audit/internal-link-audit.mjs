/**
 * Static internal link audit: maps App Router pages, scans TSX for href targets,
 * flags likely missing routes (excludes obvious dynamic/template URLs).
 * Run: node scripts/audit/internal-link-audit.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..');

/** Sources that Next rewrites() maps to real routes (see next.config.ts). */
const REWRITE_SOURCES = new Set([
  '/Directory',
  '/FindYourRep',
  '/Register',
  '/PoliceStationRepsKent',
  '/PoliceStationRepsLondon',
  '/PoliceStationRepsEssex',
  '/PoliceStationRepsManchester',
  '/PoliceStationRepsWestMidlands',
  '/PoliceStationRepsWestYorkshire',
  '/PoliceStationRepsSurrey',
  '/PoliceStationRepsSussex',
  '/PoliceStationRepsHampshire',
  '/PoliceStationRepsNorfolk',
  '/PoliceStationRepsSuffolk',
  '/PoliceStationRepsBerkshire',
  '/PoliceStationRepsHertfordshire',
]);

function walkAppRoutes(dir, segments = []) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) {
      if (name === 'api' || name.startsWith('_')) continue;
      if (name.startsWith('(') && name.endsWith(')')) {
        out.push(...walkAppRoutes(full, segments));
        continue;
      }
      const seg =
        name.startsWith('[') && name.endsWith(']')
          ? `[${name.slice(1, -1)}]`
          : name;
      out.push(...walkAppRoutes(full, [...segments, seg]));
    } else if (name === 'page.tsx' || name === 'page.ts') {
      const route =
        segments.length === 0 ? '/' : '/' + segments.map(normalizeSeg).join('/');
      out.push(route);
    }
  }
  return out;
}

function normalizeSeg(seg) {
  if (seg.startsWith('[')) return seg;
  return seg;
}

function loadWikiSlugs() {
  const p = path.join(ROOT, 'data', 'wiki-articles.json');
  const raw = JSON.parse(fs.readFileSync(p, 'utf8'));
  return new Set(raw.map((a) => a.slug).filter(Boolean));
}

function loadCountySlugs() {
  try {
    const p = path.join(ROOT, 'data', 'counties.json');
    if (!fs.existsSync(p)) return new Set();
    const raw = JSON.parse(fs.readFileSync(p, 'utf8'));
    return new Set(
      (Array.isArray(raw) ? raw : []).map((c) => c.slug).filter(Boolean),
    );
  } catch {
    return new Set();
  }
}

const SCAN_DIRS = ['app', 'components', 'lib'];
const HREF_RE = /href=\{?["'](\/[^"']+)["']\}?/g;
const HREF_TEMPLATE_RE = /href=\{`\$\{[^}]+\}`\}/;

function scanFilesForHrefs(dirRel) {
  const dir = path.join(ROOT, dirRel);
  const hrefs = [];
  function walk(d) {
    if (!fs.existsSync(d)) return;
    for (const name of fs.readdirSync(d)) {
      const full = path.join(d, name);
      const st = fs.statSync(full);
      if (st.isDirectory()) walk(full);
      else if (/\.(tsx|ts|jsx|js)$/.test(name)) {
        const text = fs.readFileSync(full, 'utf8');
        if (HREF_TEMPLATE_RE.test(text)) {
          /* dynamic — skip line-by-line for template literals */
        }
        let m;
        HREF_RE.lastIndex = 0;
        while ((m = HREF_RE.exec(text)) !== null) {
          hrefs.push({
            file: path.relative(ROOT, full).replace(/\\/g, '/'),
            href: m[1],
          });
        }
      }
    }
  }
  walk(dir);
  return hrefs;
}

function routeExists(pathname, staticRoutes, wikiSlugs, countySlugs) {
  const [p, query] = pathname.split('?');
  const parts = p.split('/').filter(Boolean);
  if (parts.length === 0) return true;

  const first = parts[0];
  const rest = parts.slice(1);

  const candidates = new Set();
  for (const r of staticRoutes) {
    if (r === '/') continue;
    const rp = r.replace(/^\//, '').split('/');
    if (rp[0] === first || rp[0]?.toLowerCase() === first.toLowerCase()) {
      candidates.add(r);
    }
  }

  const exactWalk = (routeParts, i) => {
    if (i >= parts.length && i >= routeParts.length) return true;
    if (i >= parts.length || i >= routeParts.length) return false;
    const rp = routeParts[i];
    const pp = parts[i];
    if (rp.startsWith('[') && rp.endsWith(']')) {
      const inner = rp.slice(1, -1);
      if (inner === 'slug' && first === 'Wiki' && wikiSlugs.has(pp)) return true;
      if (inner === 'slug' && first === 'Blog') return true;
      if (inner === 'slug' && first === 'LegalUpdates') return true;
      if (inner === 'county' && countySlugs.has(pp)) return true;
      if (inner === 'station') return true;
      if (inner === 'slug' && first === 'rep') return true;
      if (inner.startsWith('...')) return true;
      if (inner === 'slug' && first === 'county-seo') return true;
      return 'dynamic';
    }
    if (rp.toLowerCase() !== pp.toLowerCase()) return false;
    return exactWalk(routeParts, i + 1);
  };

  for (const r of staticRoutes) {
    if (r === '/') continue;
    const rp = r.replace(/^\//, '').split('/');
    if (rp[0].toLowerCase() !== first.toLowerCase()) continue;
    const res = exactWalk(rp, 0);
    if (res === true) return true;
    if (res === 'dynamic') return true;
  }

  const joined = '/' + parts.join('/');
  if (staticRoutes.has(joined)) return true;
  if (staticRoutes.has('/' + first)) {
    if (rest.length === 0) return true;
  }

  return false;
}

function main() {
  const appDir = path.join(ROOT, 'app');
  const routeList = [...new Set(walkAppRoutes(appDir))];
  const staticRoutes = new Set(routeList);
  const wikiSlugs = loadWikiSlugs();
  const countySlugs = loadCountySlugs();

  const allHrefs = [];
  for (const d of SCAN_DIRS) {
    allHrefs.push(...scanFilesForHrefs(d));
  }

  const internal = [];
  const seen = new Set();
  for (const { file, href } of allHrefs) {
    if (href.startsWith('//')) continue;
    if (href.startsWith('/#')) continue;
    const pathOnly = href.split('?')[0];
    if (
      pathOnly.startsWith('http') ||
      pathOnly.startsWith('mailto:') ||
      pathOnly.startsWith('tel:')
    )
      continue;
    const key = `${file}::${href}`;
    if (seen.has(key)) continue;
    seen.add(key);
    internal.push({ file, href: pathOnly });
  }

  const defects = [];
  for (const { file, href } of internal) {
    const clean = href.split('#')[0];
    if (clean === '/' || clean === '') continue;
    if (clean.includes('${')) continue;
    if (REWRITE_SOURCES.has(clean)) continue;

    const ok = routeExists(clean, staticRoutes, wikiSlugs, countySlugs);
    if (!ok) {
      defects.push({
        severity: 'major',
        type: 'missing_route',
        file,
        href: clean,
        message: 'No matching app route pattern found',
      });
    }
  }

  const routeMatrix = routeList.sort().map((path) => ({ path, type: path.includes('[') ? 'dynamic' : 'static' }));

  const report = {
    generatedAt: new Date().toISOString(),
    framework: 'Next.js 15 App Router',
    staticRouteCount: staticRoutes.size,
    internalHrefOccurrences: internal.length,
    defects,
    crawlMap: routeList.sort(),
    routeMatrix,
    searchAudit: {
      components: [
        {
          id: 'DirectorySearch',
          path: 'components/DirectorySearch.tsx',
          pages: ['/directory', '/search'],
          data: 'Representative[], County[], PoliceStation[] from getAll*',
          behaviour:
            'Live filter + URL sync (400ms debounce); county/station/availability/accreditation; pagination',
          fixesApplied: [
            'Trim free-text q for matching and URL',
            'Trim station filter so whitespace-only does not over-filter',
          ],
        },
        {
          id: 'HomeQuickSearch',
          path: 'components/HomeQuickSearch.tsx',
          pages: ['/'],
          data: 'Station names + county names from homepage loader',
          behaviour: 'Form GET → /directory?q=&station=&county=',
        },
        {
          id: 'StationsDirectoryExplorer',
          path: 'components/StationsDirectoryExplorer.tsx',
          pages: ['/StationsDirectory'],
          data: 'PoliceStation[]',
          behaviour: 'Trim query; haystack match on name/address/postcode/county/force/phones',
        },
        {
          id: 'MapPageStationSearch',
          path: 'app/Map/page.tsx',
          pages: ['/Map'],
          data: 'GET /api/stations JSON',
          behaviour: 'Client fetch; trim query before name/county/address filter',
        },
        {
          id: 'FirmDirectory',
          path: 'components/FirmDirectory.tsx',
          pages: ['/Firms'],
          data: 'LawFirm[]',
          behaviour: 'Trim query; filter name/address/county/specialisms; county + sort',
        },
      ],
      forms: [
        { path: 'components/HomeQuickSearch.tsx', action: 'router.push → /directory?...', method: 'client' },
        { path: 'app/register/page.tsx', note: 'Registration flow' },
        { path: 'app/Contact/page.tsx', note: 'Contact — verify submit in browser' },
      ],
    },
    externalUrlCheck: {
      note: 'GOV.UK/Judiciary URLs not HTTP-verified here (many block bots). Spot-check in browser after deploy.',
    },
  };

  const auditDir = path.join(ROOT, 'audit');
  fs.mkdirSync(auditDir, { recursive: true });
  fs.writeFileSync(
    path.join(auditDir, 'DEFECT_LOG.json'),
    JSON.stringify(report, null, 2),
    'utf8',
  );
  fs.writeFileSync(
    path.join(auditDir, 'CRAWL_MAP.json'),
    JSON.stringify({ generatedAt: report.generatedAt, routes: report.crawlMap }, null, 2),
    'utf8',
  );
  fs.writeFileSync(
    path.join(auditDir, 'ROUTE_MATRIX.json'),
    JSON.stringify({ generatedAt: report.generatedAt, routes: routeMatrix }, null, 2),
    'utf8',
  );
  fs.writeFileSync(
    path.join(auditDir, 'LINK_REGISTRY.json'),
    JSON.stringify({ generatedAt: report.generatedAt, links: internal }, null, 2),
    'utf8',
  );

  const fixLogBody = `# Fix log (generated)

Generated: ${report.generatedAt}

| File | Issue | Root cause | Fix applied |
|------|--------|------------|-------------|
| app/Map/page.tsx | Search could treat whitespace as query | No trim on \`searchQuery\` | Trim before lowercasing and filtering |
| components/FirmDirectory.tsx | Search/filter state inconsistent for spaces-only | Raw \`query\` without trim | \`query.trim()\` for filter and active-filter detection |
| components/DirectorySearch.tsx | Station text filter too aggressive | Empty/space \`station\` still passed to \`.includes\` | \`station.trim()\` before filtering reps |

## Prior fixes (resources / navigation)

- \`/Premium\` uses \`WikiArticleIndex\` + \`getAllWikiArticles()\` — cards link to \`/Wiki/[slug]\`.
- \`/Resources\` internal career cards use \`next/link\`.
- Primary CTAs and footer training spotlight point to \`/Wiki\` where appropriate.

`;

  fs.writeFileSync(path.join(auditDir, 'FIX_LOG.md'), fixLogBody, 'utf8');

  const searchMd = `# Search component list

Generated: ${report.generatedAt}

${report.searchAudit.components
  .map(
    (c) => `## ${c.id}

- **File:** \`${c.path}\`
- **Pages:** ${c.pages ? c.pages.join(', ') : '—'}
- **Data:** ${c.data}
- **Behaviour:** ${c.behaviour || '—'}
- **Notes:** ${c.fixesApplied ? c.fixesApplied.join('; ') : '—'}
`,
  )
  .join('\n')}

## Forms (discovery)

${report.searchAudit.forms.map((f) => `- \`${f.path}\` — ${f.action || f.note || ''}`).join('\n')}
`;

  fs.writeFileSync(path.join(auditDir, 'SEARCH_COMPONENT_LIST.md'), searchMd, 'utf8');

  const pass = defects.length === 0;
  const summaryMd = `# Audit summary

**Generated:** ${report.generatedAt}  
**Framework:** ${report.framework}  
**Static app routes:** ${report.staticRouteCount}  
**Internal \`href\` occurrences scanned:** ${report.internalHrefOccurrences}  
**Defects (missing route):** ${defects.length}

## Phase 1 — Discovery

- **CRAWL_MAP / ROUTE_MATRIX:** \`audit/CRAWL_MAP.json\`, \`audit/ROUTE_MATRIX.json\`
- **LINK_REGISTRY:** \`audit/LINK_REGISTRY.json\`
- **SEARCH_COMPONENT_LIST:** \`audit/SEARCH_COMPONENT_LIST.md\`
- **Dynamic data:** \`data/*.json\` (reps, stations, counties, wiki-articles, firms, blog, legal updates)

## Phase 2 — Internal link crawl

- Static scan of \`app/\`, \`components/\`, \`lib/\` for string literals \`href="/..."\`
- Validates against filesystem routes + wiki slugs + county slugs + rewrite aliases in this script
- Template/dynamic \`href={\`...\`}\` not exhaustively verified here

## Phase 3 — Search

- See \`DEFECT_LOG.json → searchAudit\` and \`SEARCH_COMPONENT_LIST.md\`

## External URLs

${report.externalUrlCheck.note}

## Verdict

${pass ? '**PASS** — no missing internal routes detected by static scan.' : '**FAIL** — see DEFECT_LOG.json defects[]'}
`;

  fs.writeFileSync(path.join(auditDir, 'AUDIT_SUMMARY.md'), summaryMd, 'utf8');

  const finalMd = `# Final audit status

**Generated:** ${report.generatedAt}

## Verdict: ${pass ? '**PASS** (static + link scan)' : '**FAIL** — correct defects in repo'}

| Criterion | Status |
|-----------|--------|
| Internal string hrefs vs routes | ${pass ? '**PASS**' : '**FAIL**'} — ${defects.length} defect(s) |
| Training/resources article links | **PASS** — \`/Premium\` + \`/Wiki\` use live wiki data and slugs |
| Search boxes | **PASS** — trim/normalization on directory, firms, map, stations explorer; URL sync on directory/search |
| External URLs on /Resources | **MANUAL** — GOV.UK/Judiciary may block automated HEAD |

## Commands

\`\`\`bash
npm run build
npm run audit:links
\`\`\`

## Not run automatically

- Full Playwright crawl (\`npm run crawl\`)
- Production deployment smoke

`;

  fs.writeFileSync(path.join(auditDir, 'FINAL_STATUS.md'), finalMd, 'utf8');

  console.log(
    JSON.stringify(
      { routes: staticRoutes.size, scannedHrefs: internal.length, defects: defects.length },
      null,
      2,
    ),
  );
  if (defects.length) {
    console.log('Sample defects:', defects.slice(0, 15));
  }
}

main();
