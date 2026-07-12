import { isProviderAcceptedMessageId } from '@robertcashman/firm-outreach-core';
import { dailySendCap } from '../constants';
import { computeProspectPriority } from '../enrichment/scorer';
import { normalizeEmail } from '../normalize';
import { resolveStatusWithQualification } from '../qualification';
import {
  excludeProspectDuplicateEmail,
  getDailySendCount,
  getProspect,
  getSuppressionsByEmails,
  isDuplicateInitialSend,
  isSuppressed,
  saveProspect,
} from '../storage';
import type {
  FirmProspect,
  FirmProspectStatus,
  OutreachExcludedRow,
  OutreachQueueRow,
} from '../types';
import { sendOutreachEmail } from './send';
import { commitSuccessfulOutreachSend } from './commit-send';
import { invalidateOutreachSummaryCache } from './activity-report';

export type RestoreExcludedOptions = {
  targetStatus?: 'discovered' | 'ready_to_send';
  addManualSource?: boolean;
  crimeWebsiteVerified?: boolean;
};

export type ManualSendOptions = {
  dryRun?: boolean;
  step?: number;
};

export type AdminActionResult<T> =
  | { ok: true; prospect: FirmProspect; data?: T }
  | { ok: false; error: string };

/** Whether an admin manual send is allowed (suppression respected; qualification bypassed). */
export function canManualSendProspect(
  prospect: FirmProspect,
  suppressed: boolean,
  duplicateInitial?: boolean,
): { ok: boolean; reason?: string } {
  const email = prospect.email?.trim();
  if (!email) return { ok: false, reason: 'no_email' };
  if (suppressed) return { ok: false, reason: 'suppressed' };
  if (duplicateInitial) return { ok: false, reason: 'duplicate_email' };
  if (prospect.status === 'unsubscribed' || prospect.status === 'joined_whatsapp') {
    return { ok: false, reason: prospect.status };
  }
  return { ok: true };
}

export async function restoreExcludedProspect(
  prospectId: string,
  opts?: RestoreExcludedOptions,
): Promise<AdminActionResult<undefined>> {
  const prospect = await getProspect(prospectId);
  if (!prospect) return { ok: false, error: 'not_found' };
  if (prospect.status !== 'excluded') {
    return { ok: false, error: 'not_excluded' };
  }

  const prevStatus = prospect.status;
  prospect.excludedReason = undefined;

  if (opts?.addManualSource !== false && !prospect.sources.includes('manual')) {
    prospect.sources = [...prospect.sources, 'manual'];
  }
  if (opts?.crimeWebsiteVerified) {
    prospect.crimeWebsiteVerified = true;
  }

  const preferred: FirmProspectStatus =
    opts?.targetStatus ?? (prospect.email?.trim() ? 'ready_to_send' : 'discovered');

  prospect.status = resolveStatusWithQualification(
    { ...prospect, status: 'discovered' },
    preferred,
  );
  prospect.updatedAt = new Date().toISOString();
  await saveProspect(prospect, prevStatus);
  void invalidateOutreachSummaryCache();
  return { ok: true, prospect };
}

