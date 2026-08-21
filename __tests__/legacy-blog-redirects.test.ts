import { describe, expect, it } from 'vitest';
import {
  NEW_BLOG_SLUGS_LIST,
  resolveLegacyBlogRedirect,
} from '@/lib/blog/legacy-blog-slugs';

const DUTY_SOLICITOR_COMPARISON =
  '/Blog/freelance-police-station-representative-vs-duty-solicitor';

const LEGACY_DUTY_SOLICITOR_ALIASES = [
  'what-is-a-duty-solicitor',
  'understanding-the-role-of-a-duty-solicitor-everything-you-need-to-know',
  'whats-a-duty-solicitor',
  'what-is-a-duty-solicitor-4',
  'is-legal-advice-free-at-the-police-station',
  'do-i-need-a-solicitor-at-a-police-station-interview',
] as const;

describe('resolveLegacyBlogRedirect', () => {
  it('returns null for every current editorial slug', () => {
    for (const slug of NEW_BLOG_SLUGS_LIST) {
      expect(resolveLegacyBlogRedirect(slug), slug).toBeNull();
    }
  });

  it('does not redirect the duty solicitor police station explainer to the comparison post', () => {
    expect(resolveLegacyBlogRedirect('duty-solicitor-police-station')).toBeNull();
  });

  it('keeps legacy duty-solicitor aliases pointing at the comparison article', () => {
    for (const slug of LEGACY_DUTY_SOLICITOR_ALIASES) {
      expect(resolveLegacyBlogRedirect(slug), slug).toBe(DUTY_SOLICITOR_COMPARISON);
    }
  });

  it('maps known Wix slugs to specific articles', () => {
    expect(resolveLegacyBlogRedirect('police-station-representation')).toBe(
      '/Blog/what-does-a-freelance-police-station-representative-do',
    );
    expect(resolveLegacyBlogRedirect('whats-a-duty-solicitor')).toBe(DUTY_SOLICITOR_COMPARISON);
  });

  it('maps topic slugs via keyword rules', () => {
    expect(resolveLegacyBlogRedirect('some-unknown-voluntary-interview-guide')).toBe(
      '/Blog/police-station-attendance-checklist',
    );
  });

  it('does not let the duty-solicitor topic rule steal duty-solicitor-police-station-style slugs', () => {
    // Defense in depth: even if this slug were absent from NEW_BLOG_SLUGS_LIST,
    // the topic rule must not remap it to the freelance-vs-duty comparison post.
    expect(resolveLegacyBlogRedirect('duty-solicitor-police-station-extra-unknown')).toBe('/Blog');
  });

  it('still fuzzy-maps unknown duty-solicitor variants without a police-station editorial suffix', () => {
    expect(resolveLegacyBlogRedirect('duty-solicitor-scheme-overview-unknown')).toBe(
      DUTY_SOLICITOR_COMPARISON,
    );
  });

  it('redirects unknown legacy slugs to the blog hub instead of 404', () => {
    expect(resolveLegacyBlogRedirect('totally-unknown-wix-post-from-2019')).toBe('/Blog');
  });
});
