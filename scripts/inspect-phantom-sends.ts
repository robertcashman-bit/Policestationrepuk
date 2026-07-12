/**
 * Inspect phantom PSA send records (no resendMessageId).
 * npx tsx scripts/inspect-phantom-sends.ts [--date=YYYY-MM-DD]
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });

async function main() {
  const dateArg = process.argv.find((a) => a.startsWith('--date='))?.split('=')[1];
  const { listAllSends } = await import('../lib/firm-outreach/storage');

  let phantom = (await listAllSends()).filter(
    (s) => s.campaignId === 'agent_cover_kent_v1' && s.sentAt && !s.resendMessageId,
  );
  if (dateArg) phantom = phantom.filter((s) => s.sentAt?.startsWith(dateArg));

  console.log('phantom count:', phantom.length);
  if (!phantom.length) return;

  const sample = phantom.slice(0, 5);
  for (const s of sample) {
    console.log(JSON.stringify({
      id: s.id,
      email: s.email,
      subject: s.subject,
      status: s.status,
      sentAt: s.sentAt,
      createdAt: s.createdAt,
      sequenceStep: s.sequenceStep,
    }));
  }

  const subjects = new Map<string, number>();
  for (const s of phantom) {
    const sub = s.subject ?? '(none)';
    subjects.set(sub, (subjects.get(sub) ?? 0) + 1);
  }
  console.log('subjects:', Object.fromEntries(subjects));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
