import { describe, expect, it } from 'vitest';
import { ruleBasedClassify } from '@/lib/custody-discovery/classify';
import {
  contactFieldForClassification,
  publicationStatusForClassification,
} from '@/lib/custody-discovery/storage';

describe('station / enquiry phone classification', () => {
  it('labels enquiry office numbers as public_enquiry', () => {
    const label = ruleBasedClassify({
      phoneNumber: '01732 771055',
      pageSnippet: 'Sevenoaks Police Station public enquiry office telephone 01732 771055',
      sourceTitle: 'Kent Police — Sevenoaks',
      custodySuiteName: 'Sevenoaks Police Station',
      forceName: 'Kent Police',
    });
    expect(label).toBe('public_enquiry');
    expect(contactFieldForClassification(label)).toBe('phone');
    expect(publicationStatusForClassification(label)).toBe('verified_public_enquiry');
  });

  it('labels custody desk numbers as direct_custody for custodyPhone overlay', () => {
    const label = ruleBasedClassify({
      phoneNumber: '01622 690690',
      pageSnippet: 'Maidstone custody suite desk telephone 01622 690690 for detained persons',
      sourceTitle: 'Kent custody information',
      custodySuiteName: 'Maidstone Custody Suite',
      forceName: 'Kent Police',
    });
    expect(label).toBe('direct_custody');
    expect(contactFieldForClassification(label)).toBe('custodyPhone');
  });
});
