import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const routePath = path.resolve(
  __dirname,
  '..',
  'app',
  'api',
  'checkout',
  'featured',
  'route.ts',
);
const source = fs.readFileSync(routePath, 'utf-8');

describe('checkout/featured route', () => {
  it('imports the lemonsqueezy client + helpers', () => {
    expect(source).toMatch(/from\s+['"]@\/lib\/lemonsqueezy['"]/);
    expect(source).toMatch(/createCheckout/);
    expect(source).toMatch(/getVariantId/);
    expect(source).toMatch(/PRICING/);
  });

  it('uses getSession() and returns 401 when there is no session', () => {
    expect(source).toMatch(/getSession\(\)/);
    expect(source).toMatch(/['"]Not authenticated['"]/);
    expect(source).toMatch(/status:\s*401/);
  });

  it('looks up the rep with findRep and returns 404 when missing', () => {
    expect(source).toMatch(/findRep\(/);
    expect(source).toMatch(/status:\s*404/);
  });

  it('rejects already-featured listings with 400', () => {
    expect(source).toMatch(/already featured/i);
    expect(source).toMatch(/status:\s*400/);
  });

  it('validates the requested tier against PRICING', () => {
    expect(source).toMatch(/PRICING\[tier\]/);
    expect(source).toMatch(/Invalid pricing tier/);
  });

  it('returns 500 when the LS variant id env is not set', () => {
    expect(source).toMatch(/Payment not configured/);
    expect(source).toMatch(/status:\s*500/);
  });

  it('passes custom_data (repId, userId, email, tier, repSlug) through to LS', () => {
    expect(source).toMatch(/customData:\s*\{[^}]*repId[^}]*userId[^}]*email[^}]*tier[^}]*repSlug[^}]*\}/s);
  });

  it('uses APP_BASE_URL / NEXT_PUBLIC_SITE_URL with a sensible production fallback', () => {
    expect(source).toMatch(/APP_BASE_URL/);
    expect(source).toMatch(/NEXT_PUBLIC_SITE_URL/);
    expect(source).toMatch(/policestationrepuk\.org/);
  });

  it('returns the LS checkout URL on success', () => {
    expect(source).toMatch(/checkout\.url/);
  });
});
