import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const sendMock = vi.fn().mockResolvedValue({ data: { id: 'x' } });

vi.mock('resend', () => {
  return {
    Resend: class MockResend {
      emails = { send: sendMock };
    },
  };
});

import {
  maybeNotifyOutreachSendFailure,
} from '@/lib/firm-outreach/outreach/send-failure-email';

const ENV = process.env;

describe('maybeNotifyOutreachSendFailure', () => {
  beforeEach(() => {
    process.env = { ...ENV, RESEND_API_KEY: 'test-key' };
    sendMock.mockClear();
  });

  afterEach(() => {
    process.env = ENV;
  });

  it('does not notify for ordinary errors (deferred to 07:00 report)', async () => {
    await maybeNotifyOutreachSendFailure({
      stats: { queued: 5, sent: 0, skipped: 0, suppressed: 0, errors: 2, elapsedMs: 0 },
      readyToSend: 10,
    });
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('does not notify for routine zero-sent (deferred to 07:00 report)', async () => {
    await maybeNotifyOutreachSendFailure({
      stats: { queued: 3, sent: 0, skipped: 0, suppressed: 0, errors: 0, elapsedMs: 0 },
      readyToSend: 10,
    });
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('notifies only for critical unhealthy config reasons', async () => {
    await maybeNotifyOutreachSendFailure({
      stats: { queued: 5, sent: 0, skipped: 0, suppressed: 0, errors: 0, elapsedMs: 0 },
      readyToSend: 10,
      reason: 'Outreach send config unhealthy: domain not verified',
    });
    expect(sendMock).toHaveBeenCalled();
  });

  it('does not notify on successful send', async () => {
    await maybeNotifyOutreachSendFailure({
      stats: { queued: 5, sent: 5, skipped: 0, suppressed: 0, errors: 0, elapsedMs: 0 },
      readyToSend: 10,
    });
    expect(sendMock).not.toHaveBeenCalled();
  });
});
