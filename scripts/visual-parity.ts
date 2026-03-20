/**
 * Pixel-level visual parity: policestationrepuk.com (source) vs policestationrepuk.org (target).
 * Uses Playwright + pngjs + pixelmatch. Continues on errors; writes JSON + Markdown reports.
 *
 * npm run visual-parity
 * VISUAL_PARITY_MAX=40 npx tsx scripts/visual-parity.ts
 */

import fs from 'fs';
import path from 'path';
import { chromium, type Page } from 'playwright';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { filterInScopePaths } from '../lib/parity-crawl-noise';
import {
  buildPriorityPaths,
  STABILISE_CSS,
  visualParityConfig,
} from './visual-parity.config';

interface RowResult {
  path: string;
  sourceUrl: string;
  targetUrl: string;
  ok: boolean;
  error?: string;
  diffRatio?: number;
  diffPixels?: number;
  width?: number;
  height?: number;
}

/** Stable filenames (Windows FS is case-insensitive — /Directory vs /directory must not collide). */
function pathToFilename(route: string): string {
  if (route === '/') return 'home';
  const disambig: Record<string, string> = {
    '/Directory': 'directory__capital-D',
    '/directory': 'directory__lower-d',
    '/search': 'search',
  };
  if (disambig[route]) return disambig[route];
  const s = route.replace(/^\//, '').replace(/\//g, '__');
  return s.replace(/[^a-zA-Z0-9._-]/g, '_') || 'route';
}

async function injectStability(page: Page): Promise<void> {
  await page.addStyleTag({ content: STABILISE_CSS });
  for (const sel of visualParityConfig.maskSelectors) {
    if (!sel) continue;
    try {
      await page.addStyleTag({
        content: `${sel} { visibility: hidden !important; opacity: 0 !important; pointer-events: none !important; }`,
      });
    } catch {
      /* ignore invalid selectors */
    }
  }
}

async function capture(page: Page, url: string): Promise<Buffer> {
  await page.goto(url, {
    waitUntil: 'networkidle',
    timeout: visualParityConfig.navigationTimeoutMs,
  });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.evaluate(() => document.fonts.ready);
  await injectStability(page);
  await new Promise((r) => setTimeout(r, visualParityConfig.postLoadWaitMs));
  const buf = await page.screenshot({
    type: 'png',
    fullPage: false,
  });
  return buf as Buffer;
}

function alignDimensions(img1: PNG, img2: PNG): { a: PNG; b: PNG } {
  const w = Math.min(img1.width, img2.width);
  const h = Math.min(img1.height, img2.height);
  if (img1.width === w && img1.height === h && img2.width === w && img2.height === h) {
    return { a: img1, b: img2 };
  }
  const crop = (src: PNG): PNG => {
    const out = new PNG({ width: w, height: h });
    PNG.bitblt(src, out, 0, 0, w, h, 0, 0);
    return out;
  };
  return { a: crop(img1), b: crop(img2) };
}

function compareBuffers(bufA: Buffer, bufB: Buffer): {
  diffRatio: number;
  diffPixels: number;
  width: number;
  height: number;
  diffPng: PNG;
} {
  const img1 = PNG.sync.read(bufA);
  const img2 = PNG.sync.read(bufB);
  const { a, b } = alignDimensions(img1, img2);
  const w = a.width;
  const h = a.height;
  const diff = new PNG({ width: w, height: h });
  const diffPixels = pixelmatch(a.data, b.data, diff.data, w, h, {
    threshold: visualParityConfig.pixelmatch.threshold,
    includeAA: visualParityConfig.pixelmatch.includeAA,
    diffColor: [...visualParityConfig.pixelmatch.diffColor],
  });
  const total = w * h;
  return {
    diffRatio: total ? diffPixels / total : 0,
    diffPixels,
    width: w,
    height: h,
    diffPng: diff,
  };
}

function orderPaths(allPaths: string[]): string[] {
  const priority = buildPriorityPaths();
  /** Priority routes first (always), even when absent from crawl map — fixes `/search` missing from live-site-map.json. */
  const out: string[] = [];
  for (const p of priority) {
    if (!out.includes(p)) out.push(p);
  }
  for (const p of allPaths) {
    if (!out.includes(p)) out.push(p);
  }
  const max = visualParityConfig.maxPages;
  if (max > 0) return out.slice(0, max);
  return out;
}

async function main() {
  const root = process.cwd();
  const mapPath = path.join(root, 'docs', 'live-site-map.json');
  if (!fs.existsSync(mapPath)) {
    console.error('Missing docs/live-site-map.json');
    process.exit(1);
  }

  const map = JSON.parse(fs.readFileSync(mapPath, 'utf-8')) as { urls: { path: string }[] };
  const rawPaths = map.urls.map((u) => u.path);
  const inScope = filterInScopePaths(rawPaths);
  const paths = orderPaths(inScope);

  const sourceDir = path.join(visualParityConfig.shotsDir, 'source');
  const targetDir = path.join(visualParityConfig.shotsDir, 'target');
  const diffDir = path.join(visualParityConfig.shotsDir, 'diff');
  for (const d of [sourceDir, targetDir, diffDir]) {
    fs.mkdirSync(d, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const ctxOpts = {
    viewport: visualParityConfig.viewport,
    deviceScaleFactor: visualParityConfig.deviceScaleFactor,
    ignoreHTTPSErrors: true,
  };

  const results: RowResult[] = [];
  let criticalDiff = 0;
  let warnDiff = 0;
  let errors = 0;

  for (const route of paths) {
    const sourceUrl = `${visualParityConfig.sourceBase}${route === '/' ? '/' : route}`;
    const targetUrl = `${visualParityConfig.targetBase}${route === '/' ? '/' : route}`;
    const base = pathToFilename(route);

    const row: RowResult = { path: route, sourceUrl, targetUrl, ok: false };

    let ctxS;
    let ctxT;
    try {
      ctxS = await browser.newContext(ctxOpts);
      ctxT = await browser.newContext(ctxOpts);
      const pageS = await ctxS.newPage();
      const pageT = await ctxT.newPage();

      const [bufS, bufT] = await Promise.all([
        capture(pageS, sourceUrl).catch((e) => {
          throw new Error(`source: ${(e as Error).message}`);
        }),
        capture(pageT, targetUrl).catch((e) => {
          throw new Error(`target: ${(e as Error).message}`);
        }),
      ]);

      fs.writeFileSync(path.join(sourceDir, `${base}.png`), bufS);
      fs.writeFileSync(path.join(targetDir, `${base}.png`), bufT);

      const cmp = compareBuffers(bufS, bufT);
      row.diffRatio = cmp.diffRatio;
      row.diffPixels = cmp.diffPixels;
      row.width = cmp.width;
      row.height = cmp.height;
      row.ok = true;

      fs.writeFileSync(path.join(diffDir, `${base}.png`), PNG.sync.write(cmp.diffPng));

      if (cmp.diffRatio >= visualParityConfig.failDiffRatio) criticalDiff++;
      else if (cmp.diffRatio >= visualParityConfig.warnDiffRatio) warnDiff++;
    } catch (e) {
      row.error = (e as Error).message;
      errors++;
    } finally {
      await ctxS?.close();
      await ctxT?.close();
    }

    results.push(row);
  }

  await browser.close();

  const compared = results.filter((r) => r.ok && r.diffRatio !== undefined);
  const avgDiff =
    compared.length > 0 ? compared.reduce((s, r) => s + (r.diffRatio || 0), 0) / compared.length : 0;
  const worst = [...compared].sort((a, b) => (b.diffRatio || 0) - (a.diffRatio || 0)).slice(0, 15);

  const errorRatio = results.length ? errors / results.length : 0;
  const failCriticalVisual = criticalDiff > 0;
  /** Only fail the process on widespread navigation errors (tolerate flaky paths / offline smoke tests). */
  const failErrors = errorRatio > 0.35;

  const jsonPath = path.join(root, 'docs', 'visual-parity-report.json');
  const mdPath = path.join(root, 'docs', 'VISUAL-PARITY-REPORT.md');

  const payload = {
    generatedAt: new Date().toISOString(),
    sourceBase: visualParityConfig.sourceBase,
    targetBase: visualParityConfig.targetBase,
    viewport: visualParityConfig.viewport,
    pathsAttempted: results.length,
    comparedOk: compared.length,
    errors,
    warnDiffCount: warnDiff,
    criticalDiffCount: criticalDiff,
    avgDiffRatio: avgDiff,
    thresholds: {
      warnDiffRatio: visualParityConfig.warnDiffRatio,
      failDiffRatio: visualParityConfig.failDiffRatio,
      maxErrorRatio: visualParityConfig.maxErrorRatio,
    },
    worst,
    results,
  };

  fs.writeFileSync(jsonPath, JSON.stringify(payload, null, 2), 'utf-8');

  const statusLine = failErrors || failCriticalVisual ? '**FAIL**' : warnDiff > 0 ? 'PASS WITH WARNINGS' : 'PASS';

  const md = [
    '# Visual parity report',
    '',
    `Generated: ${payload.generatedAt}`,
    '',
    `| | |`,
    `|---:|---|`,
    `| Source | \`${payload.sourceBase}\` |`,
    `| Target | \`${payload.targetBase}\` |`,
    `| Viewport | ${payload.viewport.width}×${payload.viewport.height} (viewport capture) |`,
    `| Pages | ${payload.pathsAttempted} |`,
    `| Compared OK | ${payload.comparedOk} |`,
    `| Navigation errors | ${payload.errors} |`,
    `| Avg diff ratio | ${(avgDiff * 100).toFixed(2)}% |`,
    `| ≥ warn (${(visualParityConfig.warnDiffRatio * 100).toFixed(1)}%) | ${warnDiff} |`,
    `| ≥ fail (${(visualParityConfig.failDiffRatio * 100).toFixed(1)}%) | ${criticalDiff} |`,
    '',
    '## Worst diffs',
    '',
    ...worst.map((w) => `- \`${w.path}\` — ${((w.diffRatio || 0) * 100).toFixed(2)}% (${w.diffPixels} px)`),
    '',
    '## Status',
    '',
    statusLine,
    '',
    'Screenshots: `screenshots/source/`, `screenshots/target/`, `screenshots/diff/`.',
    '',
  ].join('\n');

  fs.writeFileSync(mdPath, md, 'utf-8');

  console.log(mdPath);
  console.log(jsonPath);
  console.log(JSON.stringify({ statusLine, errors, criticalDiff, warnDiff, avgDiff }, null, 2));

  if (failErrors) process.exit(3);
  if (failCriticalVisual) process.exit(2);
  if (errors > 0 || warnDiff > 0) process.exit(1);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
