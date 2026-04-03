import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { destroySession, getSessionCookieName } from '@/lib/auth';

export async function POST() {
  const cookieStore = await cookies();
  const name = getSessionCookieName();
  const token = cookieStore.get(name)?.value;

  if (token) {
    await destroySession(token);
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(name, '', { maxAge: 0, path: '/' });
  return response;
}
