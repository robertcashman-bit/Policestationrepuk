import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  shouldAutoRejectWeakEvidence,
  resolveSuiteConflicts,
} from '@/lib/custody-discovery/auto-decision';
import {
  pickConflictWinner,
  scoreConflictCandidate,
  sourceTrustScore,
} from '@/lib/custody-discovery/conflict-resolver';
import type { CustodyAiReview, CustodyNumberFinding } from '@/lib/custody-discovery/types';

function finding(partial: Partial<CustodyNumberFinding> = {}): CustodyNumberFinding {
  return {
    id: 'cnf_1',
    custodySuiteId: 's1',
    forceName: 'Norfolk Constabulary',
    custodySuiteName: 'Bethel Street Custody',
    policeStationName: 'Bethel Street',
    possiblePhoneNumber: '01603 276024',
    normalizedPhoneNumber: '01603276024',
    sourceTitle: 'Custody',
    sourceUrl: 'https://www.norfolk.police.uk/custody',
    sourceDomain: 'norfolk.police.uk',
    sourceType: 'official_police',
    pageSnippet: 'Bethel Street custody suite 01603 276024',
    classification: 'direct_custody',
    confidenceScore: 85,
    confidenceLevel: 'high',
    status: 'needs_review',
    dateFound: '2026-06-13',
    lastChecked: '2026-06-13',
    hashOfSourceEvidence: 'h1',
    notes: '',
    createdAt: '2026-06-13',
    updatedAt: '2026-06-13',
    ...partial,
  };
}

function review(partial: Partial<CustodyAiReview> = {}): CustodyAiReview {
  return {
    recommendation: 'approve',
    aiConfidence: 95,
    whyPublish: 'Official police page lists this as the Bethel Street custody desk direct line.',
    whyNot: '',
    evidence: {
      quote: 'Bethel Street custody suite **01603 276024**',
      section: 'Custody',
      sourceUrl: 'https://www.norfolk.police.uk/custody',
      sourceTitle: 'Custody',
      source: 'page_fetch',
      fetchedAt: '2026-06-13',
    },
    publishVerified: true,
    flags: [],
    model: 'gpt-4o-mini',
    reviewedAt: '2026-06-13',
    ...partial,
  };
}

describe('shouldAutoRejectWeakEvidence', () => {
  it('auto-rejects AI approve with search snippet only', () => {
    expect(
      shouldAutoRejectWeakEvidence(
        finding(),
        review({ evidence: { ...review().evidence, source: 'search_snippet' } }),
      ),
    ).toBe(true);
  });

  it('auto-rejects rep directory hold after retries exhausted', () => {
    expect(
      shouldAutoRejectWeakEvidence(
        finding({
          sourceDomain: 'policestationrepuk.org',
          sourceUrl: 'https://policestationrepuk.org/stations/foo',
        }),
        review({
          recommendation: 'hold',
          evidence: { ...review().evidence, source: 'search_snippet' },
        }),
      ),
    ).toBe(true);
  });

  it('allows hold with snippet while retries remain', () => {
    expect(
      shouldAutoRejectWeakEvidence(
        finding({ aiEvidenceRetries: 1 }),
        review({
          recommendation: 'hold',
          evidence: { ...review().evidence, source: 'search_snippet' },
        }),
      ),
    ).toBe(false);
  });
});

describe('conflict winner selection', () => {
  it('prefers official police source over council', () => {
    const official = finding({ id: 'official' });
    const council = finding({
      id: 'council',
      sourceDomain: 'west-norfolk.gov.uk',
      sourceType: 'local_authority',
      sourceUrl: 'https://www.west-norfolk.gov.uk/custody',
      normalizedPhoneNumber: '01603999888',
      possiblePhoneNumber: '01603 999888',
    });
    const officialScore = scoreConflictCandidate(official, review(), [official, council], 'norfolk.police.uk')!;
    const councilScore = scoreConflictCandidate(
      council,
      review({
        whyPublish: 'Council page lists a custody contact number for Bethel Street suite.',
        evidence: {
          ...review().evidence,
          quote: 'Bethel Street custody **01603 999888**',
          sourceUrl: council.sourceUrl,
        },
      }),
      [official, council],
      'norfolk.police.uk',
    )!;
    expect(officialScore).toBeGreaterThan(councilScore);
    expect(sourceTrustScore(official, 'norfolk.police.uk')).toBe(100);
  });

  it('returns null when two official sources disagree equally', () => {
    const a = finding({ id: 'a', normalizedPhoneNumber: '01603276024' });
    const b = finding({
      id: 'b',
      normalizedPhoneNumber: '01603999888',
      possiblePhoneNumber: '01603 999888',
    });
    const winner = pickConflictWinner([
      { finding: a, review: review(), score: 100 },
      { finding: b, review: review(), score: 99 },
    ]);
    expect(winner).toBeNull();
  });

  it('picks clear winner when scores diverge', () => {
    const winner = pickConflictWinner([
      {
        finding: finding({ id: 'low' }),
        review: review(),
        score: 55,
      },
      {
        finding: finding({ id: 'high', sourceDomain: 'norfolk.police.uk' }),
        review: review(),
        score: 110,
      },
    ]);
    expect(winner?.finding.id).toBe('high');
  });
});

