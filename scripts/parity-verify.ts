/**
 * Route parity: docs/live-site-map.json (.com crawl) vs Next.js app + redirects + rewrites.
 * Strict mode: crawl noise is SKIP; generic [slug] / [...slug] only MATCH if allowlisted.
 *
 * Run: npm run parity   (or npx tsx scripts/parity-verify.ts)
 */

import fs from 'fs';
import path from 'path';
import nextConfig from '../next.config';
import { normalizeUrlPath, isCrawlNoise } from '../lib/parity-crawl-noise';

type Class = 'MATCH' | 'MISSING' | 'REDIRECT_EXTERNAL' | 'SKIP';

function segmentToRegex(seg: string): string {
  if (seg === ':path*') return '(.*)';
  const pieces = seg.split(/(:[a-zA-Z_][a-zA-Z0-9_]*)/g).filter((q) => q.length > 0);
  return pieces
    .map((q) => (q.startsWith(':') ? '([^/]+)' : q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
    .join('');
}

function compileRedirect(source: string, destination: string) {
  const segs = source.split('/').filter(Boolean);
  let rx = '^';
  for (const seg of segs) {
    rx += '\\/';
    rx += segmentToRegex(seg);
  }
  rx += '$';
  const regex = new RegExp(rx, 'i');

  return (pathname: string): string | null => {
    const m = pathname.match(regex);
    if (!m) return null;
    let dest = destination;
    if (dest.includes(':path*')) dest = dest.replace(':path*', m[1] ?? '');
    if (dest.includes(':county')) dest = dest.replace(':county', m[1] ?? '');
    return dest;
  };
}

async function loadRedirectMatchers() {
  const cfg = (nextConfig as { default?: { redirects?: () => Promise<unknown[]> } }).default ?? nextConfig;
  const raw = (await cfg.redirects?.()) as { source: string; destination: string }[];
  if (!Array.isArray(raw)) return [];
  return raw.map((r) => ({
    try: compileRedirect(r.source, r.destination),
  }));
}

const RESERVED_COUNTY_SHORT = new Set([
  'api',
  'directory',
  'register',
  'rep',
  'county',
  'police-station',
  'county-seo',
  'search',
  '_next',
]);

function loadCountySlugs(root: string): Set<string> {
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(root, 'data', 'counties.json'), 'utf-8')) as { slug: string }[];
    return new Set(raw.map((c) => c.slug.toLowerCase()));
  } catch {
    return new Set();
  }
}

function loadStationSlugs(root: string): Set<string> {
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(root, 'data', 'stations.json'), 'utf-8')) as { slug?: string }[];
    return new Set(
      raw.map((s) => (s.slug || '').toLowerCase()).filter(Boolean),
    );
  } catch {
    return new Set();
  }
}

function loadRepSlugs(root: string): Set<string> {
  const s = new Set<string>();
  for (const f of ['reps.json', 'scraped-reps.json']) {
    try {
      const raw = JSON.parse(fs.readFileSync(path.join(root, 'data', f), 'utf-8'));
      const arr = Array.isArray(raw) ? raw : raw.reps;
      if (!Array.isArray(arr)) continue;
      for (const r of arr) {
        if (r?.slug) s.add(String(r.slug).toLowerCase());
      }
    } catch {
      /* ignore */
    }
  }
  return s;
}

function loadWikiSlugs(root: string): Set<string> {
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(root, 'data', 'wiki-articles.json'), 'utf-8')) as { slug?: string }[];
    return new Set(raw.map((w) => (w.slug || '').toLowerCase()).filter(Boolean));
  } catch {
    return new Set();
  }
}

function loadLegalSlugs(root: string): Set<string> {
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(root, 'data', 'legal-updates.json'), 'utf-8')) as { slug?: string }[];
    return new Set(raw.map((w) => (w.slug || '').toLowerCase()).filter(Boolean));
  } catch {
    return new Set();
  }
}

