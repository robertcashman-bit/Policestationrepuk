import { describe, expect, it } from 'vitest';
import {
  classifyStationPhoneContext,
  extractStationPhonesFromText,
} from '@/lib/station-research/extract';
import { computeConfidence } from '@/lib/station-research/confidence';
import { decideStationContactUpdate } from '@/lib/station-research/decision';
import { scoreStationResearchPriority, nextResearchAt } from '@/lib/station-research/priority';
import { isAllowedResearchUrl } from '@/lib/station-research/safe-fetch';
import { getForceSourceRegistry, sourceTierForUrl } from '@/lib/station-research/force-source-registry';
import { buildStationResearchQueries } from '@/lib/station-research/queries';
import { runStationContactResearch } from '@/lib/station-research/pipeline';
import {
  stationResearchDryRun,
  stationResearchEnabled,
} from '@/lib/station-research/flags';
import type { PoliceStation } from '@/lib/types';

const stub = (overrides: Partial<PoliceStation> = {}): PoliceStation =>
  ({
    id: 'S1',
    slug: 'maidstone-police-station',
    name: 'Maidstone Police Station',
    address: '1 High Street',
    postcode: 'ME15 6YW',
    forceName: 'Kent Police',
    ...overrides,
  }) as PoliceStation;

describe('station-research extract', () => {
  it('extracts a station phone with positive context', () => {
    const text =
      'Maidstone Police Station front counter telephone 01622 690690 for public enquiries.';
    const phones = extractStationPhonesFromText(text);
    expect(phones.length).toBeGreaterThan(0);
    expect(phones[0].normalized).toBe('01622690690');
    expect(['station_public', 'front_counter', 'force_switchboard', 'from_abroad']).toContain(
      phones[0].contactType,
    );
  });

  it('rejects solicitor context', () => {
    expect(classifyStationPhoneContext('contact our solicitor on 01622 111111').contactType).toBe(
      'do_not_publish',
    );
  });

  it('never treats site-own numbers as police contacts', () => {
    expect(
      classifyStationPhoneContext('call policestationrepuk.org on 01622 222222').contactType,
    ).toBe('do_not_publish');
  });
});

describe('station-research confidence and decision', () => {
  it('rejects candidates whose number is absent from evidence', () => {
    const decided = decideStationContactUpdate({
      station: stub({ phone: undefined }),
      field: 'phone',
      rawValue: '01622 123456',
      normalizedValue: '01622123456',
      displayValue: '01622 123456',
      contactType: 'station_public',
      contextScore: 60,
      evidence: [
        {
          sourceUrl: 'https://www.kent.police.uk/contact/',
          sourceTier: 1,
          excerpt: 'Please call 101 for non-emergency matters',
          retrievalDate: new Date().toISOString(),
        },
      ],
      stationNameMatched: true,
      postcodeMatched: false,
      forceMatched: true,
      dryRun: true,
    });
    expect(decided.decision).toBe('reject');
    expect(decided.decisionReasons).toContain('number_absent_from_evidence_excerpt');
  });

  it('queues admin review when evidence supports the number in dry-run', () => {
    const decided = decideStationContactUpdate({
      station: stub({ phone: undefined }),
      field: 'phone',
      rawValue: '01622 123456',
      normalizedValue: '01622123456',
      displayValue: '01622 123456',
      contactType: 'station_public',
      contextScore: 70,
      evidence: [
        {
          sourceUrl: 'https://www.kent.police.uk/contact/',
          sourceTier: 1,
          excerpt: 'Maidstone Police Station telephone 01622 123456',
          retrievalDate: new Date().toISOString(),
        },
      ],
      stationNameMatched: true,
      postcodeMatched: true,
      forceMatched: true,
      dryRun: true,
    });
    expect(['queue_admin', 'publish']).toContain(decided.decision);
    expect(decided.confidenceScore).toBeGreaterThan(50);
  });

  it('honours manual locks', () => {
    const decided = decideStationContactUpdate({
      station: stub({
        phone: '01622 999999',
        verificationMeta: {
          fields: { phone: { status: 'verified', manualLock: true } },
        },
      }),
      field: 'phone',
      rawValue: '01622 123456',
      normalizedValue: '01622123456',
      displayValue: '01622 123456',
      contactType: 'station_public',
      contextScore: 80,
      evidence: [
        {
          sourceUrl: 'https://www.kent.police.uk/contact/',
          sourceTier: 1,
          excerpt: 'telephone 01622 123456',
          retrievalDate: new Date().toISOString(),
        },
      ],
      stationNameMatched: true,
      postcodeMatched: false,
      forceMatched: true,
      dryRun: false,
    });
    expect(decided.decision).toBe('leave_unchanged');
    expect(decided.confidenceStatus).toBe('MANUALLY_LOCKED');
  });

  it('scores tier-1 evidence higher', () => {
    const high = computeConfidence({
      sourceTier: [1],
      contactType: 'station_public',
      contextScore: 60,
      stationNameMatched: true,
      postcodeMatched: true,
      forceMatched: true,
      numberValid: true,
      conflictingExisting: false,
      manuallyLocked: false,
      excerptContainsNumber: true,
    });
    const low = computeConfidence({
      sourceTier: [4],
      contactType: 'unknown',
      contextScore: 5,
      stationNameMatched: false,
      postcodeMatched: false,
      forceMatched: false,
      numberValid: true,
      conflictingExisting: false,
      manuallyLocked: false,
      excerptContainsNumber: true,
    });
    expect(high.score).toBeGreaterThan(low.score);
  });
});

