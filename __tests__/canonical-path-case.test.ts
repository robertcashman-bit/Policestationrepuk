import { describe, expect, it } from 'vitest';
import {
  publicPath,
  resolveCanonicalPathCase,
} from '@/lib/canonical-path-case';
import { LEGACY_EXACT_REDIRECTS } from '@/lib/legacy-exact-redirects';

describe('resolveCanonicalPathCase', () => {
  it('301s PascalCase Contact to lowercase and rewrites lowercase to filesystem', () => {
    expect(resolveCanonicalPathCase('/Contact')).toEqual({
      canonicalPath: '/contact',
      rewritePath: '/Contact',
      isCanonical: false,
    });
    expect(resolveCanonicalPathCase('/contact')).toEqual({
      canonicalPath: '/contact',
      rewritePath: '/Contact',
      isCanonical: true,
    });
  });

  it('handles nested WhatsApp paths', () => {
    expect(resolveCanonicalPathCase('/WhatsApp/firms')?.canonicalPath).toBe('/whatsapp/firms');
    expect(resolveCanonicalPathCase('/whatsapp/firms')?.rewritePath).toBe('/WhatsApp/firms');
  });

  it('prefers longer folder matches (AboutFounder over About)', () => {
    expect(resolveCanonicalPathCase('/AboutFounder')?.canonicalPath).toBe('/aboutfounder');
    expect(resolveCanonicalPathCase('/aboutfounder')?.rewritePath).toBe('/AboutFounder');
  });

  it('leaves Blog alone (not in lowercase-canonical list)', () => {
    expect(resolveCanonicalPathCase('/Blog')).toBeNull();
    expect(resolveCanonicalPathCase('/blog')).toBeNull();
  });
});

describe('publicPath', () => {
  it('lowercases known folders and preserves query strings', () => {
    expect(publicPath('/FAQ')).toBe('/faq');
    expect(publicPath('/WhatsApp?src=nav')).toBe('/whatsapp?src=nav');
  });
});

describe('LEGACY_EXACT_REDIRECTS lowercase canonicals', () => {
  it('maps contact/whatsapp/faq to lowercase destinations', () => {
    expect(LEGACY_EXACT_REDIRECTS['/contact']).toBe('/contact');
    expect(LEGACY_EXACT_REDIRECTS['/whatsapp']).toBe('/whatsapp');
    expect(LEGACY_EXACT_REDIRECTS['/faq']).toBe('/faq');
  });

  it('keeps blog hub on PascalCase /Blog', () => {
    expect(LEGACY_EXACT_REDIRECTS['/blog']).toBe('/Blog');
  });
});