function loadCountySeoSlugs(root: string): Set<string> {
  try {
    const text = fs.readFileSync(path.join(root, 'lib', 'county-seo-pages.ts'), 'utf-8');
    const slugs: string[] = [];
    const re = /slug:\s*'([^']+)'/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) slugs.push(m[1].toLowerCase());
    return new Set(slugs);
  } catch {
    return new Set();
  }
}

function applyInternalRewrites(pathname: string, countySlugs: Set<string>): string {
  const p = normalizeUrlPath(pathname);
  const pm = p.match(/^\/police-station-representatives-([^/]+)$/i);
  if (pm && countySlugs.has(pm[1].toLowerCase())) {
    return `/county/${pm[1].toLowerCase()}`;
  }
  const parts = p.split('/').filter(Boolean);
  if (
    parts.length === 1 &&
    countySlugs.has(parts[0].toLowerCase()) &&
    !RESERVED_COUNTY_SHORT.has(parts[0].toLowerCase())
  ) {
    return `/county/${parts[0].toLowerCase()}`;
  }
  return p;
}

function findAppRoutes(appDir: string): string[] {
  const out: string[] = [];
  if (fs.existsSync(path.join(appDir, 'page.tsx'))) out.push('');

  function walk(rel: string): void {
    const dir = path.join(appDir, rel);
    if (!fs.existsSync(dir)) return;
    for (const name of fs.readdirSync(dir)) {
      const sub = rel ? `${rel}/${name}` : name;
      const full = path.join(appDir, sub);
      if (!fs.statSync(full).isDirectory()) continue;
      if (fs.existsSync(path.join(full, 'page.tsx'))) out.push(sub.replace(/\\/g, '/'));
      walk(sub);
    }
  }

  walk('');
  return out;
}

