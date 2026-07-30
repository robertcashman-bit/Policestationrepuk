import { describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import { mergeOutreachRunStats, emptyOutreachRunStats } from '@/lib/firm-outreach/outreach/run-outreach';
import { OUTREACH_CAMPAIGN_IDS } from '@/lib/firm-outreach/site-config';

describe('multi-campaign outreach send', () => {
  it('includes both RepUK and PSA campaign ids', () => {
    expect(OUTREACH_CAMPAIGN_IDS).toContain('whatsapp_invite_v1');
    expect(OUTREACH_CAMPAIGN_IDS).toContain('agent_cover_kent_v1');
  });

  it('merges per-campaign send stats', () => {
    const a = { ...emptyOutreachRunStats(), sent: 3, skipped: 1, elapsedMs: 20 };
    const b = { ...emptyOutreachRunStats(), sent: 2, errors: 1, elapsedMs: 15 };
    const merged = mergeOutreachRunStats(a, b);
    expect(merged.sent).toBe(5);
    expect(merged.skipped).toBe(1);
    expect(merged.errors).toBe(1);
    expect(merged.elapsedMs).toBe(35);
  });

  it('pipeline and approval routes send all campaigns', async () => {
    const pipeline = await fs.readFile('lib/firm-outreach/run-pipeline.ts', 'utf-8');
    const approved = await fs.readFile('app/api/outreach/send-approved/route.ts', 'utf-8');
    const runner = await fs.readFile('lib/firm-outreach/outreach/run-outreach.ts', 'utf-8');

    expect(runner).toContain('runFirmOutreachAllCampaigns');
    expect(runner).toContain('OUTREACH_CAMPAIGN_IDS');
    expect(runner).toContain('assertOutreachSendReady');
    expect(runner).toContain('isOutreachSendAllowed');

    expect(pipeline).toContain('runFirmOutreachAllCampaigns');
    expect(pipeline).toContain('AGENT_COVER_KENT_CAMPAIGN_ID');
    expect(pipeline).toContain('agentCoverSend');

    expect(approved).toContain('runFirmOutreachAllCampaigns');
    expect(approved).toContain('isOutreachSendAllowed');
  });
});
