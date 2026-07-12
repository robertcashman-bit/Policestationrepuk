/**
 * List outreach sends in a date window.
 * npx tsx scripts/outreach-send-history.ts [--days=2]
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { isProviderAcceptedMessageId } from '@robertcashman/firm-outreach-core';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });

const daysArg = process.argv.find((a) => a.startsWith('--days='))?.split('=')[1];
const sinceArg = process.argv.find((a) => a.startsWith('--since='))?.split('=')[1];
const untilArg = process.argv.find((a) => a.startsWith('--until='))?.split('=')[1];
const days = Math.max(1, Number(daysArg ?? 2) || 2);

async function main() {
  const { listAllSends } = await import('../lib/firm-outreach/storage');

  const now = new Date();
  const since = sinceArg ? new Date(`${sinceArg}T00:00:00.000Z`) : new Date(now);
  if (!sinceArg) since.setUTCDate(since.getUTCDate() - days);
  const sinceIso = since.toISOString();
  const untilIso = untilArg ? `${untilArg}T23:59:59.999Z` : undefined;

  const all = await listAllSends();
  const recent = all
    .filter((s) => s.sentAt && s.sentAt >= sinceIso && (!untilIso || s.sentAt <= untilIso))
    .sort((a, b) => (a.sentAt ?? '').localeCompare(b.sentAt ?? ''));

  const real = recent.filter((s) => isProviderAcceptedMessageId(s.resendMessageId));
  const phantom = recent.filter((s) => !isProviderAcceptedMessageId(s.resendMessageId));

  console.log(`=== LAST ${days} DAYS OUTREACH SENDS (since ${sinceIso.slice(0, 10)}) ===`);
  console.log('Total send records:', recent.length);
  console.log('Provider-confirmed (real):', real.length);
  console.log('Phantom (no Resend ID):', phantom.length);

  const byCampaign: Record<string, { real: number; phantom: number }> = {};
  for (const s of recent) {
    byCampaign[s.campaignId] ??= { real: 0, phantom: 0 };
    if (isProviderAcceptedMessageId(s.resendMessageId)) byCampaign[s.campaignId].real++;
    else byCampaign[s.campaignId].phantom++;
  }
  console.log('By campaign:', JSON.stringify(byCampaign, null, 2));

  const byDay: Record<string, { real: number; phantom: number }> = {};
  for (const s of recent) {
    const day = s.sentAt?.slice(0, 10) ?? 'unknown';
    byDay[day] ??= { real: 0, phantom: 0 };
    if (isProviderAcceptedMessageId(s.resendMessageId)) byDay[day].real++;
    else byDay[day].phantom++;
  }
  console.log('By day:', JSON.stringify(byDay, null, 2));

  console.log('\n=== REAL SENDS (provider-confirmed) ===');
  for (const s of real) {
    console.log(
      [
        s.sentAt,
        s.campaignId,
        s.email,
        s.firmName,
        `step${s.sequenceStep}`,
        s.resendMessageId,
      ].join(' | '),
    );
  }

  if (phantom.length) {
    console.log('\n=== PHANTOM SENDS (NOT actually delivered via Resend) ===');
    console.log('Count:', phantom.length);
    const show = phantom.length <= 30 ? phantom : phantom.slice(0, 15);
    for (const s of show) {
      console.log(
        [s.sentAt, s.campaignId, s.email, s.firmName, `step${s.sequenceStep}`, s.subject?.slice(0, 60)].join(' | '),
      );
    }
    if (phantom.length > show.length) {
      console.log(`... and ${phantom.length - show.length} more phantoms`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
