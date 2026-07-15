import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AGENT_COVER_KENT_CAMPAIGN_ID } from '@/lib/firm-outreach/campaign-scope';
import {
  clearVerifiedDomainsCache,
  DEFAULT_PSA_FROM_FALLBACK,
  DEFAULT_PSA_FROM_PREFERRED,
  getOutreachSendHealth,
  isDomainNotVerifiedError,
  parseFromAddressDomain,
  resolveFromAddressForCampaign,
  VERIFIED_FALLBACK_DOMAIN,
} from '@/lib/firm-outreach/outreach/from-address';
import { FIRM_OUTREACH_CAMPAIGN_ID } from '@/lib/firm-outreach/site-config';

describe('from-address resolution', () => {
  const ENV = process.env;

  beforeEach(() => {
    clearVerifiedDomainsCache();
    process.env = { ...ENV };
    delete process.env.FIRM_OUTREACH_PSA_FROM_EMAIL;
    delete process.env.FIRM_OUTREACH_FROM_EMAIL;
  });

  afterEach(() => {
    process.env = { ...ENV };
    clearVerifiedDomainsCache();
  });

  it('parses domain from formatted from-address', () => {
    expect(parseFromAddressDomain('Police Station Agent <noreply@policestationagent.com>')).toBe(
      'policestationagent.com',
    );
  });

  it('detects Resend domain-not-verified errors', () => {
    expect(
      isDomainNotVerifiedError('The policestationagent.com domain is not verified.'),
    ).toBe(true);
    expect(isDomainNotVerifiedError('rate limit exceeded')).toBe(false);
  });

  it('uses intentional RepUK preferred From for PSA when RepUK is verified', () => {
    const verified = new Set([VERIFIED_FALLBACK_DOMAIN]);
    const resolved = resolveFromAddressForCampaign(AGENT_COVER_KENT_CAMPAIGN_ID, verified);
    expect(resolved.usedFallback).toBe(false);
    expect(resolved.from).toBe(DEFAULT_PSA_FROM_PREFERRED);
    expect(resolved.from).toBe(DEFAULT_PSA_FROM_FALLBACK);
    expect(resolved.domain).toBe(VERIFIED_FALLBACK_DOMAIN);
  });

  it('falls back when FIRM_OUTREACH_PSA_FROM_EMAIL points at an unverified domain', () => {
    process.env.FIRM_OUTREACH_PSA_FROM_EMAIL =
      'Police Station Agent <noreply@policestationagent.com>';
    const verified = new Set([VERIFIED_FALLBACK_DOMAIN]);
    const resolved = resolveFromAddressForCampaign(AGENT_COVER_KENT_CAMPAIGN_ID, verified);
    expect(resolved.usedFallback).toBe(true);
    expect(resolved.from).toBe(DEFAULT_PSA_FROM_FALLBACK);
    expect(resolved.domain).toBe(VERIFIED_FALLBACK_DOMAIN);
    expect(resolved.preferredFrom).toContain('policestationagent.com');
  });

  it('uses custom FIRM_OUTREACH_PSA_FROM_EMAIL when that domain is verified', () => {
    process.env.FIRM_OUTREACH_PSA_FROM_EMAIL = 'PSA Custom <custom@policestationagent.com>';
    const verified = new Set(['policestationagent.com']);
    const resolved = resolveFromAddressForCampaign(AGENT_COVER_KENT_CAMPAIGN_ID, verified);
    expect(resolved.from).toBe('PSA Custom <custom@policestationagent.com>');
    expect(resolved.usedFallback).toBe(false);
  });

  it('keeps RepUK on verified policestationrepuk.org', () => {
    const verified = new Set([VERIFIED_FALLBACK_DOMAIN]);
    const resolved = resolveFromAddressForCampaign(FIRM_OUTREACH_CAMPAIGN_ID, verified);
    expect(resolved.usedFallback).toBe(false);
    expect(resolved.domain).toBe(VERIFIED_FALLBACK_DOMAIN);
  });

  it('does not health-block when PSA preferred is already the verified RepUK domain', async () => {
    process.env.RESEND_API_KEY = 're_test';
    clearVerifiedDomainsCache();
    const { fetchResendVerifiedDomains } = await import('@/lib/firm-outreach/outreach/from-address');
    await fetchResendVerifiedDomains(async () => ({
      data: [{ name: 'policestationrepuk.org', status: 'verified' }],
    }));
    const health = await getOutreachSendHealth();
    const psa = health.campaigns.find((c) => c.campaignId === AGENT_COVER_KENT_CAMPAIGN_ID);
    expect(psa?.domain).toBe(VERIFIED_FALLBACK_DOMAIN);
    expect(psa?.usedFallbackDefault).toBe(false);
    expect(psa?.canSend).toBe(true);
    expect(psa?.blockers.some((b) => b.startsWith('psa_using_repuk_from_until_'))).toBe(false);
  });

  it('health-blocks with psa_using_repuk hint only when preferred is a different unverified domain', async () => {
    process.env.RESEND_API_KEY = 're_test';
    process.env.FIRM_OUTREACH_PSA_FROM_EMAIL =
      'Police Station Agent <noreply@policestationagent.com>';
    clearVerifiedDomainsCache();
    const { fetchResendVerifiedDomains } = await import('@/lib/firm-outreach/outreach/from-address');
    await fetchResendVerifiedDomains(async () => ({
      data: [{ name: 'policestationrepuk.org', status: 'verified' }],
    }));
    const health = await getOutreachSendHealth();
    const psa = health.campaigns.find((c) => c.campaignId === AGENT_COVER_KENT_CAMPAIGN_ID);
    expect(psa?.usedFallbackDefault).toBe(true);
    expect(psa?.blockers).toContain('psa_using_repuk_from_until_policestationagent.com_verified');
  });

  it('normalizes nested Resend domain list payloads', async () => {
    const { fetchResendVerifiedDomains } = await import('@/lib/firm-outreach/outreach/from-address');
    clearVerifiedDomainsCache();
    const domains = await fetchResendVerifiedDomains(async () => ({
      data: {
        data: [
          { name: 'policestationrepuk.org', status: 'verified' },
          { name: 'policestationagent.com', status: 'not_started' },
        ],
      },
    }));
    expect(domains.has('policestationrepuk.org')).toBe(true);
    expect(domains.has('policestationagent.com')).toBe(false);
  });

  it('treats an invalid Resend API key as zero verified domains (does not fake-healthy)', async () => {
    process.env.RESEND_API_KEY = 're_test';
    const { fetchResendVerifiedDomains } = await import('@/lib/firm-outreach/outreach/from-address');
    clearVerifiedDomainsCache();
    const domains = await fetchResendVerifiedDomains(async () => ({
      data: null,
      error: { statusCode: 400, message: 'API key is invalid', name: 'validation_error' },
    }));
    expect(domains.size).toBe(0);
  });

  it('falls back to the verified sending domain on transient Resend errors', async () => {
    process.env.RESEND_API_KEY = 're_test';
    const { fetchResendVerifiedDomains } = await import('@/lib/firm-outreach/outreach/from-address');
    clearVerifiedDomainsCache();
    const domains = await fetchResendVerifiedDomains(async () => ({
      data: null,
      error: { statusCode: 500, message: 'Internal server error' },
    }));
    expect(domains.has(VERIFIED_FALLBACK_DOMAIN)).toBe(true);
  });

  it('does not permanently stick on a transient errored lookup', async () => {
    process.env.RESEND_API_KEY = 're_test';
    const { fetchResendVerifiedDomains } = await import('@/lib/firm-outreach/outreach/from-address');
    clearVerifiedDomainsCache();
    await fetchResendVerifiedDomains(async () => ({
      data: null,
      error: { statusCode: 503, message: 'Service unavailable' },
    }));
    const domains = await fetchResendVerifiedDomains(async () => ({
      data: [
        { name: 'policestationrepuk.org', status: 'verified' },
        { name: 'policestationagent.com', status: 'verified' },
      ],
    }));
    expect(domains.has('policestationagent.com')).toBe(true);
  });
});

