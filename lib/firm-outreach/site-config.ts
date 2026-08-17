/** Site-specific firm-outreach identity (no imports — avoids circular init). */
export const FIRM_OUTREACH_UA =
  'PoliceStationRepUK/1.0 (+https://policestationrepuk.org; firm-outreach)';

export const FIRM_OUTREACH_CAMPAIGN_ID = 'whatsapp_invite_v1';

/**
 * Police Station Agent (`agent_cover_kent_v1`) firm outreach is permanently off
 * in this repo. Do not re-enable. RepUK WhatsApp / firm invites stay active.
 * @see .cursor/rules/psa-outreach-disabled.mdc
 */
export const AGENT_COVER_OUTREACH_PERMANENTLY_DISABLED = true as const;

/** All campaigns that may still have KV rows (lookups, webhooks, suppressions). */
export const OUTREACH_CAMPAIGN_IDS = [
  'agent_cover_kent_v1',
  'whatsapp_invite_v1',
] as const;

/** Campaigns allowed to send live outreach email from this deployment. */
export const SENDABLE_OUTREACH_CAMPAIGN_IDS = ['whatsapp_invite_v1'] as const;

export function isAgentCoverOutreachDisabled(): boolean {
  return AGENT_COVER_OUTREACH_PERMANENTLY_DISABLED;
}

export function isOutreachCampaignSendable(campaignId: string): boolean {
  if (
    campaignId === 'agent_cover_kent_v1' &&
    AGENT_COVER_OUTREACH_PERMANENTLY_DISABLED
  ) {
    return false;
  }
  return (SENDABLE_OUTREACH_CAMPAIGN_IDS as readonly string[]).includes(campaignId);
}
