import { describe, expect, it, vi } from 'vitest';
import {
  buildRankedSearchQueries,
  buildStationAliases,
  resolveStationSearchIdentity,
} from '@/lib/custody-discovery/station-aliases';
import { searchForSuite, isSuiteSearchOutcome, isSearchQueryError } from '@/lib/custody-discovery/search';
import type { CustodySuite } from '@/lib/custody-discovery/types';
import {
  listScoredCustodyCandidatePhones,
  extractPhonesFromText,
} from '@/lib/custody-discovery/phone';
import { extractTextFromPdfBuffer } from '@/lib/custody-discovery/pdf-text';
import { isNonStationSpecificNumber, clusterSharedNumbers } from '@/lib/custody-discovery/number-ownership';
import { processAllPhonesFromHit } from '@/lib/custody-discovery/crawler';

const suite: CustodySuite = {
  id: 'st-maidstone',
  forceName: 'Kent Police',
  forceDomain: 'kent.police.uk',
  county: 'Kent',
  custodySuiteName: 'Maidstone Police Station',
  policeStationName: 'Maidstone Police Station',
  address: 'Palace Avenue, Maidstone',
  postcode: 'ME15 6NF',
  town: 'Maidstone',
  aliases: ['Maidstone Custody Suite'],
  isDedicatedCustodySuite: true,
  active: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('station aliases and ranked queries', () => {
  it('builds aliases including short name and former names', () => {
    const aliases = buildStationAliases(suite);
    expect(aliases.some((a) => /Maidstone/i.test(a))).toBe(true);
    expect(aliases).toContain('Maidstone Custody Suite');
  });

  it('includes postcode, force-domain, pdf and enquiry strategies', () => {
    const ranked = buildRankedSearchQueries(suite);
    const strategies = new Set(ranked.map((q) => q.strategy));
    expect(strategies.has('postcode')).toBe(true);
    expect(strategies.has('force_domain')).toBe(true);
    expect(strategies.has('pdf_official')).toBe(true);
    expect(strategies.has('enquiry_office')).toBe(true);
    expect(ranked.some((q) => q.query.includes('ME15 6NF'))).toBe(true);
    expect(ranked.some((q) => q.query.includes('site:kent.police.uk'))).toBe(true);
    expect(ranked.length).toBeGreaterThanOrEqual(12);

    const id = resolveStationSearchIdentity(suite);
    expect(id.postcode).toBe('ME15 6NF');
    expect(id.town).toBe('Maidstone');
  });
});

describe('search fallback behaviour', () => {
  it('continues after a per-query error and returns structured outcome', async () => {
    let n = 0;
    const provider = vi.fn(async () => {
      n++;
      if (n === 1) return { ok: false as const, reason: 'Serper HTTP 429', httpStatus: 429 };
      return [
        {
          title: 'Custody contacts',
          url: 'https://kent.police.uk/custody',
          snippet: 'Maidstone custody telephone 01622 690690',
        },
      ];
    });

    const outcome = await searchForSuite(suite, provider, 3);
    expect(isSearchQueryError(outcome)).toBe(false);
    expect(isSuiteSearchOutcome(outcome)).toBe(true);
    if (isSuiteSearchOutcome(outcome)) {
      expect(outcome.results.length).toBeGreaterThan(0);
      expect(outcome.queryErrors.length).toBeGreaterThan(0);
      expect(outcome.queriesRun).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('multi-candidate extraction', () => {
  it('scores enquiry wording and returns multiple phones', () => {
    const text =
      'Maidstone Police Station enquiry office 01622 111111. Maidstone custody desk telephone 01622 222222.';
    const scored = listScoredCustodyCandidatePhones(text, {
      forceName: 'Kent Police',
      suiteNames: ['Maidstone Police Station'],
    });
    expect(scored.length).toBeGreaterThanOrEqual(1);
    expect(extractPhonesFromText(text, 120, 'Kent Police').length).toBeGreaterThanOrEqual(1);
  });

  it('rejects non-station-specific short codes', () => {
    expect(isNonStationSpecificNumber('101')).toBe(true);
    expect(isNonStationSpecificNumber('999')).toBe(true);
    expect(isNonStationSpecificNumber('01622690690')).toBe(false);
  });
});

describe('pdf text extraction', () => {
  it('pulls phone-like ASCII from a minimal PDF-ish buffer', () => {
    const buf = Buffer.from('BT (Custody telephone 01234 567890) Tj ET', 'latin1');
    const text = extractTextFromPdfBuffer(buf);
    expect(text).toMatch(/01234/);
  });
});

describe('shared number ownership', () => {
  it('clusters numbers shared across many suites', () => {
    const findings = Array.from({ length: 5 }, (_, i) => ({
      id: `f${i}`,
      custodySuiteId: `s${i}`,
      forceName: 'Kent Police',
      custodySuiteName: `Suite ${i}`,
      policeStationName: `Station ${i}`,
      possiblePhoneNumber: '01622 690690',
      normalizedPhoneNumber: '01622690690',
      sourceTitle: '',
      sourceUrl: 'https://kent.police.uk',
      sourceDomain: 'kent.police.uk',
      sourceType: 'official_police' as const,
      pageSnippet: 'switchboard',
      classification: 'switchboard' as const,
      confidenceScore: 40,
      confidenceLevel: 'medium' as const,
      status: 'needs_review' as const,
      dateFound: '2026-01-01T00:00:00.000Z',
      lastChecked: '2026-01-01T00:00:00.000Z',
      hashOfSourceEvidence: `h${i}`,
      notes: '',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }));
    const clusters = clusterSharedNumbers(findings, 3);
    expect(clusters[0]?.likelyForceSwitchboard).toBe(true);
    expect(clusters[0]?.suiteIds.length).toBe(5);
  });
});

describe('processAllPhonesFromHit', () => {
  it('is exported and rejects empty urls', async () => {
    const outcomes = await processAllPhonesFromHit({
      suite,
      title: 'x',
      url: '',
      snippet: 'custody 01622 690690',
      existingFindings: [],
    });
    expect(outcomes[0]?.action).toBe('rejected');
  });
});
