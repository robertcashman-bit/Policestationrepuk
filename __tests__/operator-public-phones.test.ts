import { describe, expect, it } from 'vitest';
import {
  isOperatorLandline,
  isOperatorMobile,
  publicDirectoryPhone,
  stationPageRepCallPhone,
} from '@/lib/operator-public-phones';
import { directoryServiceLocalBusinessSchema, legalServiceSchema, personSchema } from '@/lib/seo-layer/schemas';

describe('operator-public-phones', () => {
  it('detects landline formats Google/Edge may scrape', () => {
    expect(isOperatorLandline('01732 247427')).toBe(true);
    expect(isOperatorLandline('(01732) 247427')).toBe(true);
    expect(isOperatorLandline('01732247427')).toBe(true);
    expect(isOperatorLandline('+44 1732 247427')).toBe(true);
    expect(isOperatorLandline('tel:01732247427')).toBe(true);
    expect(isOperatorLandline('07535 494446')).toBe(false);
  });

  it('strips landline from public directory phone', () => {
    expect(publicDirectoryPhone('01732 247427')).toBe('');
    expect(publicDirectoryPhone('07535 494446')).toBe('07535 494446');
    expect(publicDirectoryPhone('(01732) 847839')).toBe('(01732) 847839');
  });

  it('omits operator mobile from station-page Call', () => {
    expect(isOperatorMobile('07535 494446')).toBe(true);
    expect(stationPageRepCallPhone('07535 494446')).toBe('');
    expect(stationPageRepCallPhone('01732 247427')).toBe('');
    expect(stationPageRepCallPhone('01634 792277')).toBe('01634 792277');
  });
});

describe('JSON-LD — no operator landline', () => {
  it('directory LocalBusiness schema has no telephone', () => {
    const schema = directoryServiceLocalBusinessSchema() as Record<string, unknown>;
    expect(schema.telephone).toBeUndefined();
    expect(JSON.stringify(schema)).not.toMatch(/247427|01732/);
  });

  it('legalService and person schemas omit landline telephone', () => {
    const legal = legalServiceSchema({
      name: 'Robert Cashman',
      slug: 'robert-cashman',
      counties: ['Kent'],
      accreditation: 'DUTY SOLICITOR',
      phone: '01732 247427',
    }) as Record<string, unknown>;
    const person = personSchema({
      name: 'Robert Cashman',
      slug: 'robert-cashman',
      phone: '01732 247427',
      accreditation: 'DUTY SOLICITOR',
      counties: ['Kent'],
    }) as Record<string, unknown>;
    expect(legal.telephone).toBeUndefined();
    expect(person.telephone).toBeUndefined();
  });

  it('legalService keeps other reps’ phones', () => {
    const legal = legalServiceSchema({
      name: 'Example Rep',
      slug: 'example-rep',
      counties: ['Kent'],
      accreditation: 'Accredited Representative',
      phone: '01634 111222',
    }) as Record<string, unknown>;
    expect(legal.telephone).toBe('01634 111222');
  });
});
