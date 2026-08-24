import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockListByStatus = vi.fn();
const mockIndexedSends = vi.fn();
const mockIdempotentJobs = vi.fn();
const mockListForFirm = vi.fn();

vi.mock('@/lib/firm-outreach/storage', () => ({
  listProspectsByRecordStatus: (...a: unknown[]) => mockListByStatus(...a),
  emailsWithIndexedSendsForCampaign: (...a: unknown[]) => mockIndexedSends(...a),
  emailHasIndexedSend: vi.fn(),
  listProspectsForFirmKey: (...a: unknown[]) => mockListForFirm(...a),
}));

vi.mock('@/lib/firm-outreach/email-jobs/storage', () => ({
  emailsWithIdempotentJobsForCampaign: (...a: unknown[]) => mockIdempotentJobs(...a),
}));

import { readyProspectScanLimit, selectOutreachCandidates } from '@/lib/firm-outreach/outreach/candidate-selection';
import type { FirmProspect } from '@/lib/firm-outreach/types';

function prospect(over: Partial<FirmProspect> = {}): FirmProspect {
  return {
    id: 'fop_new',
    prospectType: 'firm',
    firmName: 'New Firm',
    firmKey: 'new-firm',
    sources: ['laa'],
    status: 'ready_to_send',
    priorityScore: 10,
    sequenceStep: 0,
    campaignId: 'whatsapp_invite_v1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    enrichAttempts: 1,
    email: 'crime@newfirm.co.uk',
    ...over,
  };
}

