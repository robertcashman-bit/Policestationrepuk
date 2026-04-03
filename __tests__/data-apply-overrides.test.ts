import { describe, it, expect } from 'vitest';
import { applyOverrides } from '@/lib/data';
import type { Representative } from '@/lib/types';

const baseRep: Representative = {
  id: '1',
  slug: 'jane-doe',
  name: 'Jane Doe',
  phone: '07700900000',
  email: 'jane@example.com',
  county: 'London',
  postcode: 'SW1A 1AA',
  stations: ['Station A'],
  stationsCovered: ['Station A', 'Station B'],
  availability: '24/7',
  accreditation: 'Law Society',
  notes: 'Experienced rep',
  websiteUrl: 'https://jane.example.com',
  whatsappLink: 'https://wa.me/447700900000',
  dsccPin: 'PIN123',
  holidayAvailability: ['Christmas', 'Easter'],
  languages: ['English', 'Welsh'],
  specialisms: ['Fraud', 'Drug offences'],
  yearsExperience: 10,
};

describe('applyOverrides — nullish coalescing (Bug 4)', () => {
  it('replaces fields when override is a non-empty string', () => {
    const result = applyOverrides(baseRep, { name: 'Updated Name', phone: '07700900001' });
    expect(result.name).toBe('Updated Name');
    expect(result.phone).toBe('07700900001');
  });

  it('preserves empty string overrides (does NOT fall back to original)', () => {
    const result = applyOverrides(baseRep, {
      name: '',
      phone: '',
      website_url: '',
      notes: '',
      dscc_pin: '',
      postcode: '',
    });
    expect(result.name).toBe('');
    expect(result.phone).toBe('');
    expect(result.websiteUrl).toBe('');
    expect(result.notes).toBe('');
    expect(result.dsccPin).toBe('');
    expect(result.postcode).toBe('');
  });

  it('falls back to original when override is null', () => {
    const result = applyOverrides(baseRep, {
      name: null,
      phone: null,
      website_url: null,
    });
    expect(result.name).toBe('Jane Doe');
    expect(result.phone).toBe('07700900000');
    expect(result.websiteUrl).toBe('https://jane.example.com');
  });

  it('falls back to original when override key is missing', () => {
    const result = applyOverrides(baseRep, {});
    expect(result.name).toBe('Jane Doe');
    expect(result.phone).toBe('07700900000');
    expect(result.availability).toBe('24/7');
    expect(result.stationsCovered).toEqual(['Station A', 'Station B']);
  });

  it('replaces array fields with empty array (does NOT fall back)', () => {
    const result = applyOverrides(baseRep, {
      stations_covered: [],
      languages: [],
      specialisms: [],
      holiday_availability: [],
    });
    expect(result.stationsCovered).toEqual([]);
    expect(result.languages).toEqual([]);
    expect(result.specialisms).toEqual([]);
    expect(result.holidayAvailability).toEqual([]);
  });

  it('falls back to original array when override is null', () => {
    const result = applyOverrides(baseRep, {
      stations_covered: null,
      languages: null,
      specialisms: null,
      holiday_availability: null,
    });
    expect(result.stationsCovered).toEqual(['Station A', 'Station B']);
    expect(result.languages).toEqual(['English', 'Welsh']);
    expect(result.specialisms).toEqual(['Fraud', 'Drug offences']);
    expect(result.holidayAvailability).toEqual(['Christmas', 'Easter']);
  });

  it('handles yearsExperience with ?? (number 0 is preserved)', () => {
    const result = applyOverrides(baseRep, { years_experience: 0 });
    expect(result.yearsExperience).toBe(0);
  });

  it('falls back yearsExperience when null', () => {
    const result = applyOverrides(baseRep, { years_experience: null });
    expect(result.yearsExperience).toBe(10);
  });

  it('does not mutate the original rep object', () => {
    const original = { ...baseRep };
    applyOverrides(baseRep, { name: 'Changed' });
    expect(baseRep.name).toBe(original.name);
  });
});