/* ------------------------------------------------------------------ */
/*  resolveSuiteConflicts — bulk PCC switchboard reject                */
/* ------------------------------------------------------------------ */

const rejectedIds = vi.fn();
let suiteFindingsMock: CustodyNumberFinding[] = [];

vi.mock('@/lib/custody-discovery/storage', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/lib/custody-discovery/storage')>();
  return {
    ...mod,
    getApprovedNumber: async () => null,
    getCustodySuite: async (id: string) => ({
      id,
      forceName: 'Essex Police',
      forceDomain: 'essex.police.uk',
      name: 'Chelmsford Custody',
    }),
    getFindingsForSuite: async () => suiteFindingsMock,
    getAllFindings: async () => essexPccCluster(),
    rejectFinding: async (id: string) => {
      rejectedIds(id);
      return null;
    },
    saveFinding: async (f: CustodyNumberFinding) => f,
    approveFinding: async () => null,
    saveApprovedNumber: async () => undefined,
    invalidateApprovedCache: () => undefined,
    appendAuditEntry: async () => undefined,
  };
});

function essexPccFinding(suiteId: string, suiteName: string): CustodyNumberFinding {
  return {
    id: `essex_${suiteId}`,
    custodySuiteId: suiteId,
    forceName: 'Essex Police',
    custodySuiteName: suiteName,
    policeStationName: suiteName,
    possiblePhoneNumber: '01245 291600',
    normalizedPhoneNumber: '01245291600',
    sourceTitle: 'Volunteers',
    sourceUrl: 'https://www.essex.police.uk/police-and-crime-commissioner/volunteers',
    sourceDomain: 'essex.police.uk',
    sourceType: 'pcc',
    pageSnippet: 'Skip to content 01245 291600 pfcc@essex.police.uk Open Menu',
    classification: 'direct_custody',
    confidenceScore: 55,
    confidenceLevel: 'medium',
    status: 'needs_review',
    conflictReason: 'possible_conflict',
    dateFound: '2026-06-13',
    lastChecked: '2026-06-13',
    hashOfSourceEvidence: `h_${suiteId}`,
    notes: '',
    createdAt: '2026-06-13',
    updatedAt: '2026-06-13',
    aiReview: {
      recommendation: 'hold',
      aiConfidence: 55,
      whyPublish: '',
      whyNot: 'PCC page header phone — not a custody desk line.',
      evidence: {
        quote: 'Skip to content **01245 291600** pfcc@essex.police.uk Open Menu',
        section: 'Header',
        sourceUrl: 'https://www.essex.police.uk/police-and-crime-commissioner/volunteers',
        sourceTitle: 'Volunteers',
        source: 'page_fetch',
        fetchedAt: '2026-06-13',
      },
      publishVerified: false,
      flags: [],
      model: 'gpt-4o-mini',
      reviewedAt: '2026-06-13',
    },
  };
}

function essexPccCluster(): CustodyNumberFinding[] {
  return [
    essexPccFinding('essex-chelmsford', 'Chelmsford Custody'),
    essexPccFinding('essex-colchester', 'Colchester Custody'),
    essexPccFinding('essex-basildon', 'Basildon Custody'),
    essexPccFinding('essex-southend', 'Southend Custody'),
  ];
}

beforeEach(() => {
  rejectedIds.mockClear();
  suiteFindingsMock = [];
  process.env.CUSTODY_AI_AUTO_REJECT = 'true';
  process.env.CUSTODY_AI_AUTO_PUBLISH = 'true';
  process.env.CUSTODY_AI_AUTO_RESOLVE_CONFLICTS = 'true';
});

afterEach(() => {
  delete process.env.CUSTODY_AI_AUTO_REJECT;
  delete process.env.CUSTODY_AI_AUTO_PUBLISH;
  delete process.env.CUSTODY_AI_AUTO_RESOLVE_CONFLICTS;
});

describe('resolveSuiteConflicts bulk PCC reject', () => {
  it('bulk-rejects force-wide PCC header cluster when no publishable winner', async () => {
    const chelmsford = essexPccFinding('essex-chelmsford', 'Chelmsford Custody');
    suiteFindingsMock = [chelmsford];

    const result = await resolveSuiteConflicts('essex-chelmsford');
    expect(result.action).toBe('rejected_only');
    expect(result.reason).toBe('auto_reject_force_pcc_switchboard');
    expect(result.rejectedCount).toBe(4);
    expect(rejectedIds).toHaveBeenCalledTimes(4);
  });
});
