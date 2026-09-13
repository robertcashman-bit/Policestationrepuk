import { describe, expect, it } from 'vitest';
import { COMMON_OFFENCES, GENERAL_DEFENCES } from '@/lib/common-offences-guide';

/** Snapshot of offence ids — accidental drops fail CI. */
const EXPECTED_OFFENCE_IDS = [
  'common-assault',
  'assault-emergency-worker',
  'abh',
  'gbh-s20',
  'gbh-s18',
  'threats-to-kill',
  'theft',
  'burglary',
  'robbery',
  'handling-stolen-goods',
  'going-equipped',
  'making-off-without-payment',
  'twoc',
  'aggravated-vehicle-taking',
  'criminal-damage',
  'possession-drugs',
  'pwits',
  'bladed-article',
  'public-order',
  'affray',
  'violent-disorder',
  'fraud',
  'harassment-stalking',
  'harassment-fear-violence',
  'breach-protective-order',
  'excess-alcohol',
  'fail-to-provide',
  'careless-driving',
  'dangerous-driving',
  'fail-to-surrender',
  'obstruct-police',
] as const;

describe('common offences guide', () => {
  it('exports the expected offence id list (no accidental drops)', () => {
    expect(COMMON_OFFENCES.map((o) => o.id)).toEqual([...EXPECTED_OFFENCE_IDS]);
  });

  it('has unique offence ids', () => {
    const ids = COMMON_OFFENCES.map((o) => o.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every sentencingGuidelineUrl is https on sentencingcouncil.org.uk', () => {
    for (const offence of COMMON_OFFENCES) {
      expect(offence.sentencingGuidelineUrl, offence.id).toMatch(
        /^https:\/\/www\.sentencingcouncil\.org\.uk\//
      );
    }
  });

  it('every legislationUrl is https on legislation.gov.uk', () => {
    for (const offence of COMMON_OFFENCES) {
      expect(offence.legislationUrl, offence.id).toMatch(/^https:\/\/www\.legislation\.gov\.uk\//);
    }
  });

  it('every entry fills the OffenceGuideEntry shape with non-empty core fields', () => {
    for (const offence of COMMON_OFFENCES) {
      expect(offence.title.length, offence.id).toBeGreaterThan(3);
      expect(offence.statute.length, offence.id).toBeGreaterThan(5);
      expect(offence.triable.length, offence.id).toBeGreaterThan(3);
      expect(offence.maxPenalty.length, offence.id).toBeGreaterThan(3);
      expect(offence.sentencingNote.length, offence.id).toBeGreaterThan(10);
      expect(offence.actusReus.length, offence.id).toBeGreaterThan(0);
      expect(offence.mensRea.length, offence.id).toBeGreaterThan(0);
      expect(offence.commonDefences.length, offence.id).toBeGreaterThan(0);
      expect(offence.stationNotes.length, offence.id).toBeGreaterThan(10);
      expect(Array.isArray(offence.keyCases), offence.id).toBe(true);
    }
  });

  it('does not point common assault legislation at the Road Traffic Act', () => {
    const assault = COMMON_OFFENCES.find((o) => o.id === 'common-assault');
    expect(assault?.legislationUrl).toBe('https://www.legislation.gov.uk/ukpga/1988/33/section/39');
    expect(assault?.legislationUrl).not.toContain('ukpga/1988/52');
  });

  it('general defences remain available', () => {
    expect(GENERAL_DEFENCES.map((d) => d.id)).toEqual([
      'self-defence',
      'intoxication',
      'duress',
      'insanity-automatism',
      'consent',
    ]);
  });
});
