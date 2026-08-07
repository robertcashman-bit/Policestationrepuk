/**
 * Security headers regression test for Policestationrepuk.
 *
 * Ensures next.config.ts headers() returns required security headers.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const configSrc = readFileSync(join(process.cwd(), 'next.config.ts'), 'utf-8');

const REQUIRED_HEADERS = [
  'X-Frame-Options',
  'X-Content-Type-Options',
  'Referrer-Policy',
  'Permissions-Policy',
  'Strict-Transport-Security',
  'Content-Security-Policy',
];

describe('security headers regression', () => {
  it('next.config.ts includes all required security header keys', () => {
    for (const header of REQUIRED_HEADERS) {
      expect(configSrc, `${header} not found in next.config.ts`).toContain(header);
    }
  });

  it('CSP includes default-src directive', () => {
    expect(configSrc).toContain('default-src');
  });

  it('HSTS has a max-age', () => {
    expect(configSrc).toMatch(/max-age=\d+/);
  });

  it('admin and Account paths use no-store', () => {
    expect(configSrc).toContain('source: "/admin/:path*"');
    expect(configSrc).toContain('source: "/Account"');
    expect(configSrc).toMatch(/no-store, max-age=0, must-revalidate/);
  });

  it('CSP does not allow unused public CDNs', () => {
    expect(configSrc).not.toContain('esm.sh');
    expect(configSrc).not.toContain('cdn.jsdelivr.net');
    expect(configSrc).not.toContain('unpkg.com');
  });
});
