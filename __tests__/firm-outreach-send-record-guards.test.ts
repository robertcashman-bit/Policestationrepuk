import { describe, expect, it } from 'vitest';
import { isProviderAcceptedMessageId } from '@robertcashman/firm-outreach-core';
import { assertSendRecordHasProviderId } from '@/lib/firm-outreach/outreach/send-record-guards';

describe('isProviderAcceptedMessageId', () => {
  it('accepts real Resend ids', () => {
    expect(isProviderAcceptedMessageId('58228e76-1f1e-43e5-b54d-185d5249f5bf')).toBe(true);
  });

  it('rejects dry-run and empty ids', () => {
    expect(isProviderAcceptedMessageId('dry-run')).toBe(false);
    expect(isProviderAcceptedMessageId('')).toBe(false);
    expect(isProviderAcceptedMessageId(undefined)).toBe(false);
  });
});

describe('assertSendRecordHasProviderId', () => {
  it('allows queued sends without provider id', () => {
    expect(() => assertSendRecordHasProviderId({ status: 'queued' })).not.toThrow();
  });

  it('blocks sent records without provider id', () => {
    expect(() => assertSendRecordHasProviderId({ status: 'sent' })).toThrow(
      /send_record_missing_resend_message_id/,
    );
    expect(() =>
      assertSendRecordHasProviderId({ status: 'sent', resendMessageId: 'dry-run' }),
    ).toThrow(/send_record_missing_resend_message_id/);
  });
});
