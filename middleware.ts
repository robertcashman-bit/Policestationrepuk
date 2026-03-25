import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { LEGACY_EXACT_REDIRECTS } from '@/lib/legacy-exact-redirects';
import { COUNTY_SLUG_SET } from '@/lib/county-slugs-bundled';
import { COUNTY_SEO_SLUG_TO_DIRECTORY_SLUG } from '@/lib/county-seo-directory-slugs';

const PS_REP_PREFIX = '/police-station-representatives-';

/** Normalize non-canonical hosts to https://policestationrepuk.org (301). */
function canonicalHostRedirect(request: NextRequest): NextResponse | null {
  const rawHost = request.headers.get('host') ?? '';
  const host = rawHost.split(':')[0]?.toLowerCase() ?? '';
  if (!host || host === 'localhost' || host.endsWith('.localhost')) return null;

  const apex = 'policestationrepuk.org';

  if (host === 'www.policestationrepuk.org') {
    const url = request.nextUrl.clone();
    url.hostname = apex;
    url.protocol = 'https:';
    return NextResponse.redirect(url, 301);
  }

  if (host === 'policestationrepuk.com' || host === 'www.policestationrepuk.com') {
    const url = request.nextUrl.clone();
    url.hostname = apex;
    url.protocol = 'https:';
    return NextResponse.redirect(url, 301);
  }

  /**
   * Optional: send a *known* production Vercel hostname to the canonical domain.
   * Set e.g. CANONICAL_REDIRECT_FROM_VERCEL_HOST=my-app.vercel.app — avoids breaking preview deployments.
   */
  const vercelAlias = process.env.CANONICAL_REDIRECT_FROM_VERCEL_HOST?.trim().toLowerCase();
  if (vercelAlias && host === vercelAlias) {
    const url = request.nextUrl.clone();
    url.hostname = apex;
    url.protocol = 'https:';
    return NextResponse.redirect(url, 301);
  }

  return null;
}

export function middleware(request: NextRequest) {
  const hostRedirect = canonicalHostRedirect(request);
  if (hostRedirect) return hostRedirect;

  const path = request.nextUrl.pathname;

  if (path.startsWith('/_next') || path.startsWith('/api') || path.includes('.')) {
    return NextResponse.next();
  }

  const key = path.toLowerCase();
  const legacyTarget = LEGACY_EXACT_REDIRECTS[key];
  if (legacyTarget && path !== legacyTarget) {
    const url = request.nextUrl.clone();
    url.pathname = legacyTarget;
    return NextResponse.redirect(url, 308);
  }

  if (path === '/Directory') {
    const url = request.nextUrl.clone();
    url.pathname = '/directory';
    return NextResponse.redirect(url, 308);
  }

  if (path.startsWith(PS_REP_PREFIX) && !path.slice(PS_REP_PREFIX.length).includes('/')) {
    const slug = path.slice(PS_REP_PREFIX.length).toLowerCase();
    if (COUNTY_SLUG_SET.has(slug)) {
      const url = request.nextUrl.clone();
      url.pathname = `/directory/${slug}`;
      return NextResponse.redirect(url, 308);
    }
  }

  const countyMatch = path.match(/^\/county\/([^/]+)\/?$/);
  if (countyMatch) {
    const slug = countyMatch[1].toLowerCase();
    if (COUNTY_SLUG_SET.has(slug)) {
      const url = request.nextUrl.clone();
      url.pathname = `/directory/${slug}`;
      return NextResponse.redirect(url, 308);
    }
  }

  const seoMatch = path.match(/^\/county-seo\/([^/]+)\/?$/);
  if (seoMatch) {
    const seoSlug = seoMatch[1].toLowerCase();
    const dirSlug = COUNTY_SEO_SLUG_TO_DIRECTORY_SLUG[seoSlug];
    if (dirSlug) {
      const url = request.nextUrl.clone();
      url.pathname = `/directory/${dirSlug}`;
      return NextResponse.redirect(url, 308);
    }
  }

  const oneSeg = path.match(/^\/([^/]+)\/?$/);
  if (oneSeg) {
    const seg = oneSeg[1].toLowerCase();
    if (COUNTY_SLUG_SET.has(seg)) {
      const url = request.nextUrl.clone();
      url.pathname = `/directory/${seg}`;
      return NextResponse.redirect(url, 308);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
