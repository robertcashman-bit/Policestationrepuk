import { afterEach, describe, expect, it } from 'vitest';
import {
  FIRM_SEND_COOLDOWN_DAYS_DEFAULT,
  firmSendCooldownDays,
} from '@robertcashman/firm-outreach-core';

describe('firmSendCooldownDays', () => {
  const prev = process.env.FIRM_OUTREACH_FIRM_COOLDOWN_DAYS;

  afterEach(() => {
    if (prev === undefined) delete process.env.FIRM_OUTREACH_FIRM_COOLDOWN_DAYS;
    else process.env.FIRM_OUTREACH_FIRM_COOLDOWN_DAYS = prev;
  });

  it('defaults to 90 days', () => {
    delete process.env.FIRM_OUTREACH_FIRM_COOLDOWN_DAYS;
    expect(firmSendCooldownDays()).toBe(FIRM_SEND_COOLDOWN_DAYS_DEFAULT);
  });

  it('honors env override', () => {
    process.env.FIRM_OUTREACH_FIRM_COOLDOWN_DAYS = '14';
    expect(firmSendCooldownDays()).toBe(14);
  });

  it('clamps invalid / extreme values', () => {
    process.env.FIRM_OUTREACH_FIRM_COOLDOWN_DAYS = '-3';
    expect(firmSendCooldownDays()).toBe(0);
    process.env.FIRM_OUTREACH_FIRM_COOLDOWN_DAYS = '9999';
    expect(firmSendCooldownDays()).toBe(365);
  });
});
