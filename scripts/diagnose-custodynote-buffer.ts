/**
 * Diagnose CustodyNote Buffer quota for given dates.
 * Usage: npx tsx scripts/diagnose-custodynote-buffer.ts [YYYY-MM-DD...]
 */
import { readFileSync } from 'fs';
import { listPostsInWindow } from '@robertcashman/buffer-engine';
import { countSiteSentPosts } from '../lib/buffer/verify-cross-site';
import { CROSS_SITE_BUFFER_TARGETS } from '../lib/buffer/cross-site-sites';

function loadEnvFiles(paths: string[]) {
  for (const p of paths) {
    try {
      for (const line of readFileSync(p, 'utf8').split('\n')) {
        const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
        if (!m) continue;
        const val = m[2].replace(/^["']|["']$/g, '').trim();
        if (!val) continue;
        // Later files / later lines with non-empty values win
        process.env[m[1]] = val;
      }
    } catch {
      /* missing */
    }
  }
}

loadEnvFiles([
  '.env.local',
  '/Users/robertcashman/custody-note-website/.env.local',
]);

const apiKey = process.env.BUFFER_API_KEY?.trim();
const orgId = process.env.BUFFER_ORGANIZATION_ID?.trim();
if (!apiKey || !orgId) {
  console.error('Missing BUFFER_API_KEY or BUFFER_ORGANIZATION_ID');
  process.exit(1);
}

const cn = CROSS_SITE_BUFFER_TARGETS.find((t) => t.id === 'custodynote')!;
const dates =
  process.argv.slice(2).length > 0
    ? process.argv.slice(2)
    : ['2026-07-21', '2026-07-22', '2026-07-23'];

function nextDay(date: string): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

async function dayReport(date: string) {
  const dayStart = `${date}T00:00:00+01:00`;
  const dayEnd = `${nextDay(date)}T00:00:00+01:00`;
  const sent = await listPostsInWindow(apiKey!, orgId!, {
    status: ['sent'],
    dueAtStart: dayStart,
    dueAtEnd: dayEnd,
    channelIds: cn.channelIds,
  });
  const sched = await listPostsInWindow(apiKey!, orgId!, {
    status: ['scheduled', 'sent'],
    dueAtStart: dayStart,
    dueAtEnd: dayEnd,
    channelIds: cn.channelIds,
  });

  console.log(`\n=== ${date} ===`);
  console.log(
    `CN channels sent=${sent.length} hostMatch=${countSiteSentPosts(sent, 'custodynote.com')}`,
  );
  console.log(
    `CN channels scheduled+sent=${sched.length} hostMatch=${countSiteSentPosts(sched, 'custodynote.com')}`,
  );

  const withHost = sent.filter((p) => /custodynote\.com/i.test(p.text || ''));
  const without = sent.filter((p) => !/custodynote\.com/i.test(p.text || ''));
  console.log('with custodynote.com:');
  for (const p of withHost.slice(0, 8)) {
    console.log(' -', (p.text || '').slice(0, 140).replace(/\n/g, ' '));
  }
  if (without.length) {
    console.log(`without custodynote.com (${without.length}):`);
    for (const p of without.slice(0, 5)) {
      console.log(' -', (p.text || '').slice(0, 140).replace(/\n/g, ' '));
    }
  }
}

async function main() {
  for (const d of dates) {
    await dayReport(d);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
