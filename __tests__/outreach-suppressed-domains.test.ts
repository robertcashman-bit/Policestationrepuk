import { describe, expect, it } from 'vitest';
import { orderCampaignsByFewestSendsToday } from '@/lib/firm-outreach/outreach/send-gates';
import {
  isSeedSuppressedDomain,
  registrableEmailDomain,
} from '@/lib/firm-outreach/suppressed-domains';
import { cronOutcomeCountsAsSuccess } from '@/lib/automation/cron-success';

describe('seed domain suppression', () => {
  it('blocks every hpjv.co.uk address after their domain-wide opt-out', () => {
    expect(isSeedSuppressedDomain('enquiries@hpjv.co.uk')).toBe(true);
    expect(isSeedSuppressedDomain('ben.waters@hpjv.co.uk')).toBe(true);
    expect(isSeedSuppressedDomain('HPJV.CO.UK')).toBe(true);
    expect(isSeedSuppressedDomain('info@otherfirm.co.uk')).toBe(false);
  });

  it('normalises domains from emails', () => {
    expect(registrableEmailDomain('Enquiries@HPJV.co.uk')).toBe('hpjv.co.uk');
  });
});

describe('cronOutcomeCountsAsSuccess', () => {
  it('treats partial runs as in-window success', () => {
    expect(cronOutcomeCountsAsSuccess('success')).toBe(true);
    expect(cronOutcomeCountsAsSuccess('skipped')).toBe(true);
    expect(cronOutcomeCountsAsSuccess('partial')).toBe(true);
    expect(cronOutcomeCountsAsSuccess('failed')).toBe(false);
  });
});

describe('orderCampaignsByFewestSendsToday', () => {
  it('runs the starved campaign first', async () => {
    const order = await orderCampaignsByFewestSendsToday(
      ['agent_cover_kent_v1', 'whatsapp_invite_v1'],
      async (id) => (id === 'whatsapp_invite_v1' ? 0 : 217),
    );
    expect(order[0]).toBe('whatsapp_invite_v1');
  });
});
