/**
 * Police Station Agent (policestationagent) firm-outreach kill switch.
 *
 * Permanently disabled in this repo — Robert only wants PoliceStationRepUK
 * WhatsApp / firm invite outreach. Do not re-enable without an explicit
 * operator request that names PSA.
 *
 * See `.cursor/rules/psa-outreach-disabled.mdc`.
 */
import { AGENT_COVER_KENT_CAMPAIGN_ID } from './campaign-scope';

/** Hard-off. Not env-togglable — env alone previously left PSA sending live. */
export const PSA_FIRM_OUTREACH_ENABLED = false;

export const PSA_FIRM_OUTREACH_DISABLED_REASON =
  'psa_firm_outreach_permanently_disabled';

export function isPsaFirmOutreachEnabled(): boolean {
  return PSA_FIRM_OUTREACH_ENABLED;
}

export function isPsaFirmOutreachCampaign(campaignId: string | undefined | null): boolean {
  return campaignId === AGENT_COVER_KENT_CAMPAIGN_ID;
}

/** True when this campaign must not send / probe / refill inventory. */
export function isPsaFirmOutreachBlocked(campaignId: string | undefined | null): boolean {
  return isPsaFirmOutreachCampaign(campaignId) && !isPsaFirmOutreachEnabled();
}
