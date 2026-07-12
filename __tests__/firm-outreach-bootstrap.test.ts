import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const sendOutreachEmailMock = vi.fn();
const resolveOutreachFromAddressMock = vi.fn();

vi.mock('@/lib/firm-outreach/bootstrap-outreach', () => ({
  bootstrapOutreach: vi.fn(),
}));

vi.mock('@/lib/firm-outreach/outreach/send', () => ({
  sendOutreachEmail: (...args: unknown[]) => sendOutreachEmailMock(...args),
}));

vi.mock('@/lib/firm-outreach/outreach/from-address', () => ({
  resolveOutreachFromAddress: (...args: unknown[]) => resolveOutreachFromAddressMock(...args),
}));

const ENV = process.env;

describe('firm-outreach-bootstrap psaTestSend', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...ENV,
      NODE_ENV: 'production',
      CRON_SECRET: 'cron-test-secret',
      FIRM_OUTREACH_TEST_RECIPIENTS: 'admin@example.com',
    };
    sendOutreachEmailMock.mockReset();
    resolveOutreachFromAddressMock.mockReset();
    resolveOutreachFromAddressMock.mockResolvedValue({
      from: 'Police Station Agent <noreply@policestationrepuk.org>',
      domain: 'policestationrepuk.org',
      campaignId: 'agent_cover_kent_v1',
      usedFallback: false,
    });
  });

  afterEach(() => {
    process.env = { ...ENV };
  });

  async function getRoute() {
    const { GET } = await import('@/app/api/cron/firm-outreach-bootstrap/route');
    return GET;
  }

  it('returns 401 without cron secret', async () => {
    const GET = await getRoute();
    const res = await GET(
      new Request(
        'http://localhost/api/cron/firm-outreach-bootstrap?psaTestSend=1&email=admin@example.com',
      ),
    );
    expect(res.status).toBe(401);
  });

  it('returns 403 for non-allowlisted email', async () => {
    const GET = await getRoute();
    const res = await GET(
      new Request(
        'http://localhost/api/cron/firm-outreach-bootstrap?psaTestSend=1&email=random@example.com',
        { headers: { authorization: 'Bearer cron-test-secret' } },
      ),
    );
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe('test_recipient_not_allowlisted');
    expect(sendOutreachEmailMock).not.toHaveBeenCalled();
  });

  it('returns 200 and sends for allowlisted email', async () => {
    sendOutreachEmailMock.mockResolvedValue({
      ok: true,
      messageId: 'msg_test_ok',
      subject: 'Kent police station cover — agency solicitor services',
    });
    const GET = await getRoute();
    const res = await GET(
      new Request(
        'http://localhost/api/cron/firm-outreach-bootstrap?psaTestSend=1&email=admin@example.com',
        { headers: { authorization: 'Bearer cron-test-secret' } },
      ),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.messageId).toBe('msg_test_ok');
    expect(sendOutreachEmailMock).toHaveBeenCalledOnce();
  });

  it('accepts x-test-recipient header instead of query param', async () => {
    sendOutreachEmailMock.mockResolvedValue({
      ok: true,
      messageId: 'msg_header_ok',
      subject: 'Kent police station cover — agency solicitor services',
    });
    const GET = await getRoute();
    const res = await GET(
      new Request('http://localhost/api/cron/firm-outreach-bootstrap?psaTestSend=1', {
        headers: {
          authorization: 'Bearer cron-test-secret',
          'x-test-recipient': 'admin@example.com',
        },
      }),
    );
    expect(res.status).toBe(200);
    expect(sendOutreachEmailMock).toHaveBeenCalledOnce();
  });

  it('returns 502 when send fails', async () => {
    sendOutreachEmailMock.mockResolvedValue({
      ok: false,
      subject: 'Kent police station cover — agency solicitor services',
      error: 'provider_error',
    });
    const GET = await getRoute();
    const res = await GET(
      new Request(
        'http://localhost/api/cron/firm-outreach-bootstrap?psaTestSend=1&email=admin@example.com',
        { headers: { authorization: 'Bearer cron-test-secret' } },
      ),
    );
    expect(res.status).toBe(502);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.result.error).toBe('provider_error');
  });

  it('returns 503 when allowlist is empty in production', async () => {
    delete process.env.FIRM_OUTREACH_TEST_RECIPIENTS;
    delete process.env.FIRM_OUTREACH_DIGEST_EMAIL;
    delete process.env.ADMIN_EMAILS;
    delete process.env.OWNER_EMAIL;
    const GET = await getRoute();
    const res = await GET(
      new Request(
        'http://localhost/api/cron/firm-outreach-bootstrap?psaTestSend=1&email=admin@example.com',
        { headers: { authorization: 'Bearer cron-test-secret' } },
      ),
    );
    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.error).toBe('test_recipients_not_configured');
  });
});

describe('test-recipients helper', () => {
  beforeEach(() => {
    process.env = { ...ENV };
    delete process.env.FIRM_OUTREACH_TEST_RECIPIENTS;
    delete process.env.FIRM_OUTREACH_DIGEST_EMAIL;
    delete process.env.ADMIN_EMAILS;
    delete process.env.OWNER_EMAIL;
  });

  afterEach(() => {
    process.env = { ...ENV };
  });

  it('normalises and deduplicates configured recipients', async () => {
    process.env.FIRM_OUTREACH_TEST_RECIPIENTS = 'Admin@Example.com, admin@example.com';
    process.env.OWNER_EMAIL = 'owner@example.com';
    const { listAllowedTestRecipients, isAllowedTestRecipient } = await import(
      '@/lib/firm-outreach/outreach/test-recipients'
    );
    expect(listAllowedTestRecipients()).toEqual(['admin@example.com', 'owner@example.com']);
    expect(isAllowedTestRecipient('ADMIN@example.com')).toBe(true);
    expect(isAllowedTestRecipient('other@example.com')).toBe(false);
  });
});