export async function manualSendProspect(
  prospectId: string,
  opts?: ManualSendOptions,
): Promise<AdminActionResult<{ subject: string; messageId?: string; dryRun: boolean }>> {
  const prospect = await getProspect(prospectId);
  if (!prospect) return { ok: false, error: 'not_found' };

  const email = prospect.email?.trim();
  if (!email) return { ok: false, error: 'no_email' };

  const step = opts?.step ?? (prospect.sequenceStep === 0 && !prospect.lastEmailAt ? 0 : prospect.sequenceStep);
  const suppressed = await isSuppressed(email);
  const duplicateInitial =
    step === 0 ? await isDuplicateInitialSend(email, prospect.id) : false;
  const eligibility = canManualSendProspect(prospect, suppressed, duplicateInitial);
  if (!eligibility.ok) return { ok: false, error: eligibility.reason ?? 'not_eligible' };

  const dryRun = opts?.dryRun ?? false;

  const result = await sendOutreachEmail({ prospect, step, dryRun });
  if (!result.ok) return { ok: false, error: result.error ?? 'send_failed' };

  if (dryRun) {
    return {
      ok: true,
      prospect,
      data: { subject: result.subject, messageId: result.messageId, dryRun: true },
    };
  }

  if (!isProviderAcceptedMessageId(result.messageId)) {
    return { ok: false, error: 'no_provider_message_id' };
  }

  const date = new Date().toISOString().slice(0, 10);
  try {
    await commitSuccessfulOutreachSend({
      prospect,
      previousStatus: prospect.status,
      email,
      step,
      subject: result.subject,
      messageId: result.messageId!,
      date,
      campaignId: prospect.campaignId,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg };
  }
  void invalidateOutreachSummaryCache();

  return {
    ok: true,
    prospect,
    data: { subject: result.subject, messageId: result.messageId, dryRun: false },
  };
}

export type BulkSendItemResult = {
  prospectId: string;
  ok: boolean;
  error?: string;
  subject?: string;
};

export type BulkSendResult = {
  sent: number;
  skipped: number;
  errors: number;
  results: BulkSendItemResult[];
};

export type BulkExcludeResult = {
  excluded: number;
  skipped: number;
  errors: number;
  results: Array<{ prospectId: string; ok: boolean; error?: string }>;
};

export async function bulkSendProspects(
  prospectIds: string[],
  opts?: { dryRun?: boolean; limit?: number; respectDailyCap?: boolean },
): Promise<BulkSendResult> {
  const dryRun = opts?.dryRun ?? false;
  const respectDailyCap = opts?.respectDailyCap ?? true;
  const date = new Date().toISOString().slice(0, 10);
  const cap = dailySendCap();
  let remaining = respectDailyCap
    ? Math.max(0, cap - (await getDailySendCount(date)))
    : Infinity;
  const maxCount = opts?.limit ?? prospectIds.length;

  const result: BulkSendResult = { sent: 0, skipped: 0, errors: 0, results: [] };
  const emailsSentThisRun = new Set<string>();

  for (const prospectId of prospectIds) {
    if (result.sent >= maxCount) break;
    if (respectDailyCap && remaining <= 0) {
      result.skipped++;
      result.results.push({ prospectId, ok: false, error: 'daily_cap_reached' });
      continue;
    }

    const prospect = await getProspect(prospectId);
    if (!prospect) {
      result.errors++;
      result.results.push({ prospectId, ok: false, error: 'not_found' });
      continue;
    }

    const email = prospect.email?.trim();
    const wouldBeInitial = prospect.sequenceStep === 0 && !prospect.lastEmailAt;
    if (email && wouldBeInitial) {
      const normalizedEmail = normalizeEmail(email);
      if (
        emailsSentThisRun.has(normalizedEmail) ||
        (await isDuplicateInitialSend(email, prospect.id))
      ) {
        await excludeProspectDuplicateEmail(prospect);
        result.skipped++;
        result.results.push({ prospectId, ok: false, error: 'duplicate_email' });
        continue;
      }
    }

    const sendResult = await manualSendProspect(prospectId, { dryRun });
    if (!sendResult.ok) {
      if (
        sendResult.error === 'not_eligible' ||
        sendResult.error === 'no_email' ||
        sendResult.error === 'duplicate_email'
      ) {
        result.skipped++;
      } else {
        result.errors++;
      }
      result.results.push({ prospectId, ok: false, error: sendResult.error });
      continue;
    }

    result.results.push({
      prospectId,
      ok: true,
      subject: sendResult.data?.subject,
    });

    if (!dryRun) {
      result.sent++;
      if (respectDailyCap) {
        remaining--;
      }
    } else {
      result.sent++;
    }
    if (email && wouldBeInitial) {
      emailsSentThisRun.add(normalizeEmail(email));
    }
  }

  if (!dryRun && result.sent > 0) {
    void invalidateOutreachSummaryCache();
  }

  return result;
}

export async function bulkExcludeProspects(
  prospectIds: string[],
  reason?: string,
): Promise<BulkExcludeResult> {
  const result: BulkExcludeResult = { excluded: 0, skipped: 0, errors: 0, results: [] };

  for (const prospectId of prospectIds) {
    const excludeResult = await excludeProspect(prospectId, reason);
    if (!excludeResult.ok) {
      if (excludeResult.error === 'already_excluded') {
        result.skipped++;
      } else {
        result.errors++;
      }
      result.results.push({ prospectId, ok: false, error: excludeResult.error });
      continue;
    }
    result.excluded++;
    result.results.push({ prospectId, ok: true });
  }

  if (result.excluded > 0) {
    void invalidateOutreachSummaryCache();
  }

  return result;
}

export async function excludeProspect(
  prospectId: string,
  reason?: string,
): Promise<AdminActionResult<undefined>> {
  const prospect = await getProspect(prospectId);
  if (!prospect) return { ok: false, error: 'not_found' };
  if (prospect.status === 'excluded') {
    return { ok: false, error: 'already_excluded' };
  }

  const prevStatus = prospect.status;
  prospect.status = 'excluded';
  prospect.excludedReason = reason?.trim() || 'manual_admin_exclude';
  prospect.updatedAt = new Date().toISOString();
  await saveProspect(prospect, prevStatus);
  void invalidateOutreachSummaryCache();
  return { ok: true, prospect };
}

/** Map ready-to-send prospect rows with batched suppression lookup for the admin report. */
export async function queueRowsForProspects(
  prospects: FirmProspect[],
): Promise<OutreachQueueRow[]> {
  const emails = prospects.map((p) => p.email?.trim()).filter(Boolean) as string[];
  const suppressionMap = await getSuppressionsByEmails(emails);

  return prospects.map((p) => {
    const email = p.email?.trim();
    const suppression = email ? suppressionMap.get(email.toLowerCase()) : undefined;
    return {
      prospectId: p.id,
      firmName: p.firmName,
      prospectType: p.prospectType,
      contactName: p.contactName,
      county: p.county,
      email: p.email,
      sources: p.sources,
      priorityScore: computeProspectPriority(p),
      crimeWebsiteVerified: p.crimeWebsiteVerified,
      updatedAt: p.updatedAt,
      suppressed: Boolean(suppression),
      suppressionReason: suppression?.reason,
    };
  });
}

/** Map excluded prospect rows with batched suppression lookup for the admin report. */
export async function excludedRowsForProspects(
  prospects: FirmProspect[],
): Promise<OutreachExcludedRow[]> {
  const emails = prospects.map((p) => p.email?.trim()).filter(Boolean) as string[];
  const suppressionMap = await getSuppressionsByEmails(emails);

  return prospects.map((p) => {
    const email = p.email?.trim();
    const suppression = email ? suppressionMap.get(email.toLowerCase()) : undefined;
    return {
      prospectId: p.id,
      firmName: p.firmName,
      prospectType: p.prospectType,
      contactName: p.contactName,
      county: p.county,
      email: p.email,
      excludedReason: p.excludedReason,
      sources: p.sources,
      crimeWebsiteVerified: p.crimeWebsiteVerified,
      updatedAt: p.updatedAt,
      suppressed: Boolean(suppression),
      suppressionReason: suppression?.reason,
    };
  });
}
