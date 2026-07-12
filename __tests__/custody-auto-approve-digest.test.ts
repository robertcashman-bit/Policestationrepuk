import { describe, expect, it } from 'vitest';
import {
  buildAutoApproveDigestSummary,
  inferAutoApproveReason,
} from '@/lib/custody-discovery/auto-approve-digest';
import type { CustodyNumberFinding } from '@/lib/custody-discovery/types';

function finding(overrides: Partial<CustodyNumberFinding> = {}): CustodyNumberFinding {
  const now = '2026-07-09T12:00:00.000Z';
  return {
    id: 'f1',
    custodySuiteId: 'suite-1',
    forceName: 'Kent Police',
    custodySuiteName: 'Medway Custody',
    policeStationName: 'Medway',
    possiblePhoneNumber: '01634 123 456',
    normalizedPhoneNumber: '01634123456',
    sourceTitle: 'Contact',
    sourceUrl: 'https://www.kent.police.uk/contact',
    sourceDomain: 'kent.police.uk',
    sourceType: 'official_police',
    pageSnippet: 'Custody desk 01634 123 456',
    classification: 'direct_custody',
    confidenceScore: 90,
    confidenceLevel: 'high',
    status: 'approved',
    dateFound: now,
    lastChecked: now,
    hashOfSourceEvidence: 'abc',
    notes: '[Auto-published via official source]',
    autoPublishedAt: now,
    createdAt: now,
    updatedAt: now,
    aiReview: {
      recommendation: 'approve',
      aiConfidence: 95,
      whyPublish: 'Official Kent Police contact page lists this as the custody suite direct line.',
      evidence: {
        quote: 'Custody suite **01634 123 456**',
        section: 'Contact',
        sourceUrl: 'https://www.kent.police.uk/contact',
        sourceTitle: 'Contact',
        source: 'page_fetch',
        fetchedAt: now,
      },
      publishVerified: true,
      flags: [],
      model: 'gpt-4o-mini',
      reviewedAt: now,
    },
    ...overrides,
  };
}

describe('custody auto-approve digest', () => {
  it('infers official source reason from notes', () => {
    const result = inferAutoApproveReason(finding());
    expect(result.reason).toBe('official_source');
    expect(result.reasonLabel).toContain('Official');
  });

  it('summarises auto-published findings in the last 24h', () => {
    const now = new Date('2026-07-09T20:00:00.000Z');
    const summary = buildAutoApproveDigestSummary(
      [
        finding(),
        finding({
          id: 'f2',
          autoPublishedAt: '2026-07-07T10:00:00.000Z',
        }),
        finding({
          id: 'f3',
          status: 'rejected',
          autoRejectedAt: '2026-07-09T11:00:00.000Z',
          autoPublishedAt: undefined,
        }),
      ],
      now,
    );

    expect(summary.published).toHaveLength(1);
    expect(summary.autoRejectedLast24h).toBe(1);
    expect(summary.published[0]?.finding.id).toBe('f1');
  });

  it('excludes auto-rejected Essex PCC junk from needsManualReview', () => {
    const now = new Date('2026-07-09T20:00:00.000Z');
    const rejectedAt = '2026-07-09T18:00:00.000Z';
    const essexJunk = (suiteId: string, suiteName: string): CustodyNumberFinding =>
      finding({
        id: suiteId,
        custodySuiteId: suiteId,
        forceName: 'Essex Police',
        custodySuiteName: suiteName,
        possiblePhoneNumber: '01245 291600',
        normalizedPhoneNumber: '01245291600',
        sourceType: 'pcc',
        sourceDomain: 'essex.police.uk',
        sourceUrl: 'https://www.essex.police.uk/police-and-crime-commissioner/volunteers',
        pageSnippet: 'Skip to content 01245 291600 pfcc@essex.police.uk',
        status: 'rejected',
        autoRejectedAt: rejectedAt,
        autoPublishedAt: undefined,
        conflictReason: 'possible_conflict',
        aiReview: {
          recommendation: 'hold',
          aiConfidence: 55,
          whyPublish: '',
          whyNot: 'PCC header phone',
          evidence: {
            quote: 'Skip to content **01245 291600** pfcc@essex.police.uk',
            section: 'Header',
            sourceUrl: 'https://www.essex.police.uk/police-and-crime-commissioner/volunteers',
            sourceTitle: 'Volunteers',
            source: 'page_fetch',
            fetchedAt: rejectedAt,
          },
          publishVerified: false,
          flags: [],
          model: 'gpt-4o-mini',
          reviewedAt: rejectedAt,
        },
        notes: '[Auto 2026-07-09] reject_force_switchboard',
      });

    const beforeReject = buildAutoApproveDigestSummary(
      [
        essexJunk('essex-chelmsford', 'Chelmsford Custody'),
        essexJunk('essex-colchester', 'Colchester Custody'),
      ].map((f) => ({ ...f, status: 'needs_review' as const, autoRejectedAt: undefined })),
      now,
    );
    expect(beforeReject.needsManualReview).toBe(2);

    const afterReject = buildAutoApproveDigestSummary(
      [
        essexJunk('essex-chelmsford', 'Chelmsford Custody'),
        essexJunk('essex-colchester', 'Colchester Custody'),
        essexJunk('essex-basildon', 'Basildon Custody'),
        essexJunk('essex-southend', 'Southend Custody'),
      ],
      now,
    );
    expect(afterReject.needsManualReview).toBe(0);
    expect(afterReject.autoRejectedLast24h).toBe(4);
  });
});
