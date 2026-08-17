/** Site-specific firm-outreach identity (no imports — avoids circular init). */
export const FIRM_OUTREACH_UA =
  'PoliceStationRepUK/1.0 (+https://policestationrepuk.org; firm-outreach)';

export const FIRM_OUTREACH_CAMPAIGN_ID = 'whatsapp_invite_v1';

/**
 * All campaigns that may share this KV (inventory / lookups).
 * PSA agent-cover remains listed for historical KV keys and admin visibility,
 * but live sends use {@link ENABLED_OUTREACH_CAMPAIGN_IDS} only.
 */
export const OUTREACH_CAMPAIGN_IDS = [
  'agent_cover_kent_v1',
  'whatsapp_invite_v1',
] as const;

/**
 * Campaigns allowed to send / probe / flush via automated + dual-campaign paths.
 * PSA firm outreach is permanently disabled — RepUK WhatsApp invites only.
 */
export const ENABLED_OUTREACH_CAMPAIGN_IDS = [FIRM_OUTREACH_CAMPAIGN_ID] as const;
