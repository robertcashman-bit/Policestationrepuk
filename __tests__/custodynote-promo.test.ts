import { describe, expect, it } from 'vitest';
import * as promo from '@/lib/custodynote-promo';

describe('custodynote-promo commercial line', () => {
  it('promotes free during beta with no credit card', () => {
    expect(promo.CUSTODYNOTE_FREE_LABEL).toBe('Free during beta');
    expect(promo.CUSTODYNOTE_BETA_REASON.toLowerCase()).toContain('beta');
    expect(promo.CUSTODYNOTE_NO_CARD_LINE.toLowerCase()).toContain('no credit card');
    expect(promo.CUSTODYNOTE_TRIAL_CTA.toLowerCase()).toContain('download');
  });

  it('points CTAs at custodynote.com/download', () => {
    expect(promo.CUSTODYNOTE_DOWNLOAD_HREF).toContain('https://custodynote.com/download');
    expect(promo.CUSTODYNOTE_TRIAL_HREF).toBe(promo.CUSTODYNOTE_DOWNLOAD_HREF);
    expect(promo.TOP_BANNER_TEXT.toLowerCase()).toContain('free during beta');
    expect(promo.TOP_BANNER_TEXT_MOBILE.toLowerCase()).toContain('free during beta');
  });

  it('does not sell a live trial, £11.99 offer, or A2MJY2NQ code', () => {
    const surfaces = Object.values(promo)
      .filter((v): v is string => typeof v === 'string')
      .join(' ');
    expect(surfaces.toLowerCase()).not.toMatch(/30-day/);
    expect(surfaces.toLowerCase()).not.toMatch(/free trial/);
    expect(surfaces).not.toMatch(/11\.99/);
    expect(surfaces).not.toMatch(/A2MJY2NQ/);
    expect(surfaces).not.toMatch(/7\.99/);
    expect(promo).not.toHaveProperty('CUSTODYNOTE_DISCOUNT_CODE');
    expect(promo).not.toHaveProperty('CUSTODYNOTE_MEMBER_DEAL');
    expect(promo).not.toHaveProperty('CUSTODYNOTE_MEMBER_PRICE_GBP');
  });

  it('mentions planned Pro only as post-beta, not a live paid offer', () => {
    expect(promo.CUSTODYNOTE_PRICE_GBP).toBe('9.99');
    expect(promo.CUSTODYNOTE_PLANNED_PRO_LINE.toLowerCase()).toContain('planned after beta');
    expect(promo.CUSTODYNOTE_PLANNED_PRO_LINE.toLowerCase()).toContain('not wired');
  });
});
