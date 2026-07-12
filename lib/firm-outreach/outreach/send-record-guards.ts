import { isProviderAcceptedMessageId } from '@robertcashman/firm-outreach-core';
import type { FirmOutreachSend } from '../types';

export class OutreachSendCommitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OutreachSendCommitError';
  }
}

/** Refuse to persist a provider-accepted send without a Resend message id. */
export function assertSendRecordHasProviderId(
  send: Pick<FirmOutreachSend, 'status' | 'resendMessageId'>,
): void {
  if (send.status !== 'sent') return;
  if (!isProviderAcceptedMessageId(send.resendMessageId)) {
    throw new OutreachSendCommitError('send_record_missing_resend_message_id');
  }
}
