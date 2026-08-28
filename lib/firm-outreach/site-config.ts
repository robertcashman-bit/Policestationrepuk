/** Site-specific firm-outreach identity (no imports — avoids circular init). */
export const FIRM_OUTREACH_UA =
  'PoliceStationRepUK/1.0 (+https://policestationrepuk.org; firm-outreach)';

export const FIRM_OUTREACH_CAMPAIGN_ID = 'whatsapp_invite_v1';

/**
 * All firm-outreach *email* product is permanently off on this deployment:
 * firm sends (RepUK + PSA), operator digests/reports/approval mail, and the
 * admin / approve UI. Pipeline/enrich/bootstrap may still run but must not
 * email firms or Robert about outreach. Do not re-enable.
 * @see .cursor/rules/psa-outreach-disabled.mdc
 */
export const FIRM_OUTREACH_EMAIL_PERMANENTLY_DISABLED = true as const;

/**
 * Police Station Agent (`agent_cover_kent_v1`) firm outreach remains
 * permanently off (subset of the global email kill).
 */
export const AGENT_COVER_OUTREACH_PERMANENTLY_DISABLED = true as const;

/** All campaigns that may still have KV rows (lookups, webhooks, suppressions). */
export const OUTREACH_CAMPAIGN_IDS = [
  'agent_cover_kent_v1',
  'whatsapp_invite_v1',
] as const;

/**
 * Campaigns allowed to send live outreach email from this deployment.
 * Empty while firm outreach email is permanently disabled.
 */
export const SENDABLE_OUTREACH_CAMPAIGN_IDS = [] as const;

export function isFirmOutreachEmailPermanentlyDisabled(): boolean {
  return FIRM_OUTREACH_EMAIL_PERMANENTLY_DISABLED;
}

/** Operator digests, daily reports, approval/ready mail, critical alerts. */
export function isFirmOutreachOperatorMailDisabled(): boolean {
  return FIRM_OUTREACH_EMAIL_PERMANENTLY_DISABLED;
}

export function isAgentCoverOutreachDisabled(): boolean {
  return AGENT_COVER_OUTREACH_PERMANENTLY_DISABLED;
}

export function isOutreachCampaignSendable(campaignId: string): boolean {
  if (FIRM_OUTREACH_EMAIL_PERMANENTLY_DISABLED) return false;
  if (
    campaignId === 'agent_cover_kent_v1' &&
    AGENT_COVER_OUTREACH_PERMANENTLY_DISABLED
  ) {
    return false;
  }
  return (SENDABLE_OUTREACH_CAMPAIGN_IDS as readonly string[]).includes(campaignId);
}

export const FIRM_OUTREACH_EMAIL_DISABLED_REASON =
  'firm_outreach_email_permanently_disabled' as const;
