import { afterEach, describe, expect, it } from 'vitest';
import { psaSendReserve } from '@/lib/firm-outreach/send-quota-split';

describe('psaSendReserve', () => {
  afterEach(() => {
    delete process.env.FIRM_OUTREACH_PSA_DAILY_RESERVE;
  });

  it('reserves a PSA floor so RepUK cannot take the full pool', () => {
    const split = psaSendReserve({
      globalRemaining: 40,
      psaReadyCount: 20,
      sendLimit: 40,
    });
    expect(split.psaLimit).toBe(10);
    expect(split.repukLimit).toBe(30);
  });

  it('honors FIRM_OUTREACH_PSA_DAILY_RESERVE', () => {
    process.env.FIRM_OUTREACH_PSA_DAILY_RESERVE = '5';
    const split = psaSendReserve({
      globalRemaining: 40,
      psaReadyCount: 20,
      sendLimit: 40,
    });
    expect(split.psaLimit).toBe(5);
    expect(split.repukLimit).toBe(35);
  });

  it('gives RepUK the full pool when PSA has no ready rows', () => {
    const split = psaSendReserve({
      globalRemaining: 40,
      psaReadyCount: 0,
      sendLimit: 40,
    });
    expect(split.psaLimit).toBe(0);
    expect(split.repukLimit).toBe(40);
  });
});
