import { afterEach, describe, expect, it } from 'vitest';
import {
  isResendDailyLimitUnlimited,
  resendDailyHeadroom,
  resendDailyLimit,
  resendOutreachBudget,
  resendQuotaRemaining,
} from '@robertcashman/firm-outreach-core';

describe('resendDailyLimit unlimited', () => {
  const keys = ['FIRM_OUTREACH_RESEND_DAILY_LIMIT', 'FIRM_OUTREACH_RESEND_HEADROOM'] as const;
  const prev: Record<string, string | undefined> = {};

  afterEach(() => {
    for (const k of keys) {
      if (prev[k] === undefined) delete process.env[k];
      else process.env[k] = prev[k];
    }
  });

  function stash() {
    for (const k of keys) prev[k] = process.env[k];
  }

  it('defaults to 100 when unset', () => {
    stash();
    delete process.env.FIRM_OUTREACH_RESEND_DAILY_LIMIT;
    delete process.env.FIRM_OUTREACH_RESEND_HEADROOM;
    expect(resendDailyLimit()).toBe(100);
    expect(isResendDailyLimitUnlimited()).toBe(false);
    expect(resendOutreachBudget()).toBe(90);
  });

  it('treats unlimited/0/off as no daily budget', () => {
    stash();
    for (const raw of ['unlimited', '0', 'off', 'none']) {
      process.env.FIRM_OUTREACH_RESEND_DAILY_LIMIT = raw;
      expect(isResendDailyLimitUnlimited()).toBe(true);
      expect(resendDailyHeadroom()).toBe(0);
      expect(resendOutreachBudget()).toBe(Number.MAX_SAFE_INTEGER);
      expect(resendQuotaRemaining(5000)).toBe(Number.MAX_SAFE_INTEGER - 5000);
    }
  });
});
