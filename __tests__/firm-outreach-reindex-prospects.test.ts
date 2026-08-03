import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetKV = vi.fn();
const mockScanKeys = vi.fn();
const mockGetProspect = vi.fn();
const mockListAllProspectIds = vi.fn();
const mockListProspectIdsByStatus = vi.fn();

vi.mock('@/lib/kv', () => ({
  getKV: () => mockGetKV(),
}));

vi.mock('@/lib/firm-outreach/kv-scan', () => ({
  scanKeys: (...args: unknown[]) => mockScanKeys(...args),
}));

vi.mock('@/lib/firm-outreach/storage', () => ({
  getProspect: (...args: unknown[]) => mockGetProspect(...args),
  listAllProspectIds: (...args: unknown[]) => mockListAllProspectIds(...args),
  listProspectIdsByStatus: (...args: unknown[]) => mockListProspectIdsByStatus(...args),
}));

describe('reindexProspectStatuses', () => {
  beforeEach(() => {
    vi.resetModules();
    mockGetKV.mockReset();
    mockScanKeys.mockReset();
    mockGetProspect.mockReset();
    mockListAllProspectIds.mockReset();
    mockListProspectIdsByStatus.mockReset();
  });

  it('rebuilds Redis SET indexes from status union + SCAN, not JSON arrays', async () => {
    const dels: string[] = [];
    const sadds: Array<{ key: string; member: string }> = [];
    const sets: unknown[] = [];

    const pipeline = {
      sadd(key: string, member: string) {
        sadds.push({ key, member });
        return pipeline;
      },
      async exec() {
        return [];
      },
    };

    mockGetKV.mockReturnValue({
      async del(key: string) {
        dels.push(key);
      },
      pipeline: () => pipeline,
      async set(...args: unknown[]) {
        sets.push(args);
      },
    });

    mockListAllProspectIds.mockResolvedValue([]);
    mockListProspectIdsByStatus.mockImplementation(async (status: string) =>
      status === 'excluded' ? ['fop_a'] : [],
    );
    mockScanKeys.mockResolvedValue(['firmprospect:fop_b']);
    mockGetProspect.mockImplementation(async (id: string) => {
      if (id === 'fop_a') {
        return {
          id: 'fop_a',
          status: 'excluded',
          firmKey: 'firm_a',
          campaignId: 'whatsapp_invite_v1',
        };
      }
      if (id === 'fop_b') {
        return {
          id: 'fop_b',
          status: 'ready_to_send',
          firmKey: 'firm_b',
          campaignId: 'whatsapp_invite_v1',
          email: 'a@example.com',
        };
      }
      return null;
    });

    const { reindexProspectStatuses } = await import('@/lib/firm-outreach/reindex-prospects');
    const result = await reindexProspectStatuses();

    expect(sets).toEqual([]);
    expect(dels).toContain('firmprospect:index');
    expect(dels).toContain('firmprospect:status:excluded');
    expect(dels).toContain('firmprospect:status:ready_to_send');
    expect(sadds.some((x) => x.key === 'firmprospect:index' && x.member === 'fop_a')).toBe(true);
    expect(sadds.some((x) => x.key === 'firmprospect:index' && x.member === 'fop_b')).toBe(true);
    expect(sadds.some((x) => x.key === 'firmprospect:firm:firm_a' && x.member === 'fop_a')).toBe(
      true,
    );
    expect(result.scanned).toBe(2);
    expect(result.indexSize).toBe(2);
    expect(result.byStatus.excluded).toBe(1);
    expect(result.byStatus.ready_to_send).toBe(1);
    expect(result.firmIndexes).toBe(2);
  });
});
