#!/usr/bin/env node
/**
 * Production deploy helper for PoliceStationRepUK.
 *
 * Source of truth: origin = robertcashman-bit/Policestationrepuk (master).
 * Vercel is linked to that repo; CI → vercel-deploy-hook promotes after push.
 *
 * Usage: npm run deploy
 * Flags: --skip-push  (typecheck only)
 *        --vercel     (also run `vercel --prod` after push)
 */
import { spawnSync } from 'node:child_process';

const args = new Set(process.argv.slice(2));
const skipPush = args.has('--skip-push');
const alsoVercel = args.has('--vercel');

function run(cmd, cmdArgs, opts = {}) {
  const result = spawnSync(cmd, cmdArgs, {
    stdio: 'inherit',
    shell: false,
    ...opts,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log('[deploy] Production git source: origin (robertcashman-bit/Policestationrepuk)');
console.log('[deploy] Do not push droid for production — it is read-only from this workflow.');

const branch = spawnSync('git', ['branch', '--show-current'], { encoding: 'utf8' });
const current = (branch.stdout || '').trim();
if (current !== 'master' && current !== 'main') {
  console.error(`[deploy] Refuse to deploy from branch "${current || '(detached)'}". Checkout master first.`);
  process.exit(1);
}

console.log('[deploy] typecheck…');
run('npx', ['tsc', '--noEmit']);

if (skipPush) {
  console.log('[deploy] --skip-push set; done after typecheck.');
  process.exit(0);
}

const status = spawnSync('git', ['status', '--porcelain'], { encoding: 'utf8' });
if ((status.stdout || '').trim()) {
  console.error('[deploy] Working tree is dirty. Commit or stash before deploy.');
  process.exit(1);
}

console.log('[deploy] git push origin HEAD…');
run('git', ['push', 'origin', 'HEAD']);

console.log('[deploy] Pushed. CI + vercel-deploy-hook will promote production when checks pass.');
if (alsoVercel) {
  console.log('[deploy] --vercel: running vercel --prod…');
  run('npx', ['vercel', 'deploy', '--prod', '--yes']);
}

console.log('[deploy] Live: https://policestationrepuk.org');