describe('selectOutreachCandidates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListForFirm.mockResolvedValue([]);
    mockIndexedSends.mockResolvedValue(new Set<string>());
    mockIdempotentJobs.mockResolvedValue(new Set<string>());
  });

  it('drops ready inboxes that already have indexed sends so follow-ups can run', async () => {
    const alreadyMailed = prospect({
      id: 'fop_old',
      email: 'info@oldfirm.co.uk',
      firmName: 'Old Firm',
      priorityScore: 99,
    });
    const fresh = prospect({ id: 'fop_fresh', email: 'duty@fresh.co.uk' });
    const followUp = prospect({
      id: 'fop_fu',
      status: 'sent',
      sequenceStep: 0,
      lastEmailAt: new Date(Date.now() - 8 * 86_400_000).toISOString(),
      email: 'crime@followup.co.uk',
    });
    mockListByStatus.mockImplementation(async (status: string) => {
      if (status === 'ready_to_send') return [alreadyMailed, fresh];
      return [followUp];
    });
    mockIndexedSends.mockResolvedValue(new Set(['info@oldfirm.co.uk']));

    const result = await selectOutreachCandidates({
      campaignId: 'whatsapp_invite_v1',
      readyLimit: 50,
      sentLimit: 50,
    });

    expect(result.candidates.map((c) => c.prospect.id)).toEqual(['fop_fresh', 'fop_fu']);
    expect(result.readyEligible).toBe(1);
    expect(result.followUpEligible).toBe(1);
    expect(result.skippedIndexedSend).toBe(1);
  });

  it('scans past a clogged already-mailed prefix to reach a fresh inbox', async () => {
    const clog = Array.from({ length: 40 }, (_, i) =>
      prospect({
        id: `fop_old_${i}`,
        email: `info${i}@oldfirm.co.uk`,
        firmName: `Old Firm ${i}`,
        priorityScore: 90,
      }),
    );
    const fresh = prospect({
      id: 'fop_fresh',
      email: 'duty@fresh.co.uk',
      priorityScore: 5,
    });
    mockListByStatus.mockImplementation(async (status: string) => {
      if (status === 'ready_to_send') return [...clog, fresh];
      return [];
    });
    mockIndexedSends.mockResolvedValue(
      new Set(clog.map((p) => p.email as string)),
    );

    const result = await selectOutreachCandidates({
      campaignId: 'whatsapp_invite_v1',
      readyLimit: 8,
      sentLimit: 8,
    });

    expect(result.candidates.map((c) => c.prospect.id)).toEqual(['fop_fresh']);
    expect(result.skippedIndexedSend).toBe(40);
    expect(result.readyEligible).toBe(1);
  });

  it('advances past ready firms with terminal RepUK jobs (idempotent_exists) to an unsent firm', async () => {
    // Production failure: ticks burned the batch on idempotent_exists while
    // ~3k never-mailed firms sat behind — jobs existed without send-index hits.
    const clog = Array.from({ length: 30 }, (_, i) =>
      prospect({
        id: `fop_jobbed_${i}`,
        email: `info${i}@jobbed.co.uk`,
        firmName: `Jobbed Firm ${i}`,
        priorityScore: 95,
      }),
    );
    const fresh = prospect({
      id: 'fop_unsent',
      email: 'crime@unsent.co.uk',
      firmName: 'Unsent Firm',
      priorityScore: 1,
    });
    mockListByStatus.mockImplementation(async (status: string) => {
      if (status === 'ready_to_send') return [...clog, fresh];
      return [];
    });
    mockIndexedSends.mockResolvedValue(new Set<string>());
    mockIdempotentJobs.mockResolvedValue(
      new Set(clog.map((p) => p.email as string)),
    );

    const result = await selectOutreachCandidates({
      campaignId: 'whatsapp_invite_v1',
      readyLimit: 10,
      sentLimit: 10,
    });

    expect(mockIdempotentJobs).toHaveBeenCalledWith(
      expect.arrayContaining(['crime@unsent.co.uk']),
      'whatsapp_invite_v1',
      0,
    );
    expect(result.candidates.map((c) => c.prospect.id)).toEqual(['fop_unsent']);
    expect(result.skippedIdempotentJob).toBe(30);
    expect(result.skippedIndexedSend).toBe(0);
    expect(result.readyEligible).toBe(1);
  });

  it('does not treat PSA terminal-job history as RepUK idempotent (campaign-scoped)', async () => {
    const sharedInbox = prospect({
      id: 'fop_repuk',
      email: 'info@shared.co.uk',
      priorityScore: 50,
    });
    mockListByStatus.mockImplementation(async (status: string) => {
      if (status === 'ready_to_send') return [sharedInbox];
      return [];
    });
    // PSA may have mailed this inbox; campaign-scoped job lookup returns empty for RepUK.
    mockIdempotentJobs.mockResolvedValue(new Set<string>());
    mockIndexedSends.mockResolvedValue(new Set<string>());

    const result = await selectOutreachCandidates({
      campaignId: 'whatsapp_invite_v1',
      readyLimit: 50,
      sentLimit: 50,
    });

    expect(mockIdempotentJobs).toHaveBeenCalledWith(
      ['info@shared.co.uk'],
      'whatsapp_invite_v1',
      0,
    );
    expect(result.candidates.map((c) => c.prospect.id)).toEqual(['fop_repuk']);
    expect(result.skippedIdempotentJob).toBe(0);
  });

  it('caps the ready scan so a large send limit cannot exhaust the time slice', async () => {
    expect(readyProspectScanLimit(200)).toBe(1200);
    expect(readyProspectScanLimit(1200)).toBe(2000);
    expect(readyProspectScanLimit(50)).toBe(300);
    mockListByStatus.mockResolvedValue([]);
    await selectOutreachCandidates({
      campaignId: 'whatsapp_invite_v1',
      readyLimit: 1200,
      sentLimit: 40,
    });
    const readyCall = mockListByStatus.mock.calls.find((c) => c[0] === 'ready_to_send');
    expect(readyCall?.[1]).toBe(2000);
  });

  it('honours maxReadyScan and skipIndexedSendCheck for status probes', async () => {
    mockListByStatus.mockResolvedValue([
      prospect({ id: 'fop_a', email: 'a@firm.co.uk' }),
      prospect({ id: 'fop_b', email: 'b@firm.co.uk' }),
    ]);
    const result = await selectOutreachCandidates({
      campaignId: 'whatsapp_invite_v1',
      readyLimit: 40,
      sentLimit: 20,
      maxReadyScan: 120,
      skipIndexedSendCheck: true,
      excludeFirmCooldown: false,
    });
    const readyCall = mockListByStatus.mock.calls.find((c) => c[0] === 'ready_to_send');
    expect(readyCall?.[1]).toBe(120);
    expect(mockIndexedSends).not.toHaveBeenCalled();
    expect(mockIdempotentJobs).not.toHaveBeenCalled();
    expect(result.readyEligible).toBe(2);
    expect(result.skippedIndexedSend).toBe(0);
    expect(result.skippedIdempotentJob).toBe(0);
  });

  it('scopes indexed-send skips to the campaign being flushed', async () => {
    const fresh = prospect({ id: 'fop_fresh', email: 'duty@fresh.co.uk' });
    mockListByStatus.mockImplementation(async (status: string) => {
      if (status === 'ready_to_send') return [fresh];
      return [];
    });
    // PSA may have mailed this inbox; campaign-scoped index must not see it.
    mockIndexedSends.mockResolvedValue(new Set<string>());

    const result = await selectOutreachCandidates({
      campaignId: 'whatsapp_invite_v1',
      readyLimit: 50,
      sentLimit: 50,
    });

    expect(mockIndexedSends).toHaveBeenCalledWith(
      ['duty@fresh.co.uk'],
      'whatsapp_invite_v1',
    );
    expect(result.candidates.map((c) => c.prospect.id)).toEqual(['fop_fresh']);
  });
});
