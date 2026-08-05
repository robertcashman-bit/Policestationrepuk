import { createOutreachEnvHelpers } from '@robertcashman/firm-outreach-core';

export { FIRM_OUTREACH_UA, FIRM_OUTREACH_CAMPAIGN_ID } from './site-config';

export {
  COMPETITOR_KEYWORDS,
  CONTACT_PATHS,
  CRIMINAL_KEYWORDS,
  EXCLUDED_FIRM_PATTERNS,
  FREE_EMAIL_DOMAINS,
  NON_EW_POSTCODE_PREFIXES,
  PREFERRED_EMAIL_LOCALS,
  REJECTED_EMAIL_LOCALS,
} from '@robertcashman/firm-outreach-core';

const env = createOutreachEnvHelpers({
  countyAllowlist: null,
  cronEnrichBatch: 60,
  // Soft daily cap is off by default (unset/0); Resend budget still binds.
  cronSendBatch: 50,
  enrichMaxMs: 270_000,
  paidDailyCap: 150,
});

export const outreachEnabled = env.outreachEnabled;
export const outreachSendEnabled = env.outreachSendEnabled;
export const outreachPaused = env.outreachPaused;
export const outreachRequireApproval = env.outreachRequireApproval;
export const isDailySendCapUnlimited = (cap = env.dailySendCap()): boolean =>
  cap >= Number.MAX_SAFE_INTEGER;
// #region agent log
export const dailySendCap = (): number => {
  const raw = process.env.FIRM_OUTREACH_DAILY_CAP;
  const value = env.dailySendCap();
  const unlimited = isDailySendCapUnlimited(value);
  fetch('http://127.0.0.1:7496/ingest/55a0b704-8cf7-4e35-a08f-f5d81d38bd00', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '71f13e' },
    body: JSON.stringify({
      sessionId: '71f13e',
      hypothesisId: 'A',
      location: 'lib/firm-outreach/constants.ts:dailySendCap',
      message: 'dailySendCap resolved',
      data: {
        envPresent: raw !== undefined && String(raw).trim() !== '',
        envRaw: raw ?? null,
        resolvedCap: unlimited ? null : value,
        unlimited,
      },
      timestamp: Date.now(),
      runId: 'post-fix',
    }),
  }).catch(() => {});
  return value;
};
// #endregion
export const enrichBatchSize = env.enrichBatchSize;
export const cronEnrichBatchSize = env.cronEnrichBatchSize;
export const cronSendBatchSize = env.cronSendBatchSize;
export const enrichMaxElapsedMs = env.enrichMaxElapsedMs;
export const paidDailyCap = env.paidDailyCap;
export const countyAllowlist = env.countyAllowlist;
