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

  it('matches desktop release v1.9.106 and keeps download as canonical install path', () => {
    expect(promo.CUSTODYNOTE_VERSION).toBe('1.9.106');
    expect(promo.CUSTODYNOTE_DOWNLOAD_HREF).toContain('https://custodynote.com/download');
    expect(promo.CUSTODYNOTE_TRIAL_HREF).toBe(promo.CUSTODYNOTE_DOWNLOAD_HREF);
  });

  it('states Microsoft Store is available for Windows (UK) — not for Mac', () => {
    const status = promo.CUSTODYNOTE_STORE_STATUS_LINE.toLowerCase();
    expect(status).toMatch(/microsoft store/);
    expect(status).toMatch(/windows only|windows-only/);
    expect(status).toMatch(/available on microsoft store/);
    expect(status).toMatch(/uk/);
    expect(status).toMatch(/not for mac/);
    expect(status).toContain('custodynote.com/download');
    expect(status).not.toMatch(/coming soon|in certification|not installable/);

    expect(promo.CUSTODYNOTE_STORE_ID).toBe('9NFSRVT3T45V');
    expect(promo.CUSTODYNOTE_STORE_HREF).toBe(
      'https://apps.microsoft.com/detail/9NFSRVT3T45V',
    );
    expect(promo.CUSTODYNOTE_STORE_CTA.toLowerCase()).toMatch(/microsoft store/);

    const surfaces = Object.values(promo)
      .filter((v): v is string => typeof v === 'string')
      .join(' ');
    const lower = surfaces.toLowerCase();

    // Reject stale pre-launch wording
    expect(lower).not.toMatch(/coming soon/);
    expect(lower).not.toMatch(/in certification/);
    expect(lower).not.toMatch(/not installable/);

    // Do not claim Mac is on the Store; avoid MSIX packaging jargon in promo surfaces
    expect(lower).not.toMatch(/mac (is |remains )?(also )?available on (the )?microsoft store/);
    expect(lower).not.toMatch(/microsoft store.*(for|and) mac/);
    expect(lower).not.toMatch(/\bmsix\b/);
  });

  it('makes Windows + Mac and download location clear (Store is Windows-only)', () => {
    expect(promo.CUSTODYNOTE_APPS_LINE.toLowerCase()).toMatch(/windows/);
    expect(promo.CUSTODYNOTE_APPS_LINE.toLowerCase()).toMatch(/mac/);
    expect(promo.CUSTODYNOTE_DOWNLOAD_APPS_CTA.toLowerCase()).toMatch(/windows.*mac|mac.*windows/);
    expect(promo.CUSTODYNOTE_DOWNLOAD_LOCATION_LINE.toLowerCase()).toContain('custodynote.com/download');
    expect(promo.CUSTODYNOTE_DOWNLOAD_LOCATION_LINE.toLowerCase()).toMatch(/windows.*mac|mac.*windows/);
    expect(promo.CUSTODYNOTE_DOWNLOAD_LOCATION_LINE.toLowerCase()).toMatch(/microsoft store/);
    expect(promo.CUSTODYNOTE_MAC_DOWNLOAD_HREF).toContain('https://custodynote.com/download');
    expect(promo.CUSTODYNOTE_MAC_DOWNLOAD_HREF).toMatch(/#mac$/);
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
