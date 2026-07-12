import { isProviderAcceptedMessageId } from '@robertcashman/firm-outreach-core';
import {
  createSendRecord,
  incrementDailySendCount,
  incrementResendSendCount,
  saveProspect,
  saveSend,
} from '../storage';
import type { FirmOutreachSend, FirmProspect } from '../types';
import { assertSendRecordHasProviderId, OutreachSendCommitError } from './send-record-guards';

export { OutreachSendCommitError } from './send-record-guards';

/**
 * Persist prospect + send record + counters only after Resend acceptance.
 * Throws if messageId is missing — callers must treat as a failed send.
 */
export async function commitSuccessfulOutreachSend(opts: {
  prospect: FirmProspect;
  previousStatus?: FirmProspect['status'];
  email: string;
  step: number;
  subject: string;
  messageId: string;
  date: string;
  campaignId: string;
}): Promise<FirmOutreachSend> {
  if (!isProviderAcceptedMessageId(opts.messageId)) {
    throw new OutreachSendCommitError('missing_provider_message_id');
  }

  const now = new Date().toISOString();
  const prevStatus = opts.previousStatus ?? opts.prospect.status;
  opts.prospect.sequenceStep = opts.step;
  opts.prospect.lastEmailAt = now;
  opts.prospect.status = 'sent';
  opts.prospect.updatedAt = now;
  await saveProspect(opts.prospect, prevStatus);

  const send = createSendRecord({
    prospectId: opts.prospect.id,
    firmName: opts.prospect.firmName,
    prospectType: opts.prospect.prospectType,
    email: opts.email,
    campaignId: opts.campaignId,
    sequenceStep: opts.step,
    subject: opts.subject,
  });
  send.status = 'sent';
  send.sentAt = now;
  send.resendMessageId = opts.messageId.trim();
  assertSendRecordHasProviderId(send);
  await saveSend(send);

  await incrementDailySendCount(opts.date, opts.campaignId);
  await incrementResendSendCount(opts.date);

  return send;
}