describe('sendOutreachEmail domain retry', () => {
  const ENV = process.env;
  const sendMock = vi.fn();

  beforeEach(() => {
    vi.resetModules();
    clearVerifiedDomainsCache();
    process.env = { ...ENV, RESEND_API_KEY: 're_test' };
    delete process.env.FIRM_OUTREACH_PSA_FROM_EMAIL;
    sendMock.mockReset();
  });

  afterEach(() => {
    process.env = { ...ENV };
    vi.restoreAllMocks();
    clearVerifiedDomainsCache();
  });

  it('retries PSA send with verified RepUK from after domain-not-verified error', async () => {
    process.env.FIRM_OUTREACH_PSA_FROM_EMAIL =
      'Police Station Agent <noreply@policestationagent.com>';
    sendMock
      .mockResolvedValueOnce({
        error: { message: 'The policestationagent.com domain is not verified.' },
        data: null,
      })
      .mockResolvedValueOnce({ error: null, data: { id: 'msg_retry_ok' } });

    vi.doMock('resend', () => ({
      Resend: vi.fn().mockImplementation(function ResendMock() {
        return {
          domains: {
            list: vi.fn().mockResolvedValue({
              data: [
                { name: 'policestationagent.com', status: 'verified' },
                { name: 'policestationrepuk.org', status: 'verified' },
              ],
            }),
          },
          emails: { send: sendMock },
        };
      }),
    }));

    const { sendOutreachEmail } = await import('@/lib/firm-outreach/outreach/send');
    const result = await sendOutreachEmail({
      prospect: {
        id: 'fop_test',
        firmKey: 'test',
        firmName: 'Test LLP',
        prospectType: 'firm',
        status: 'ready_to_send',
        sequenceStep: 0,
        sources: ['laa'],
        priorityScore: 0,
        campaignId: AGENT_COVER_KENT_CAMPAIGN_ID,
        enrichAttempts: 0,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        email: 'test@example.co.uk',
      },
      step: 0,
    });

    expect(result.ok).toBe(true);
    expect(result.messageId).toBe('msg_retry_ok');
    expect(sendMock).toHaveBeenCalledTimes(2);
    expect(sendMock.mock.calls[1]?.[0]?.from).toBe(DEFAULT_PSA_FROM_FALLBACK);
  });
});
