import { describe, expect, it } from 'vitest';
import {
  stripContactFieldsForClient,
  stripPrivateFields,
} from '@/lib/data';
import type { Representative } from '@/lib/types';

function sampleRep(overrides: Partial<Representative> = {}): Representative {
  return {
    id: '1',
    slug: 'robert-cashman',
    name: 'Robert Cashman',
    phone: '07535 494446',
    email: 'Robertdavidcashman@gmail.com',
    county: 'Kent',
    address: 'Greenacre London Road West Kingsdown Sevenoaks',
    postcode: 'TN15 6ER',
    stations: ['North Kent Police Station'],
    availability: 'Any',
    accreditation: 'DUTY SOLICITOR',
    notes: 'Experienced duty solicitor',
    whatsappLink: 'https://wa.me/447535494446',
    featured: true,
    ...overrides,
  };
}

describe('stripPrivateFields / stripContactFieldsForClient', () => {
  it('clears home address and postcode from public payloads', () => {
    const out = stripPrivateFields(sampleRep());
    expect(out.address).toBe('');
    expect(out.postcode).toBe('');
    expect(out.dsccPin ?? '').toBe('');
    // Profile pages still receive email/phone via stripPrivateFields alone.
    expect(out.email).toBe('Robertdavidcashman@gmail.com');
    expect(out.phone).toBe('07535 494446');
  });

  it('strips contact PII for client/RSC card props', () => {
    const out = stripContactFieldsForClient(sampleRep());
    expect(out.email).toBe('');
    expect(out.phone).toBe('');
    expect(out.whatsappLink).toBe('');
    expect(out.address).toBe('');
    expect(out.postcode).toBe('');
    expect(out.name).toBe('Robert Cashman');
    expect(out.slug).toBe('robert-cashman');
    expect(out.county).toBe('Kent');
    expect(out.stations).toEqual(['North Kent Police Station']);
  });
});
