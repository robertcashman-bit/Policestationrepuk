import { describe, expect, it } from 'vitest';
import { initialsFromName } from '@/lib/display-name-initials';
import { selectHomepagePreviewReps } from '@/lib/home-directory-preview';
import type { Representative } from '@/lib/types';

function rep(partial: Partial<Representative> & { slug: string; name: string }): Representative {
  return {
    id: partial.slug,
    email: '',
    phone: '',
    county: '',
    stations: [],
    availability: '',
    accreditation: 'Accredited Representative',
    notes: '',
    ...partial,
  };
}

describe('initialsFromName', () => {
  it('builds two-letter initials from full names', () => {
    expect(initialsFromName('Terry Limby')).toBe('TL');
    expect(initialsFromName('Robert Cashman')).toBe('RC');
  });

  it('handles single names', () => {
    expect(initialsFromName('Madonna')).toBe('MA');
  });
});

describe('selectHomepagePreviewReps', () => {
  it('prefers featured reps and never invents listings', () => {
    const featured = [
      rep({ slug: 'robert-cashman', name: 'Robert Cashman', county: 'Kent', featured: true, stations: ['Medway'] }),
    ];
    const all = [
      ...featured,
      rep({ slug: 'a', name: 'Ann', county: 'Essex', stations: ['Chelmsford'] }),
      rep({ slug: 'b', name: 'Bob', county: 'Unknown', stations: [] }),
    ];
    const picked = selectHomepagePreviewReps(all, featured, 2);
    expect(picked.map((r) => r.slug)).toEqual(['robert-cashman', 'a']);
    expect(picked.every((r) => all.some((x) => x.slug === r.slug))).toBe(true);
  });
});
