/**
 * Combined parity: strict routes + visual screenshots + summary markdown.
 *
 * npm run parity:full
 *
 * Env (optional): same as visual-parity (VISUAL_PARITY_MAX, etc.)
 */

import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const root = process.cwd();

function runScript(rel: string): number {
  const res = spawnSync('npx', ['tsx', rel], {
    cwd: root,
    stdio: 'inherit',
    shell: true,
    env: process.env,
  });
  return res.status ?? 1;
}

function readRouteReport(): { line: string; pass: boolean } {
  const p = path.join(root, 'docs', 'PARITY-VERIFICATION-REPORT.md');
  if (!fs.existsSync(p)) return { line: '(missing PARITY-VERIFICATION-REPORT.md)', pass: false };
  const text = fs.readFileSync(p, 'utf-8');
  const pass = /\*\*PASS\*\*/.test(text) && !/MISSING \| [1-9]/.test(text);
  const m = text.match(/\| MISSING \| (\d+)/);
  const line = m ? `Route MISSING count: ${m[1]}` : 'Route report present';
  return { line, pass: pass && (!m || m[1] === '0') };
}

function readVisualReport(): {
  summary: string;
  status: 'PASS' | 'PASS_WITH_WARNINGS' | 'FAIL' | 'NOT_RUN';
  avgDiff?: number;
  critical?: number;
  errors?: number;
} {
  const p = path.join(root, 'docs', 'visual-parity-report.json');
  if (!fs.existsSync(p)) return { summary: 'Visual report not generated.', status: 'NOT_RUN' };
  try {
    const j = JSON.parse(fs.readFileSync(p, 'utf-8')) as {
      avgDiffRatio: number;
      criticalDiffCount: number;
      errors: number;
      warnDiffCount: number;
      pathsAttempted?: number;
    };
    const critical = j.criticalDiffCount ?? 0;
    const errors = j.errors ?? 0;
    const warn = j.warnDiffCount ?? 0;
    const attempted = j.pathsAttempted ?? 1;
    const errRatio = attempted ? errors / attempted : 0;
    if (errRatio > 0.35)
      return {
        summary: `Visual: navigation errors (${errors} / ${attempted} paths).`,
        status: 'FAIL',
        avgDiff: j.avgDiffRatio,
        critical,
        errors,
      };
    if (critical > 0)
      return {
        summary: `Visual: ${critical} page(s) ≥ fail threshold.`,
        status: 'FAIL',
        avgDiff: j.avgDiffRatio,
        critical,
        errors,
      };
    if (warn > 0)
      return {
        summary: `Visual: ${warn} page(s) above warn threshold; avg diff ${((j.avgDiffRatio || 0) * 100).toFixed(2)}%.`,
        status: 'PASS_WITH_WARNINGS',
        avgDiff: j.avgDiffRatio,
        critical: 0,
        errors,
      };
    return {
      summary: `Visual: avg diff ${((j.avgDiffRatio || 0) * 100).toFixed(2)}%.`,
      status: 'PASS',
      avgDiff: j.avgDiffRatio,
      critical: 0,
      errors,
    };
  } catch {
    return { summary: 'Visual JSON parse error.', status: 'FAIL' };
  }
}

function dataPipelineNote(): string {
  const scraped = fs.existsSync(path.join(root, 'data', 'scraped-reps.json'));
  const fallback = fs.existsSync(path.join(root, 'data', 'reps.json'));
  return `scraped-reps.json present: ${scraped}; reps.json present: ${fallback} (merge in lib/data.ts).`;
}

function main() {
  console.log('\n=== 1/2 Route parity (strict) ===\n');
  const routeExit = runScript('scripts/parity-verify.ts');

  console.log('\n=== 2/2 Visual parity (Playwright) ===\n');
  const visualExit = runScript('scripts/visual-parity.ts');

  const route = readRouteReport();
  const visual = readVisualReport();

  let overall: 'PASS' | 'PASS WITH WARNINGS' | 'FAIL' = 'PASS';
  if (routeExit !== 0 || !route.pass) overall = 'FAIL';
  else if (visualExit === 2 || visualExit === 3 || visual.status === 'FAIL') overall = 'FAIL';
  else if (visual.status === 'PASS_WITH_WARNINGS') overall = 'PASS WITH WARNINGS';

  const md = [
    '# Final parity summary',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Overall status',
    '',
    `**${overall}**`,
    '',
    '## Layer A — Route parity',
    '',
    `- Script exit: ${routeExit}`,
    `- ${route.line}`,
    `- Report: \`docs/PARITY-VERIFICATION-REPORT.md\``,
    '',
    '## Layer B — Data pipeline',
    '',
    dataPipelineNote(),
    '',
    '## Layer C — Visual parity',
    '',
    `- Script exit: ${visualExit}`,
    `- ${visual.summary}`,
    `- Report: \`docs/VISUAL-PARITY-REPORT.md\`, \`docs/visual-parity-report.json\``,
    '',
    '## Layer D — Global UI / nav',
    '',
    '- Header/footer definitions: `lib/site-navigation.ts` (labels + order from .com crawl).',
    '- Target-only parity masks: `data-parity-mask` on cookie banner / help widget for fair screenshots.',
    '',
    '## Commands',
    '',
    '- `npm run parity` — route parity only',
    '- `npm run visual-parity` — screenshots (requires network; optional `VISUAL_PARITY_MAX=40`)',
    '- `npm run parity:full` — this suite',
    '',
  ].join('\n');

  fs.writeFileSync(path.join(root, 'docs', 'FINAL-PARITY-SUMMARY.md'), md, 'utf-8');
  console.log('\nWritten docs/FINAL-PARITY-SUMMARY.md\n');

  if (overall === 'FAIL') process.exit(2);
  if (overall === 'PASS WITH WARNINGS') process.exit(1);
  process.exit(0);
}

try {
  main();
} catch (e) {
  console.error(e);
  process.exit(1);
}
