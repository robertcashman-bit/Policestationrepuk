/**
 * Daily report must not say "no action required / operating normally" when
 * autoheal trigger_outreach_batch accepted=0 under NO_ELIGIBLE_LEADS while
 * digests still showed ready leftovers (live Aug 26–27).
 */
import { describe, expect, it } from 'vitest';
import { repukReadyEligibleContradictionActions } from '@/lib/firm-outreach/reporting/build-daily-report';

describe('repukReadyEligibleContradictionActions', () => {
  it('flags NO_ELIGIBLE_LEADS + accepted=0 + autoheal accepted=0', () => {
    const actions = repukReadyEligibleContradictionActions({
      workspace: 'repuk',
      status: 'NO_ELIGIBLE_LEADS',
      emailsAcceptedByProvider: 0,
      autohealRepairs: [
        'seed_domain_suppress:hpjv.co.uk',
        'trigger_outreach_batch:accepted=0,jobsCreated=0,claimed=0',
      ],
      label: 'POLICESTATIONREPUK.ORG',
    });
    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatch(/disagree/i);
  });

  it('stays quiet when sends actually happened', () => {
    expect(
      repukReadyEligibleContradictionActions({
        workspace: 'repuk',
        status: 'NO_ELIGIBLE_LEADS',
        emailsAcceptedByProvider: 3,
        autohealRepairs: ['trigger_outreach_batch:accepted=0,jobsCreated=0,claimed=0'],
      }),
    ).toEqual([]);
  });

  it('ignores PSA workspace', () => {
    expect(
      repukReadyEligibleContradictionActions({
        workspace: 'psa',
        status: 'NO_ELIGIBLE_LEADS',
        emailsAcceptedByProvider: 0,
        autohealRepairs: ['trigger_outreach_batch:accepted=0,jobsCreated=0,claimed=0'],
      }),
    ).toEqual([]);
  });
});
