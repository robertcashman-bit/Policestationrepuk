/**
 * Smoke-check firmprospect:index readability (Lead engine #88 WRONGTYPE guard).
 *
 * npx tsx scripts/firm-outreach-probe-index.ts
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.production') });
config({ path: resolve(__dirname, '../.env.local') });
config();

async function main() {
  const hasKv =
    Boolean(process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL) &&
    Boolean(process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN);
  if (!hasKv) {
    console.error('[firm-outreach probe-index] KV env missing');
    process.exit(1);
  }

  const { listAllProspectIds } = await import('../lib/firm-outreach/storage');
  const ids = await listAllProspectIds();
  console.log(
    JSON.stringify(
      {
        ok: true,
        indexKey: 'firmprospect:index',
        count: ids.length,
        sample: ids.slice(0, 5),
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error('[firm-outreach probe-index] failed:', err);
  process.exit(1);
});
