import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { validateOutreachEnv } from '@robertcashman/firm-outreach-core';

const ENV = process.env;

function baseValidEnv(): void {
  process.env = { ...ENV };
  process.env.RESEND_API_KEY = 're_test';
  process.env.KV_REST_API_URL = 'https://kv.example';
  process.env.KV_REST_API_TOKEN = 'tok';
  process.env.CRON_SECRET = 'cron';
  process.env.FIRM_OUTREACH_DIGEST_EMAIL = 'owner@example.com';
  delete process.env.FIRM_OUTREACH_FROM_EMAIL;
  delete process.env.BUFFER_SCHEDULER_NOTIFY_EMAIL;
  delete process.env.OWNER_EMAIL;
  delete process.env.ADMIN_EMAILS;
}

describe('validateOutreachEnv', () => {
  beforeEach(baseValidEnv);
  afterEach(() => {
    process.env = { ...ENV };
  });

  it('does NOT fail closed when FIRM_OUTREACH_FROM_EMAIL is unset (verified default exists)', () => {
    const result = validateOutreachEnv({ requireCronSecret: true });
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.warnings.some((w) => w.includes('FIRM_OUTREACH_FROM_EMAIL'))).toBe(true);
  });

  it('reports no warning when FROM_EMAIL is set', () => {
    process.env.FIRM_OUTREACH_FROM_EMAIL = 'PoliceStationRepUK <noreply@policestationrepuk.org>';
    const result = validateOutreachEnv({ requireCronSecret: true });
    expect(result.ok).toBe(true);
    expect(result.warnings).toEqual([]);
  });

  it('still fails closed on genuinely missing critical config', () => {
    delete process.env.RESEND_API_KEY;
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;
    const result = validateOutreachEnv({ requireCronSecret: true });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes('RESEND_API_KEY'))).toBe(true);
    expect(result.errors.some((e) => e.includes('UPSTASH_REDIS_REST_URL'))).toBe(true);
  });

  it('accepts ADMIN_EMAILS as a digest recipient fallback', () => {
    delete process.env.FIRM_OUTREACH_DIGEST_EMAIL;
    process.env.ADMIN_EMAILS = 'admin@example.com,second@example.com';
    const result = validateOutreachEnv({ requireCronSecret: true });
    expect(result.ok).toBe(true);
    expect(result.errors.some((e) => e.includes('DIGEST_EMAIL'))).toBe(false);
  });

  it('fails when no digest recipient is resolvable from any source', () => {
    delete process.env.FIRM_OUTREACH_DIGEST_EMAIL;
    const result = validateOutreachEnv({ requireCronSecret: true });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes('DIGEST_EMAIL'))).toBe(true);
  });
});
