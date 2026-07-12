"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isProviderAcceptedMessageId = isProviderAcceptedMessageId;
/** True when Resend (or a test stub) returned a real provider message id. */
function isProviderAcceptedMessageId(messageId) {
    const id = messageId?.trim();
    return Boolean(id && id !== 'dry-run');
}
