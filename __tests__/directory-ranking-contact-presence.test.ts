import { describe, expect, it } from 'vitest';
import { stripContactFieldsForClient } from '@/lib/data';
import {
  isFullProfileListing,
  profileCompleteness,
} from '@/lib/directory-ranking';
import type { Representative } from '@/lib/types';

function richRep(): Representative {
  return {
    id: '1',
    slug: 'full-profile-rep',
    name: 'Full Profile Rep',
    phone: '07535 494446',
    email: 'rep@example.com',
    county: 'Kent',
    stations: ['A', 'B', 'C'],
    availability: 'Any',
    accreditation: 'DUTY SOLICITOR',
    notes: 'Experienced duty solicitor covering Kent stations',
    whatsappLink: 'https://wa.me/447535494446',
    websiteUrl: 'https://example.com',
    yearsExperience: 12,
    specialisms: ['PACE'],
  };
}

describe('profileCompleteness with stripped contact fields', () => {
  it('still reaches the full-profile threshold after client strip', () => {
    const raw = richRep();
    expect(isFullProfileListing(raw)).toBe(true);

    const stripped = stripContactFieldsForClient(raw);
    expect(stripped.phone).toBe('');
    expect(stripped.email).toBe('');
    expect(stripped.whatsappLink).toBe('');
    expect(profileCompleteness(stripped)).toBe(profileCompleteness(raw));
    expect(isFullProfileListing(stripped)).toBe(true);
  });
});
