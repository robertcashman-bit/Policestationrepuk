import { NextResponse } from 'next/server';
import { getRawReps } from '@/lib/data';
import { storeMagicCode } from '@/lib/auth';
import { sendMagicCode } from '@/lib/email';
import { getKV } from '@/lib/kv';

export async function POST(request: Request) {
  const kv = getKV();
  if (!kv) {
    return NextResponse.json(
      { error: 'Login system not configured' },
      { status: 503 },
    );
  }

  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
  }

  const reps = getRawReps();
  const rep = reps.find((r) => r.email.toLowerCase() === email);
  if (!rep) {
    // Don't reveal whether the email exists — return success either way
    return NextResponse.json({ ok: true });
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  await storeMagicCode(email, code);
  await sendMagicCode(email, code);

  return NextResponse.json({ ok: true });
}
