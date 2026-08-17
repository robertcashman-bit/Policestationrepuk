import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockListByStatus = vi.fn();
const mockIndexedSends = vi.fn();
const mockListForFirm = vi.fn();

vi.mock('@/lib/firm-outreach/storage', () => ({
  listProspectsByRecordStatus: (...a: unknown[]) => mockListByStatus(...a),
  emailsWithIndexedSends: (...a: unknown[]) => mockIndexedSends(...a),
  emailHasIndexedSend: vi.fn(),
  listProspectsForFirmKey: (...a: unknown[]) => mockListForFirm(...a),
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

  it('caps the ready scan so a large send limit cannot exhaust the time slice', async () => {
    expect(readyProspectScanLimit(200)).toBe(1200);
    expect(readyProspectScanLimit(1200)).toBe(1200);
    expect(readyProspectScanLimit(50)).toBe(300);
    mockListByStatus.mockResolvedValue([]);
    await selectOutreachCandidates({
      campaignId: 'whatsapp_invite_v1',
      readyLimit: 1200,
      sentLimit: 40,
    });
    const readyCall = mockListByStatus.mock.calls.find((c) => c[0] === 'ready_to_send');
    expect(readyCall?.[1]).toBe(1200);
  });
});
