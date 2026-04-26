#!/usr/bin/env node
// Reliable Vercel env setter:
//   node scripts/vercel-set-env.mjs add NAME value env [env...]
//   node scripts/vercel-set-env.mjs rm  NAME env [env...]
// Pipes the value via stdin to `vercel env add` using Node's spawn so
// PowerShell's pipe quirks don't truncate it.
import { spawn } from 'node:child_process';

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ['pipe', 'inherit', 'inherit'], shell: false, ...opts });
    if (opts.input != null) {
      child.stdin.write(opts.input);
      child.stdin.end();
    } else {
      child.stdin.end();
    }
    child.on('error', reject);
    child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
  });
}

async function main() {
  const [, , action, name, ...rest] = process.argv;
  if (!action || !name) {
    console.error('usage: node scripts/vercel-set-env.mjs <add|rm> NAME [value] env [env...]');
    process.exit(2);
  }
  const npxBin = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  if (action === 'rm') {
    for (const env of rest) {
      console.log(`[rm] ${name} ${env}`);
      try {
        await run(npxBin, ['--yes', 'vercel', 'env', 'rm', name, env, '--yes']);
      } catch (err) {
        console.error(`  (rm failed, continuing): ${err.message}`);
      }
    }
    return;
  }
  if (action === 'add') {
    const [value, ...envs] = rest;
    if (value == null || envs.length === 0) {
      console.error('add requires: NAME value env [env...]');
      process.exit(2);
    }
    for (const env of envs) {
      console.log(`[add] ${name} ${env} (${value.length} chars)`);
      await run(npxBin, ['--yes', 'vercel', 'env', 'add', name, env], { input: value });
    }
    return;
  }
  console.error(`unknown action: ${action}`);
  process.exit(2);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
