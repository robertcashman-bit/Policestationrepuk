/**
 * Robert Cashman’s direct mobile for solicitor/agency reveal only.
 *
 * IMPORTANT: import this from server routes only. Never import into client
 * components — the digits must not appear in the RSC/flight payload or any
 * server-rendered HTML for /rep/robert-cashman.
 */
export const ROBERT_DIRECT_MOBILE_DISPLAY = '07535 494446';
export const ROBERT_DIRECT_MOBILE_E164 = '+447535494446';

export function robertDirectMobilePayload() {
  return {
    display: ROBERT_DIRECT_MOBILE_DISPLAY,
    tel: `tel:${ROBERT_DIRECT_MOBILE_E164}`,
    sms: `sms:${ROBERT_DIRECT_MOBILE_E164}`,
  };
}
