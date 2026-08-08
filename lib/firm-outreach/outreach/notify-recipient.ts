/** Owner email for outreach approval / critical alerts / daily report fallback. */
export function outreachNotifyEmail(): string {
  return (
    process.env.OUTREACH_ADMIN_EMAIL?.trim() ||
    process.env.FIRM_OUTREACH_DIGEST_EMAIL?.trim() ||
    process.env.BUFFER_SCHEDULER_NOTIFY_EMAIL?.trim() ||
    process.env.OWNER_EMAIL?.trim() ||
    process.env.ADMIN_EMAILS?.split(/[,;]/)[0]?.trim() ||
    'robertdavidcashman@gmail.com'
  );
}
