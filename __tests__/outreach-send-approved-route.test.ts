import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '@/app/api/outreach/send-approved/route';
import { FIRM_OUTREACH_EMAIL_DISABLED_REASON } from '@/lib/firm-outreach/site-config';

describe('outreach send-approved route (permanently disabled)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 410 and never runs outreach', async () => {
    const res = await POST(
      new Request('http://localhost/api/outreach/send-approved', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ approvalRef: 'tok_test' }),
      }),
    );
    expect(res.status).toBe(410);
    const json = await res.json();
    expect(json.disabled).toBe(true);
    expect(json.reason).toBe(FIRM_OUTREACH_EMAIL_DISABLED_REASON);
  });
});
