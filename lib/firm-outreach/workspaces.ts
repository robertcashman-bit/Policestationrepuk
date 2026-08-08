/**
 * Dual-workspace identity for firm outreach.
 * Both campaigns share one KV + Resend project on this deployment.
 */
import {
  AGENT_COVER_KENT_CAMPAIGN_ID,
  activeOutreachCampaignId,
} from './campaign-scope';

export type OutreachWorkspaceId = 'psa' | 'repuk';

export interface OutreachWorkspace {
  id: OutreachWorkspaceId;
  label: string;
  productionUrl: string;
  campaignId: string;
  brand: string;
  preferredFromEnv: 'FIRM_OUTREACH_PSA_FROM_EMAIL' | 'FIRM_OUTREACH_FROM_EMAIL';
  defaultFrom: string;
}

export const OUTREACH_WORKSPACES: readonly OutreachWorkspace[] = [
  {
    id: 'psa',
    label: 'POLICESTATIONAGENT.COM',
    productionUrl: 'https://policestationagent.com',
    campaignId: AGENT_COVER_KENT_CAMPAIGN_ID,
    brand: 'Police Station Agent',
    preferredFromEnv: 'FIRM_OUTREACH_PSA_FROM_EMAIL',
    defaultFrom: 'Police Station Agent <noreply@policestationagent.com>',
  },
  {
    id: 'repuk',
    label: 'POLICESTATIONREPUK.ORG',
    productionUrl: 'https://policestationrepuk.org',
    campaignId: activeOutreachCampaignId(),
    brand: 'PoliceStationRepUK',
    preferredFromEnv: 'FIRM_OUTREACH_FROM_EMAIL',
    defaultFrom: 'PoliceStationRepUK <noreply@policestationrepuk.org>',
  },
] as const;

export function workspaceById(id: OutreachWorkspaceId): OutreachWorkspace {
  const found = OUTREACH_WORKSPACES.find((w) => w.id === id);
  if (!found) throw new Error(`Unknown outreach workspace: ${id}`);
  return found;
}

export function workspaceByCampaignId(campaignId: string): OutreachWorkspace | null {
  return OUTREACH_WORKSPACES.find((w) => w.campaignId === campaignId) ?? null;
}

export function workspaceFromEnv(): string {
  return (
    process.env.FIRM_OUTREACH_FROM_EMAIL?.trim() ||
    process.env.FIRM_OUTREACH_PSA_FROM_EMAIL?.trim() ||
    ''
  );
}
