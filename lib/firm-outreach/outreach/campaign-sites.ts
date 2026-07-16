import { OUTREACH_CAMPAIGN_IDS } from '../site-config';

export interface OutreachCampaignSite {
  campaignId: string;
  site: string;
  label: string;
}

export const OUTREACH_CAMPAIGN_SITES: Record<string, OutreachCampaignSite> = {
  whatsapp_invite_v1: {
    campaignId: 'whatsapp_invite_v1',
    site: 'policestationrepuk.org',
    label: 'RepUK WhatsApp invite',
  },
  agent_cover_kent_v1: {
    campaignId: 'agent_cover_kent_v1',
    site: 'policestationagent.com',
    label: 'PSA Kent agent cover',
  },
};

export function outreachCampaignSite(campaignId: string): OutreachCampaignSite {
  return (
    OUTREACH_CAMPAIGN_SITES[campaignId] ?? {
      campaignId,
      site: campaignId,
      label: campaignId,
    }
  );
}

export function allOutreachCampaignSites(): OutreachCampaignSite[] {
  return OUTREACH_CAMPAIGN_IDS.map((id) => outreachCampaignSite(id));
}
