import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { LEGACY_EXACT_REDIRECTS } from '@/lib/legacy-exact-redirects';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (path.startsWith('/_next') || path.startsWith('/api') || path.includes('.')) {
    return NextResponse.next();
  }

  const key = path.toLowerCase();
  const target = LEGACY_EXACT_REDIRECTS[key];
  if (target && path !== target) {
    const url = request.nextUrl.clone();
    url.pathname = target;
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
