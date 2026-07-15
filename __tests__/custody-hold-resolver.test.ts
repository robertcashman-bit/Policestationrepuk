import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  countForceOpenFindingsSameNumber,
  isPccSiteHeaderPage,
  resolveHoldFinding,
} from '@/lib/custody-discovery/hold-resolver';
import type { CustodyAiReview, CustodyNumberFinding } from '@/lib/custody-discovery/types';

function finding(partial: Partial<CustodyNumberFinding> = {}): CustodyNumberFinding {
  return {
    id: 'cnf_main',
    custodySuiteId: 's1',
    forceName: 'Norfolk Constabulary',
    custodySuiteName: 'Bethel Street Custody',
    policeStationName: 'Bethel Street',
    possiblePhoneNumber: '01603 276024',
    normalizedPhoneNumber: '01603276024',
    sourceTitle: 'Custody',
    sourceUrl: 'https://www.west-norfolk.gov.uk/custody',
    sourceDomain: 'west-norfolk.gov.uk',
    sourceType: 'local_authority',
    pageSnippet: 'Bethel Street custody suite 01603 276024',
    classification: 'direct_custody',
    confidenceScore: 65,
    confidenceLevel: 'medium',
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

function sibling(domain: string, partial: Partial<CustodyNumberFinding> = {}): CustodyNumberFinding {
  return finding({
    id: `cnf_${domain}`,
    sourceUrl: `https://www.${domain}/custody`,
    sourceDomain: domain,
    hashOfSourceEvidence: `h_${domain}`,
    ...partial,
  });
}

function holdReview(partial: Partial<CustodyAiReview> = {}): CustodyAiReview {
  return {
    recommendation: 'hold',
    aiConfidence: 55,
    whyPublish: '',
    whyNot: 'Ambiguous whether this is the custody desk line.',
    evidence: {
      quote: 'Bethel Street custody suite **01603 276024**',
      section: 'Custody',
      sourceUrl: 'https://www.west-norfolk.gov.uk/custody',
      sourceTitle: 'Custody',
      source: 'page_fetch',
      fetchedAt: '2026-06-13',
    },
    publishVerified: false,
    flags: [],
    model: 'gpt-4o-mini',
    reviewedAt: '2026-06-13',
    ...partial,
  };
}

describe('resolveHoldFinding', () => {
  it('returns publish_corroborated when two council domains agree', () => {
    const result = resolveHoldFinding(finding(), holdReview(), {
      suiteFindings: [sibling('north-norfolk.gov.uk')],
      forceSameNumberPublishedCount: 0,
    });
    expect(result.outcome).toBe('publish_corroborated');
  });

  it('flags conflict when trusted sources disagree', () => {
    const result = resolveHoldFinding(finding(), holdReview(), {
      suiteFindings: [
        sibling('north-norfolk.gov.uk', {
          possiblePhoneNumber: '01603 999888',
          normalizedPhoneNumber: '01603999888',
        }),
      ],
      forceSameNumberPublishedCount: 0,
    });
    expect(result.outcome).toBe('flag_conflict');
  });

  it('rejects when open findings span 3+ force suites (switchboard pattern)', () => {
    const result = resolveHoldFinding(finding(), holdReview(), {
      suiteFindings: [],
      forceSameNumberPublishedCount: 0,
      forceSameNumberOpenCount: 4,
    });
    expect(result.outcome).toBe('reject_force_switchboard');
  });

  it('rejects rep-directory-only sources', () => {
    const rep = finding({
      sourceType: 'unknown',
      sourceUrl: 'https://www.policestationreps.com/stations/bethel',
      sourceDomain: 'policestationreps.com',
    });
    const result = resolveHoldFinding(rep, holdReview(), {
      suiteFindings: [],
      forceSameNumberPublishedCount: 0,
    });
    expect(result.outcome).toBe('reject_untrusted_only');
  });

  it('returns unresolved for single untrusted source without rep directory pattern', () => {
    const result = resolveHoldFinding(
      finding({ sourceType: 'unknown', sourceDomain: 'random-blog.com' }),
      holdReview(),
      { suiteFindings: [], forceSameNumberPublishedCount: 0 },
    );
    expect(result.outcome).toBe('unresolved');
  });

  it('returns unresolved when existing conflictReason is set without junk signals', () => {
    const result = resolveHoldFinding(
      finding({ conflictReason: 'possible_conflict' }),
      holdReview(),
      { suiteFindings: [], forceSameNumberPublishedCount: 0, forceSameNumberOpenCount: 1 },
    );
    expect(result.outcome).toBe('unresolved');
  });

  it('auto-rejects Essex PFCC switchboard cluster even with conflictReason', () => {
    const essexPcc = finding({
      id: 'essex_chelmsford',
      forceName: 'Essex Police',
      custodySuiteId: 'essex-chelmsford',
      custodySuiteName: 'Chelmsford Custody',
      possiblePhoneNumber: '01245 291600',
      normalizedPhoneNumber: '01245291600',
      sourceType: 'pcc',
      sourceDomain: 'essex.police.uk',
      sourceUrl: 'https://www.essex.police.uk/police-and-crime-commissioner/volunteers',
      pageSnippet: 'Skip to content 01245 291600 pfcc@essex.police.uk Open Menu',
      conflictReason: 'possible_conflict',
    });
    const review = holdReview({
      aiConfidence: 55,
      evidence: {
        quote: 'Skip to content **01245 291600** pfcc@essex.police.uk Open Menu',
        section: 'Header',
        sourceUrl: essexPcc.sourceUrl,
        sourceTitle: 'Volunteers',
        source: 'page_fetch',
        fetchedAt: '2026-06-13',
      },
    });
    const allFindings = [
      essexPcc,
      { ...essexPcc, id: 'essex_colchester', custodySuiteId: 'essex-colchester', custodySuiteName: 'Colchester Custody' },
      { ...essexPcc, id: 'essex_basildon', custodySuiteId: 'essex-basildon', custodySuiteName: 'Basildon Custody' },
      { ...essexPcc, id: 'essex_southend', custodySuiteId: 'essex-southend', custodySuiteName: 'Southend Custody' },
    ];
    const openCount = countForceOpenFindingsSameNumber(
      'Essex Police',
      '01245291600',
      allFindings,
    );
    const result = resolveHoldFinding(essexPcc, review, {
      suiteFindings: [],
      forceSameNumberPublishedCount: 0,
      forceSameNumberOpenCount: openCount,
    });
    expect(openCount).toBe(4);
    expect(result.outcome).toBe('reject_force_switchboard');
  });

  it('rejects PCC site header pages with low AI confidence', () => {
    const pcc = finding({
      sourceType: 'pcc',
      sourceDomain: 'essex.police.uk',
      sourceUrl: 'https://www.essex.police.uk/police-and-crime-commissioner/have-your-say',
      pageSnippet: 'Skip to content 01245 291600 pfcc@essex.police.uk',
      possiblePhoneNumber: '01245 291600',
      normalizedPhoneNumber: '01245291600',
      conflictReason: 'possible_conflict',
    });
    const review = holdReview({
      aiConfidence: 55,
      evidence: {
        quote: 'Skip to content **01245 291600** pfcc@essex.police.uk',
        section: 'Header',
        sourceUrl: pcc.sourceUrl,
        sourceTitle: 'Have your say',
        source: 'page_fetch',
        fetchedAt: '2026-06-13',
      },
    });
    expect(isPccSiteHeaderPage(pcc, review)).toBe(true);
    const result = resolveHoldFinding(pcc, review, {
      suiteFindings: [],
      forceSameNumberPublishedCount: 0,
      forceSameNumberOpenCount: 1,
    });
    expect(result.outcome).toBe('reject_pcc_non_custody');
  });

  it('closes duplicate when number matches published record', () => {
    const result = resolveHoldFinding(finding(), holdReview(), {
      suiteFindings: [],
      approvedNormalized: '01603276024',
      forceSameNumberPublishedCount: 0,
    });
    expect(result.outcome).toBe('close_duplicate');
  });
});

/* ------------------------------------------------------------------ */
/*  applyAutoDecision — broad reject + deterministic generic           */
/* ------------------------------------------------------------------ */

const savedFindings = vi.fn();
const rejectedIds = vi.fn();

vi.mock('@/lib/custody-discovery/storage', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/lib/custody-discovery/storage')>();
  return {
    ...mod,
    getApprovedNumber: async () => null,
    getFindingsForSuite: async () => [],
    getAllFindings: async () => [],
    getCustodySuite: async () => null,
    loadAllApprovedNumbers: async () => new Map(),
    saveFinding: async (f: CustodyNumberFinding) => {
      savedFindings(f);
    },
    rejectFinding: async (id: string) => {
      rejectedIds(id);
      return null;
    },
    approveFinding: async () => null,
    saveApprovedNumber: async () => undefined,
    invalidateApprovedCache: () => undefined,
  };
});

import { applyAutoDecision, shouldAutoRejectAiFinding } from '@/lib/custody-discovery/auto-decision';

beforeEach(() => {
  savedFindings.mockClear();
  rejectedIds.mockClear();
  process.env.CUSTODY_AI_AUTO_REJECT = 'true';
  process.env.CUSTODY_AI_AUTO_PUBLISH = 'true';
});

afterEach(() => {
  delete process.env.CUSTODY_AI_AUTO_REJECT;
  delete process.env.CUSTODY_AI_AUTO_PUBLISH;
});

describe('applyAutoDecision broad reject', () => {
  it('auto-rejects AI reject at >=85% confidence', async () => {
    const result = await applyAutoDecision(
      finding({ sourceDomain: 'policestationreps.com', sourceType: 'unknown' }),
      {
        ...holdReview(),
        recommendation: 'reject',
        aiConfidence: 90,
        whyNot: 'This is a rep directory listing, not an official custody source.',
      },
    );
    expect(result.action).toBe('rejected');
    expect(result.reason).toBe('auto_reject_rep_directory');
  });

  it('queues low-confidence AI reject for human review', async () => {
    const result = await applyAutoDecision(
      finding({ normalizedPhoneNumber: '01622790000' }),
      { ...holdReview(), recommendation: 'reject', aiConfidence: 70 },
    );
    expect(result.action).toBe('queued');
  });

  it('auto-rejects high-confidence AI reject', async () => {
    const result = await applyAutoDecision(
      finding({ normalizedPhoneNumber: '01622790000' }),
      { ...holdReview(), recommendation: 'reject', aiConfidence: 90 },
    );
    expect(result.action).toBe('rejected');
    expect(result.reason).toBe('auto_reject_ai');
  });

  it('auto-rejects conflict findings when AI says reject at high confidence', async () => {
    const result = await applyAutoDecision(
      finding({ conflictReason: 'possible_conflict', normalizedPhoneNumber: '01622790000' }),
      { ...holdReview(), recommendation: 'reject', aiConfidence: 95 },
    );
    expect(result.action).toBe('rejected');
    expect(result.reason).toBe('auto_reject_ai');
    expect(rejectedIds).toHaveBeenCalled();
  });

  it('deterministically rejects 101 regardless of AI recommendation', async () => {
    const result = await applyAutoDecision(
      finding({
        possiblePhoneNumber: '101',
        normalizedPhoneNumber: '101',
        classification: 'general_101',
        sourceType: 'official_police',
      }),
      { ...holdReview(), recommendation: 'approve', aiConfidence: 100 },
    );
    expect(result.action).toBe('rejected');
    expect(result.reason).toBe('deterministic_general_101');
  });

  it('deterministically rejects known switchboard classification', async () => {
    const result = await applyAutoDecision(
      finding({ classification: 'switchboard' }),
      { ...holdReview(), recommendation: 'hold' },
    );
    expect(result.action).toBe('rejected');
    expect(result.reason).toBe('deterministic_switchboard');
  });
});

describe('shouldAutoRejectAiFinding low-confidence tier', () => {
  it('auto-rejects rep directory at any AI reject confidence', () => {
    const gate = shouldAutoRejectAiFinding(
      finding({ sourceDomain: 'policestationreps.com', sourceType: 'unknown' }),
      { ...holdReview(), recommendation: 'reject', aiConfidence: 20 },
    );
    expect(gate.reject).toBe(true);
    if (gate.reject) expect(gate.reason).toBe('auto_reject_rep_directory');
  });

  it('does not auto-reject low-confidence AI reject on official sources', () => {
    const gate = shouldAutoRejectAiFinding(
      finding({
        sourceType: 'official_police',
        sourceDomain: 'kent.police.uk',
        classification: 'unknown',
        normalizedPhoneNumber: '01622790000',
      }),
      { ...holdReview(), recommendation: 'reject', aiConfidence: 75 },
    );
    expect(gate.reject).toBe(false);
  });

  it('does not auto-reject low-confidence AI reject on third-party findings', () => {
    const gate = shouldAutoRejectAiFinding(
      finding({
        sourceType: 'unknown',
        sourceDomain: 'mindwisenv.org',
        classification: 'direct_custody',
        normalizedPhoneNumber: '01622790000',
      }),
      { ...holdReview(), recommendation: 'reject', aiConfidence: 45 },
    );
    expect(gate.reject).toBe(false);
  });

  it('auto-rejects high-confidence AI reject on official sources', () => {
    const gate = shouldAutoRejectAiFinding(
      finding({
        sourceType: 'official_police',
        sourceDomain: 'kent.police.uk',
        classification: 'unknown',
        normalizedPhoneNumber: '01622790000',
      }),
      { ...holdReview(), recommendation: 'reject', aiConfidence: 90 },
    );
    expect(gate.reject).toBe(true);
    if (gate.reject) expect(gate.reason).toBe('auto_reject_ai');
  });

  it('auto-rejects generic 101 even at low AI confidence', () => {
    const gate = shouldAutoRejectAiFinding(
      finding({
        sourceType: 'official_police',
        sourceDomain: 'kent.police.uk',
        classification: 'general_101',
        normalizedPhoneNumber: '101',
      }),
      { ...holdReview(), recommendation: 'reject', aiConfidence: 30 },
    );
    expect(gate.reject).toBe(true);
    if (gate.reject) expect(gate.reason).toBe('auto_reject_generic_number');
  });

  it('auto-rejects when conflict is flagged on rep directory', () => {
    const gate = shouldAutoRejectAiFinding(
      finding({ sourceDomain: 'policestationreps.com', conflictReason: 'possible_conflict' }),
      { ...holdReview(), recommendation: 'reject', aiConfidence: 95 },
    );
    expect(gate.reject).toBe(true);
    if (gate.reject) expect(gate.reason).toBe('auto_reject_rep_directory');
  });
});
