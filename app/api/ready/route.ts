import { NextResponse } from 'next/server';
import { getKV } from '@/lib/kv';
import { isCronAuthorized } from '@/lib/cron-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function hasKvCreds(): boolean {
  const url =
    process.env.UPSTASH_REDIS_REST_URL?.trim() || process.env.KV_REST_API_URL?.trim() || '';
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN?.trim() || process.env.KV_REST_API_TOKEN?.trim() || '';
  return Boolean(url && token);
}

/**
 * Public readiness probe returns only `{ ok, timestamp }`.
 * Detailed integration checks require cron/admin secret authorisation.
 */
export async function GET(request: Request) {
  const checks = {
    kvConfigured: hasKvCreds(),
    cronSecretConfigured: Boolean(process.env.CRON_SECRET?.trim()),
    resendConfigured: Boolean(process.env.RESEND_API_KEY?.trim()),
    bufferConfigured: Boolean(process.env.BUFFER_API_KEY?.trim()),
    serperConfigured: Boolean(process.env.SERPER_API_KEY?.trim()),
  };

  let kvPing = false;
  if (checks.kvConfigured) {
    try {
      const kv = getKV();
      if (kv) {
        await kv.ping();
        kvPing = true;
      }
    } catch {
      kvPing = false;
    }
  }

  const ready =
    checks.kvConfigured &&
    kvPing &&
    checks.cronSecretConfigured &&
    checks.resendConfigured;

  const timestamp = new Date().toISOString();
  const authorised = isCronAuthorized(request);

  if (!authorised) {
    return NextResponse.json({ ok: ready, timestamp }, { status: ready ? 200 : 503 });
  }

  return NextResponse.json(
    {
      ok: ready,
      checks: { ...checks, kvPing },
      timestamp,
    },
    { status: ready ? 200 : 503 },
  );
}