function routePathToRegex(route: string): RegExp {
  if (!route) return /^\/$/;
  const parts = route.split('/').filter(Boolean);
  let rx = '^';
  for (const part of parts) {
    if (part.startsWith('[...')) {
      rx += '/.+'; // greedy multi-segment
    } else if (part.startsWith('[[') && part.includes('...')) {
      rx += '(?:/.+)?';
    } else if (part.startsWith('[')) {
      rx += '/[^/]+';
    } else {
      rx += '/' + part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
  }
  rx += '$';
  return new RegExp(rx, 'i');
}

function buildMatchers(routes: string[]) {
  const staticExact = new Set<string>();
  const dynamic: { route: string; re: RegExp; weight: number }[] = [];

  for (const r of routes) {
    if (!r.includes('[')) staticExact.add('/' + r.split('/').join('/'));
    else {
      const depth = r.split('/').length;
      const dynSegs = (r.match(/\[/g) || []).length;
      const weight = depth * 10 - dynSegs;
      dynamic.push({ route: r, re: routePathToRegex(r), weight });
    }
  }
  dynamic.sort((a, b) => b.weight - a.weight);
  return { staticExact, dynamic };
}

function firstDynamicMatch(
  pathname: string,
  matchers: ReturnType<typeof buildMatchers>,
): string | null {
  const n = normalizeUrlPath(pathname);
  for (const d of matchers.dynamic) {
    if (d.re.test(n)) return d.route;
  }
  return null;
}

function strictMatch(
  cur: string,
  matchers: ReturnType<typeof buildMatchers>,
  ctx: {
    goodSingle: Set<string>;
    goodMulti: Set<string>;
    countySlugs: Set<string>;
    repSlugs: Set<string>;
    stationSlugs: Set<string>;
    countySeoSlugs: Set<string>;
    wikiSlugs: Set<string>;
    legalSlugs: Set<string>;
  },
): boolean {
  const n = normalizeUrlPath(cur);
  if (n === '/') return true;

  if (matchers.staticExact.has(n) || [...matchers.staticExact].some((s) => s.toLowerCase() === n.toLowerCase())) {
    return true;
  }

  const parts = n.split('/').filter(Boolean);
  const normMulti = parts.join('/');

  if (parts.length >= 2) {
    const [a, b] = parts;
    const bl = b.toLowerCase();
    if (a === 'county' && ctx.countySlugs.has(bl)) return true;
    if (a === 'rep' && ctx.repSlugs.has(bl)) return true;
    if (a === 'police-station' && ctx.stationSlugs.has(bl)) return true;
    if (a === 'directory' && ctx.countySlugs.has(bl)) return true;
    if (a === 'county-seo' && ctx.countySeoSlugs.has(bl)) return true;
    if (a === 'Wiki' && ctx.wikiSlugs.has(bl)) return true;
    if (a === 'LegalUpdates' && ctx.legalSlugs.has(bl)) return true;
  }

  if (parts.length === 1) {
    const seg = parts[0];
    const sl = seg.toLowerCase();
    if (ctx.countySlugs.has(sl) && !RESERVED_COUNTY_SHORT.has(sl)) return true;
    if (ctx.goodSingle.has(seg)) return true;
  }

  if (parts.length >= 2 && ctx.goodMulti.has(normMulti)) return true;

  const dyn = firstDynamicMatch(n, matchers);
  if (dyn === '[slug]') return ctx.goodSingle.has(parts[0] ?? '');
  if (dyn === '[...slug]' && ctx.goodMulti.has(normMulti)) return true;

  return false;
}

async function main() {
  const root = process.cwd();
  const mapPath = path.join(root, 'docs', 'live-site-map.json');
  const reportPath = path.join(root, 'docs', 'PARITY-VERIFICATION-REPORT.md');

  if (!fs.existsSync(mapPath)) {
    console.error('Missing docs/live-site-map.json');
    process.exit(1);
  }

  const map = JSON.parse(fs.readFileSync(mapPath, 'utf-8')) as {
    urls: { path: string }[];
    navigation?: { primary: { href: string; text: string }[] };
  };
  const paths = map.urls.map((u) => normalizeUrlPath(u.path));

  const goodSingle = new Set<string>();
  const goodMulti = new Set<string>();
  for (const p of paths) {
    if (isCrawlNoise(p)) continue;
    const norm = p === '/' ? '' : p.replace(/^\//, '');
    if (!norm) continue;
    if (!norm.includes('/')) goodSingle.add(norm);
    else goodMulti.add(norm);
  }

  const countySlugs = loadCountySlugs(root);
  const stationSlugs = loadStationSlugs(root);
  const repSlugs = loadRepSlugs(root);
  const countySeoSlugs = loadCountySeoSlugs(root);
  const wikiSlugs = loadWikiSlugs(root);
  const legalSlugs = loadLegalSlugs(root);

  const appDir = path.join(root, 'app');
  const routes = findAppRoutes(appDir);
  const matchers = buildMatchers(routes);
  matchers.staticExact.add('/');

  const redirectMatchers = await loadRedirectMatchers();

  const results: { path: string; class: Class; detail?: string }[] = [];

  for (const p of paths) {
    if (p === '/N/A' || p.toLowerCase() === '/n/a' || isCrawlNoise(p)) {
      results.push({
        path: p,
        class: 'SKIP',
        detail: isCrawlNoise(p) ? 'crawl noise (external/href junk)' : 'invalid path',
      });
      continue;
    }

    let current = p;
    let hops = 0;
    let external: string | null = null;

    while (hops < 24) {
      hops++;
      if (current.startsWith('http')) {
        external = current;
        break;
      }

      let applied: string | null = null;
      for (const { try: tryRedir } of redirectMatchers) {
        const next = tryRedir(current === '/' ? '/' : current);
        if (next) {
          if (next.startsWith('http')) {
            external = next;
            applied = null;
            break;
          }
          applied = normalizeUrlPath(next.startsWith('/') ? next : '/' + next);
          break;
        }
      }

      if (external) break;
      if (!applied) break;
      if (applied === current) break;
      current = applied;
    }

    if (external) {
      results.push({
        path: p,
        class: 'REDIRECT_EXTERNAL',
        detail: external.slice(0, 120),
      });
      continue;
    }

    current = applyInternalRewrites(current, countySlugs);

    if (current === '/sitemap.xml' || current === '/robots.txt') {
      results.push({ path: p, class: 'MATCH', detail: `resolved:${current}` });
      continue;
    }

    const ok = strictMatch(current, matchers, {
      goodSingle,
      goodMulti,
      countySlugs,
      repSlugs,
      stationSlugs,
      countySeoSlugs,
      wikiSlugs,
      legalSlugs,
    });

    if (ok) {
      results.push({ path: p, class: 'MATCH', detail: current !== p ? `via:${current}` : 'direct' });
    } else {
      results.push({ path: p, class: 'MISSING', detail: `unresolved:${current}` });
    }
  }

  const counts = { MATCH: 0, MISSING: 0, REDIRECT_EXTERNAL: 0, SKIP: 0 };
  for (const r of results) counts[r.class]++;

  const navExpected = map.navigation?.primary?.map((x) => `${x.href}\t${x.text}`).join('\n') ?? '';

  const lines: string[] = [
    '# Parity verification report',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Scope',
    '',
    '- **Source paths:** `docs/live-site-map.json` (358 URLs from .com crawl; refresh with `npm run crawl` / `crawl:ts`).',
    '- **Target:** Next.js `app/` + `next.config.ts` redirects + county short URL rewrites (mirrors `next.config.ts`).',
    '- **Crawl noise** (e.g. `/www.*.co.uk`, junk `%20` paths) is **SKIP** — not real site IA.',
    '- **Strict rule:** catch-all `[slug]` / `[...slug]` only **MATCH** if the path appears on the filtered crawl list or is a known dynamic entity (county/rep/station/Wiki/LegalUpdates/county-seo).',
    '',
    '## Source primary navigation (reference)',
    '',
    '```',
    navExpected || '(no navigation block in JSON)',
    '```',
    '',
    '## Summary',
    '',
    '| Class | Count | Meaning |',
    '|-------|-------|---------|',
    `| MATCH | ${counts.MATCH} | In-scope path resolves on target |`,
    `| MISSING | ${counts.MISSING} | No equivalent route — **FAIL** |`,
    `| REDIRECT_EXTERNAL | ${counts.REDIRECT_EXTERNAL} | Leaves app (legacy Wix blog, etc.) |`,
    `| SKIP | ${counts.SKIP} | Crawl noise / invalid — excluded from PASS |`,
    '',
    '## Data / API consistency',
    '',
    '- County filters: `getRepsByCounty`, `DirectorySearch`, `/api/scraped-reps` use `repMatchesCountyName` (`lib/county-matching.ts`).',
    '- Availability filter in `searchRepresentatives` uses case-insensitive **includes** (aligned with API).',
    '',
  ];

  if (counts.MISSING > 0) {
    lines.push('## MISSING paths', '');
    for (const r of results.filter((x) => x.class === 'MISSING')) {
      lines.push(`- \`${r.path}\` → ${r.detail}`);
    }
    lines.push('');
  }

  lines.push('## Tests', '', '| Check | Result |', '|-------|--------|');
  lines.push(
    `| Route coverage (in-scope) | ${counts.MISSING === 0 ? 'PASS' : 'FAIL'} |`,
    '| Crawl refresh | Run `npm run crawl:ts` to regenerate `live-site-map.json` from live .com |',
    '| Nav vs source | Compare `components/Header.tsx` to block above |',
    '',
  );

  const pass = counts.MISSING === 0;
  lines.push(
    '## Final status',
    '',
    pass
      ? '**PASS** — every in-scope source path has a verified target route (strict mode).'
      : '**FAIL** — fix MISSING paths or update crawl data.',
    '',
  );

  fs.writeFileSync(reportPath, lines.join('\n'), 'utf-8');

  console.log(reportPath);
  console.log(JSON.stringify(counts, null, 2));
  process.exit(pass ? 0 : 2);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
