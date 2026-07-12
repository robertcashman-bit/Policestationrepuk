export interface OutreachEnvValidation {
  ok: boolean;
  errors: string[];
  /** Non-fatal configuration hints — do NOT block sending. */
  warnings: string[];
}

function hasKvCreds(): boolean {
  const url =
    process.env.UPSTASH_REDIS_REST_URL?.trim() || process.env.KV_REST_API_URL?.trim() || '';
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN?.trim() || process.env.KV_REST_API_TOKEN?.trim() || '';
  return Boolean(url && token);
}

/** Loud fail helper for cron routes — lists missing production config. */
export function validateOutreachEnv(opts?: { requireCronSecret?: boolean }): OutreachEnvValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!process.env.RESEND_API_KEY?.trim()) {
    errors.push('RESEND_API_KEY missing');
  }
  if (!hasKvCreds()) {
    errors.push('UPSTASH_REDIS_REST_URL/TOKEN (or KV_REST_API_*) missing');
  }
  if (opts?.requireCronSecret && !process.env.CRON_SECRET?.trim()) {
    errors.push('CRON_SECRET missing');
  }

  const digest =
    process.env.FIRM_OUTREACH_DIGEST_EMAIL?.trim() ||
    process.env.BUFFER_SCHEDULER_NOTIFY_EMAIL?.trim() ||
    process.env.OWNER_EMAIL?.trim() ||
    process.env.ADMIN_EMAILS?.split(',')[0]?.trim();
  if (!digest) {
    errors.push(
      'FIRM_OUTREACH_DIGEST_EMAIL (or BUFFER_SCHEDULER_NOTIFY_EMAIL / OWNER_EMAIL / ADMIN_EMAILS) missing',
    );
  }

  // FROM_EMAIL is optional: a verified default sender (noreply@policestationrepuk.org) is
  // always available, so a missing override must NOT fail the send cron closed.
  if (!process.env.FIRM_OUTREACH_FROM_EMAIL?.trim()) {
    warnings.push(
      'FIRM_OUTREACH_FROM_EMAIL not set — using verified default PoliceStationRepUK <noreply@policestationrepuk.org>',
    );
  }

  return { ok: errors.length === 0, errors, warnings };
}
