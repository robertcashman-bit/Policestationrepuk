import { existsSync } from 'fs';
import { resendOutreachBudget } from '@robertcashman/firm-outreach-core';
import { getKV } from '@/lib/kv';
import { BROCHURE_PUBLIC_PATH } from './brochure/load-attachment';
import {
  countyAllowlist,
  dailySendCap,
  isDailySendCapUnlimited,
  outreachEnabled,
} from './constants';
import { getOutreachSendHealth } from './outreach/from-address';
import { getOutreachPauseSummary, isOutreachSendAllowed } from './pause-state';
import { getGlobalResendQuotaRemaining, getResendSendCount } from './storage';

export async function getOutreachConfigStatus() {
  const pause = await getOutreachPauseSummary();
  const sendAllowed = await isOutreachSendAllowed();
  const sendHealth = await getOutreachSendHealth();
  const utcDate = new Date().toISOString().slice(0, 10);
  const resendSendCount = await getResendSendCount(utcDate);
  const resendQuotaRemaining = await getGlobalResendQuotaRemaining(utcDate);

  return {
    kvConfigured: Boolean(getKV()),
    resendConfigured: sendHealth.resendConfigured,
    brochureExists: existsSync(BROCHURE_PUBLIC_PATH),
    dryRun: ['1', 'true', 'yes', 'on'].includes(
      (process.env.FIRM_OUTREACH_DRY_RUN ?? '').trim().toLowerCase(),
    ),
    outreachEnabled: outreachEnabled(),
    sendEnabledEnv: process.env.FIRM_OUTREACH_SEND_ENABLED !== 'false',
    sendAllowed,
    sendHealthy: sendHealth.sendHealthy,
    sendBlockers: sendHealth.sendBlockers,
    campaignSendHealth: sendHealth.campaigns,
    verifiedResendDomains: sendHealth.verifiedDomains,
    fromEmail: process.env.FIRM_OUTREACH_FROM_EMAIL?.trim() || null,
    psaFromEmail: process.env.FIRM_OUTREACH_PSA_FROM_EMAIL?.trim() || null,
    digestEmail: process.env.FIRM_OUTREACH_DIGEST_EMAIL?.trim() || null,
    countyAllowlist: countyAllowlist(),
    dailyCap: (() => {
      const cap = dailySendCap();
      const unlimited = isDailySendCapUnlimited(cap);
      // #region agent log
      fetch('http://127.0.0.1:7496/ingest/55a0b704-8cf7-4e35-a08f-f5d81d38bd00', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '71f13e' },
        body: JSON.stringify({
          sessionId: '71f13e',
          hypothesisId: 'B',
          location: 'lib/firm-outreach/config-status.ts:getOutreachConfigStatus',
          message: 'status reports both dailyCap and resend budget',
          data: {
            dailyCap: unlimited ? null : cap,
            dailyCapUnlimited: unlimited,
            resendSendCount,
            resendQuotaRemaining,
            resendOutreachBudget: resendOutreachBudget(),
            separateLimiters: true,
          },
          timestamp: Date.now(),
          runId: 'post-fix',
        }),
      }).catch(() => {});
      // #endregion
      return unlimited ? null : cap;
    })(),
    dailyCapUnlimited: isDailySendCapUnlimited(),
    resendSendCount,
    resendQuotaRemaining,
    resendOutreachBudget: resendOutreachBudget(),
    cronConfigured: Boolean(process.env.CRON_SECRET?.trim()),
    ...pause,
  };
}
