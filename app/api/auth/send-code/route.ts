import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { isAdminEmail } from '@/lib/admin-auth';
import { getRawReps, getRegisteredRepByEmail } from '@/lib/data';
import { storeMagicCode } from '@/lib/auth';
import { sendMagicCode } from '@/lib/email';
import { getKV } from '@/lib/kv';
import { getClientIp, rateLimitOk } from '@/lib/contact-guards';
import { authSendCodeBodySchema, zodErrorMessage } from '@/lib/validation/public-forms';

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = await rateLimitOk({ ip, scope: 'auth-send-code', max: 10, windowMs: 15 * 60 * 1000 });
  if (!limit.ok) {
    return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 });
  }

  const kv = getKV();
  if (!kv) {
    return NextResponse.json(
      { error: 'Login system not configured' },
      { status: 503 },
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = authSendCodeBodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: zodErrorMessage(parsed.error) }, { status: 400 });
  }

  const email = parsed.data.email;

  const reps = getRawReps();
  const rep = reps.find((r) => r.email.toLowerCase() === email);
  const registeredRep = !rep ? await getRegisteredRepByEmail(email) : null;
  const adminLogin = isAdminEmail(email);

  if (!rep && !registeredRep && !adminLogin) {
    return NextResponse.json({ ok: true });
  }

  const code = String(crypto.randomInt(100000, 1000000));
  await storeMagicCode(email, code);
  await sendMagicCode(email, code);

  return NextResponse.json({ ok: true });
}
