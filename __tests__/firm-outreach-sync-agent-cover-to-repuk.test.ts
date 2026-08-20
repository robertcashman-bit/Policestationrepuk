import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockListIds = vi.fn();
const mockGetByIds = vi.fn();
const mockGetProspect = vi.fn();
const mockSave = vi.fn();
const mockSuppressed = vi.fn();
const mockDuplicate = vi.fn();

vi.mock('@/lib/firm-outreach/storage', () => ({
  listProspectIdsByRecordStatus: (...a: unknown[]) => mockListIds(...a),
  getProspectsByIds: (...a: unknown[]) => mockGetByIds(...a),
  getProspect: (...a: unknown[]) => mockGetProspect(...a),
  saveProspect: (...a: unknown[]) => mockSave(...a),
  isSuppressed: (...a: unknown[]) => mockSuppressed(...a),
  isDuplicateInitialSend: (...a: unknown[]) => mockDuplicate(...a),
}));

import { syncAgentCoverInventoryToRepuk } from '@/lib/firm-outreach/sync-agent-cover-to-repuk';
import type { FirmProspect } from '@/lib/firm-outreach/types';

function psaProspect(over: Partial<FirmProspect> = {}): FirmProspect {
  return {
    id: 'agent_cover_kent_v1:test-criminal-ltd',
    campaignId: 'agent_cover_kent_v1',
    firmName: 'Test Criminal Ltd',
    firmKey: 'test-criminal-ltd',
    prospectType: 'firm',
    email: 'crime@test-criminal.co.uk',
    status: 'ready_to_send',
    sources: ['laa'],
    sequenceStep: 0,
    priorityScore: 40,
    enrichAttempts: 1,
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    ...over,
  };
}

describe('syncAgentCoverInventoryToRepuk', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSuppressed.mockResolvedValue(false);
    mockDuplicate.mockResolvedValue(false);
    mockSave.mockResolvedValue(undefined);
    mockGetProspect.mockResolvedValue(null);
    mockListIds.mockImplementation(async (status: string, opts?: { campaignId?: string }) => {
      if (opts?.campaignId !== 'agent_cover_kent_v1') return [];
      if (status === 'ready_to_send') return ['agent_cover_kent_v1:test-criminal-ltd'];
      return [];
    });
    mockGetByIds.mockResolvedValue(
      new Map([['agent_cover_kent_v1:test-criminal-ltd', psaProspect()]]),
    );
  });

  it('creates a whatsapp_invite_v1 ready row from PSA inventory', async () => {
    const stats = await syncAgentCoverInventoryToRepuk({ limit: 10 });
    expect(stats.created).toBe(1);
    expect(mockSave).toHaveBeenCalledOnce();
    const saved = mockSave.mock.calls[0][0] as FirmProspect;
    expect(saved.campaignId).toBe('whatsapp_invite_v1');
    expect(saved.status).toBe('ready_to_send');
    expect(saved.email).toBe('crime@test-criminal.co.uk');
    expect(mockDuplicate).toHaveBeenCalledWith(
      'crime@test-criminal.co.uk',
      expect.any(String),
      'whatsapp_invite_v1',
    );
  });

  it('skips when RepUK already has a same-campaign initial send', async () => {
    mockDuplicate.mockResolvedValue(true);
    const stats = await syncAgentCoverInventoryToRepuk({ limit: 10 });
    expect(stats.skippedDuplicate).toBe(1);
    expect(stats.created).toBe(0);
    expect(mockSave).not.toHaveBeenCalled();
  });
});