describe('station-research priority and safety', () => {
  it('prioritises missing phones', () => {
    const missing = scoreStationResearchPriority(stub({ phone: undefined }));
    const present = scoreStationResearchPriority(
      stub({
        phone: '01622 123456',
        verificationMeta: {
          fields: {
            phone: { status: 'verified', sourceUrl: 'https://www.kent.police.uk/contact/' },
          },
        },
      }),
    );
    expect(missing.score).toBeGreaterThan(present.score);
  });

  it('blocks private and non-allowlisted hosts', () => {
    expect(isAllowedResearchUrl('http://127.0.0.1/secret').ok).toBe(false);
    expect(isAllowedResearchUrl('https://example.com/police').ok).toBe(false);
    expect(isAllowedResearchUrl('https://www.kent.police.uk/contact/').ok).toBe(true);
  });

  it('classifies police.uk as tier 1', () => {
    expect(sourceTierForUrl('https://www.kent.police.uk/contact/')).toBe(1);
    expect(sourceTierForUrl('https://data.police.uk/api/forces')).toBe(1);
  });

  it('builds adaptive queries including site: force domain', () => {
    const q = buildStationResearchQueries(stub());
    expect(q.some((x) => x.includes('site:kent.police.uk'))).toBe(true);
  });

  it('schedules sooner rechecks for missing numbers', () => {
    const missing = nextResearchAt({
      confidenceScore: 0,
      published: false,
      conflicted: false,
      missing: true,
    });
    const stable = nextResearchAt({
      confidenceScore: 90,
      published: true,
      conflicted: false,
      missing: false,
    });
    expect(Date.parse(missing.nextResearchAt)).toBeLessThan(Date.parse(stable.nextResearchAt));
  });
});

describe('force source registry', () => {
  it('includes Kent and Gwent', () => {
    const names = getForceSourceRegistry().map((e) => e.forceName);
    expect(names).toContain('Kent Police');
    expect(names).toContain('Gwent Police');
  });
});

describe('station-research flags and pipeline dry-run', () => {
  it('defaults to dry-run and disabled', () => {
    expect(stationResearchDryRun()).toBe(true);
    // Enabled only when env set — unset in unit tests
    expect(stationResearchEnabled()).toBe(false);
  });

  it('pipeline no-ops when disabled unless force=true', async () => {
    const report = await runStationContactResearch({
      stations: [stub()],
      limit: 1,
      dryRun: true,
      force: false,
      provider: async () => [],
    });
    expect(report.enabled).toBe(false);
    expect(report.stationsResearched).toBe(0);
  });

  it('force dry-run still researches without publishing', async () => {
    const report = await runStationContactResearch({
      stations: [
        stub({ phone: undefined }),
        stub({ id: 'S2', slug: 'other', name: 'Other Station', phone: '01622 111111' }),
      ],
      limit: 1,
      dryRun: true,
      force: true,
      provider: async () => [],
      fetchText: async (url) => ({
        ok: true as const,
        text: 'Maidstone Police Station public telephone 01622 555555 for enquiries at the front counter.',
        finalUrl: url,
        contentType: 'text/html',
      }),
    });
    expect(report.enabled).toBe(true);
    expect(report.dryRun).toBe(true);
    expect(report.published).toBe(0);
    expect(report.stationsResearched).toBeGreaterThan(0);
    expect(report.candidatesFound).toBeGreaterThan(0);
  });
});
