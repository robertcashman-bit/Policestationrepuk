import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGet = vi.fn();
const mockSet = vi.fn();
const mockDel = vi.fn();

vi.mock('@/lib/kv', () => ({
  getKV: () => ({ get: mockGet, set: mockSet, del: mockDel }),
}));

vi.mock('@/lib/buffer/config', () => ({
  getSchedulerTimezone: () => 'Europe/London',
}));

import {
  clearSiblingRepairDoneForDay,
  isSiblingRepairDoneForDay,
  markSiblingRepairDoneForDay,
  siblingRepairGateDate,
} from '@/lib/automation/sibling-repair-gate';

describe('sibling-repair once-per-day gate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses London local date for the gate key', () => {
    const d = siblingRepairGateDate(new Date('2026-08-26T07:15:00.000Z'));
    expect(d).toBe('2026-08-26');
  });

  it('reports done only when KV flag is set', async () => {
    mockGet.mockResolvedValueOnce(null);
    expect(await isSiblingRepairDoneForDay('2026-08-26')).toBe(false);
    mockGet.mockResolvedValueOnce('healed');
    expect(await isSiblingRepairDoneForDay('2026-08-26')).toBe(true);
  });

  it('mark / clear write and delete the gate key', async () => {
    await markSiblingRepairDoneForDay('2026-08-26', 'healed');
    expect(mockSet).toHaveBeenCalledWith(
      'automation:sibling-repair:done:2026-08-26',
      'healed',
      expect.objectContaining({ ex: expect.any(Number) }),
    );
    await clearSiblingRepairDoneForDay('2026-08-26');
    expect(mockDel).toHaveBeenCalledWith('automation:sibling-repair:done:2026-08-26');
  });
});
