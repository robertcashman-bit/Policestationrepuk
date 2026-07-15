import { bumpSkipReason, createEmptySkipReasons } from '@robertcashman/firm-outreach-core';
import { activeOutreachCampaignId, isCampaignProspect } from './campaign-scope';
import { dailySendCap } from './constants';
import { validateEmailForSend } from './enrichment/validator';
import { qualifyProspectForOutreach } from './qualification';
import {
  getDailySendCount,
  getGlobalResendQuotaRemaining,
  isDuplicateInitialSend,
  isSuppressed,
  listProspectsByRecordStatus,
  listProspectsForFirmKey,
} from './storage';
import type { FirmProspect } from './types';
import { normalizeEmail } from './normalize';
import { orderProspectsForSendQueue } from './outreach/candidate-order';
import { daysSinceIso, nextOutreachStep } from './outreach/sequence';

const FIRM_SEND_COOLDOWN_DAYS = 90;

export interface DryRunPreviewRow {
  prospectId: string;
  firmName: string;
  email?: string;
  status: string;
  step: number | null;
  wouldSend: boolean;
  skipReason?: string;
}

export interface DryRunPreviewResult {
  campaignId: string;
  date: string;
  dailyCap: number;
  sentToday: number;
  remaining: number;
  resendQuotaRemaining: number;
  preview: DryRunPreviewRow[];
  skipReasons: Partial<Record<string, number>>;
}

async function firmRecentlyContacted(
  prospect: FirmProspect,
  campaignId: string,
): Promise<boolean> {
  const siblings = await listProspectsForFirmKey(prospect.firmKey);
  for (const s of siblings) {
    if (s.id === prospect.id || !isCampaignProspect(s, campaignId)) continue;
    if (s.lastEmailAt && daysSinceIso(s.lastEmailAt) < FIRM_SEND_COOLDOWN_DAYS) {
      return true;
    }
  }
  return false;
}

export async function buildOutreachDryRunPreview(opts?: {
  campaignId?: string;
  limit?: number;
}): Promise<DryRunPreviewResult> {
  const campaignId = opts?.campaignId ?? activeOutreachCampaignId();
  const campaignOpts = { campaignId };
  const date = new Date().toISOString().slice(0, 10);
  const cap = dailySendCap();
  const sentToday = await getDailySendCount(date, campaignId);
  const remaining = Math.max(0, cap - sentToday);
  const resendQuotaRemaining = await getGlobalResendQuotaRemaining(date);
  const skipReasons = createEmptySkipReasons();
  const preview: DryRunPreviewRow[] = [];
  const maxRows = opts?.limit ?? 25;

  const ready = await listProspectsByRecordStatus('ready_to_send', 2000, campaignOpts);
  const sent = await listProspectsByRecordStatus('sent', 2000, campaignOpts);
  const candidates = orderProspectsForSendQueue([...ready, ...sent]);
  const emailsSeen = new Set<string>();
  let wouldSend = 0;

  for (const prospect of candidates) {
    if (preview.length >= maxRows && wouldSend >= remaining) break;

    const step = nextOutreachStep(prospect);
    const row: DryRunPreviewRow = {
      prospectId: prospect.id,
      firmName: prospect.firmName,
      email: prospect.email,
      status: prospect.status,
      step,
      wouldSend: false,
    };

    if (wouldSend >= remaining) {
      row.skipReason = 'daily_cap';
      bumpSkipReason(skipReasons, 'daily_cap');
      preview.push(row);
      continue;
    }

    if (step === null) {
      row.skipReason = 'no_step';
      bumpSkipReason(skipReasons, 'no_step');
      preview.push(row);
      continue;
    }

    const email = prospect.email?.trim();
    if (!email) {
      row.skipReason = 'no_email';
      bumpSkipReason(skipReasons, 'no_email');
      preview.push(row);
      continue;
    }

    const qualification = qualifyProspectForOutreach(prospect);
    if (!qualification.qualified) {
      row.skipReason = 'not_qualified';
      bumpSkipReason(skipReasons, 'not_qualified');
      preview.push(row);
      continue;
    }

    if (await isSuppressed(email)) {
      row.skipReason = 'suppressed';
      bumpSkipReason(skipReasons, 'suppressed');
      preview.push(row);
      continue;
    }

    const normalized = normalizeEmail(email);
    if (
      step === 0 &&
      (emailsSeen.has(normalized) ||
        (await isDuplicateInitialSend(email, prospect.id, campaignId)))
    ) {
      row.skipReason = 'duplicate';
      bumpSkipReason(skipReasons, 'duplicate');
      preview.push(row);
      continue;
    }

    if (prospect.prospectType === 'solicitor' && (await firmRecentlyContacted(prospect, campaignId))) {
      row.skipReason = 'firm_cooldown';
      bumpSkipReason(skipReasons, 'firm_cooldown');
      preview.push(row);
      continue;
    }

    const validation = await validateEmailForSend(email);
    if (!validation.ok) {
      row.skipReason = 'mx_invalid';
      bumpSkipReason(skipReasons, 'mx_invalid');
      preview.push(row);
      continue;
    }

    if (resendQuotaRemaining - wouldSend <= 0) {
      row.skipReason = 'resend_quota';
      bumpSkipReason(skipReasons, 'resend_quota');
      preview.push(row);
      continue;
    }

    row.wouldSend = true;
    emailsSeen.add(normalized);
    wouldSend++;
    preview.push(row);
  }

  return {
    campaignId,
    date,
    dailyCap: cap,
    sentToday,
    remaining,
    resendQuotaRemaining,
    preview,
    skipReasons,
  };
}
