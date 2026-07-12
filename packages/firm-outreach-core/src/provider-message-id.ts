/** True when Resend (or a test stub) returned a real provider message id. */
export function isProviderAcceptedMessageId(messageId: string | undefined): boolean {
  const id = messageId?.trim();
  return Boolean(id && id !== 'dry-run');
}
