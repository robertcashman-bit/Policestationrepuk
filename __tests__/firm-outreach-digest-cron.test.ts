import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FIRM_OUTREACH_EMAIL_DISABLED_REASON } from '@/lib/firm-outreach/site-config';

const mockIsCronAuthorized = vi.fn();

vi.mock('@/lib/cron-auth', () => ({
  isCronAuthorized: (...a: unknown[]) => mockIsCronAuthorized(...a),
}));

describe('firm-outreach-digest cron (permanently disabled)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsCronAuthorized.mockReturnValue(true);
  });

  it('skips without sending digest or approval mail', async () => {
    const { GET } = await import('@/app/api/cron/firm-outreach-digest/route');
    const res = await GET(new Request('https://policestationrepuk.org/api/cron/firm-outreach-digest'));
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.skipped).toBe(true);
    expect(body.reason).toBe(FIRM_OUTREACH_EMAIL_DISABLED_REASON);
    expect(body.mode).toBe('permanently_disabled');
  });
});
