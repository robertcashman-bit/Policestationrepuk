import crypto from 'crypto';
import { normalizePhoneDigits, toE164Uk } from '@/lib/phone-format';
import { confidenceLevelFromScore, scoreConfidence } from './confidence';
import { hashSourceEvidence } from './hash';
import { describeSafetyFlag, numberSafetyFlags } from './number-safety';
import {
  extractPhonesFromText,
  scorePhoneCandidate,
  type ExtractedPhone,
} from './phone';
import { fetchPageTextFromUrl } from './source-evidence';
import { detectSourceType, extractDomain } from './source-type';
import {
  appendAuditEntry,
  getCustodySuite,
  getFinding,
  getFindingByHash,
  getFindingsForSuite,
  loadAllApprovedNumbers,
  saveApprovedNumber,
  saveFinding,
  invalidateApprovedCache,
} from './storage';
import type { ApprovedCustodyNumber, CustodyNumberFinding } from './types';

export type RecheckOutcome =
  | 'still_present'
  | 'source_missing'
  | 'number_missing'
  | 'conflict'
  | 'skipped_pdf';

export interface ApprovedRecheckStats {
  due: number;
  checked: number;
  stillPresent: number;
  sourceMissing: number;
  numberMissing: number;
  conflicts: number;
  skipped: number;
  failed: number;
  results: { suiteId: string; phoneNumber: string; outcome: RecheckOutcome }[];
}

export function recheckIntervalDays(): number {
  return Math.max(7, Number(process.env.CUSTODY_RECHECK_DAYS ?? 90));
}

function recheckBatchLimit(): number {
  return Math.max(1, Number(process.env.CUSTODY_RECHECK_BATCH_LIMIT ?? 20));
}

export function isDueForRecheck(record: ApprovedCustodyNumber, now = new Date()): boolean {
  if (!record.publicVisible) return false;
  const last = record.lastVerifiedAt || record.approvedAt;
  const ts = Date.parse(last);
  if (!Number.isFinite(ts)) return true;
  return now.getTime() - ts > recheckIntervalDays() * 86_400_000;
}

/** Text contains the approved number (digit-sequence match, format-insensitive). */
export function pageTextContainsNumber(text: string, normalizedPhoneNumber: string): boolean {
  const digits = normalizePhoneDigits(normalizedPhoneNumber).replace(/\D/g, '');
  if (!digits) return false;
  const textDigits = text.replace(/\D/g, '');
  return textDigits.includes(digits) || textDigits.includes(digits.replace(/^0/, ''));
}

async function flagSourceFindingForReview(
  record: ApprovedCustodyNumber,
  note: string,
): Promise<void> {
  const finding = await getFinding(record.sourceFindingId);
  if (!finding) return;
  const now = new Date().toISOString();
  await saveFinding({
    ...finding,
    status: 'needs_review',
    conflictReason: finding.conflictReason ?? 'recheck_failed',
    notes: [`[Recheck ${now.slice(0, 10)}] ${note}`, finding.notes].filter(Boolean).join('\n'),
    updatedAt: now,
  });
}

/**
 * When a source page shows a different custody-context number, open a new
 * finding for human/AI review instead of only flagging the old one.
 */
export async function seedReplacementFindingFromRecheck(
  record: ApprovedCustodyNumber,
  candidate: ExtractedPhone,
): Promise<CustodyNumberFinding | null> {
  const suite = await getCustodySuite(record.custodySuiteId);
  if (!suite) return null;

  const hash = hashSourceEvidence({
    custodySuiteId: record.custodySuiteId,
    normalizedPhoneNumber: candidate.normalized,
    sourceUrl: record.sourceUrl,
    pageSnippet: candidate.context,
  });
  const existing = await getFindingByHash(hash);
  if (existing) {
    if (existing.status === 'rejected' || existing.status === 'stale') {
      const now = new Date().toISOString();
      const reopened: CustodyNumberFinding = {
        ...existing,
        status: 'needs_review',
        conflictReason: 'recheck_page_number_changed',
        notes: [
          `[Recheck ${now.slice(0, 10)}] Reopened — source page now lists this number instead of/alongside ${record.phoneNumber}.`,
          existing.notes,
        ]
          .filter(Boolean)
          .join('\n'),
        updatedAt: now,
        lastChecked: now,
      };
      await saveFinding(reopened);
      return reopened;
    }
    return existing;
  }

  const siblings = await getFindingsForSuite(record.custodySuiteId);
  if (siblings.some((f) => f.normalizedPhoneNumber === candidate.normalized && f.status !== 'rejected')) {
    return null;
  }

  const now = new Date().toISOString();
  const sourceType = detectSourceType(record.sourceUrl);
  const confidenceScore = scoreConfidence({
    sourceType,
    sourceUrl: record.sourceUrl,
    sourceTitle: suite.custodySuiteName,
    pageSnippet: candidate.context,
    matchingSourceCount: 1,
    sameNumberSourceCount: 1,
    isArchiveOnly: sourceType === 'archived',
    hasConflictingNumbers: true,
  });

  const finding: CustodyNumberFinding = {
    id: `cnf_${Date.now().toString(36)}_${crypto.randomBytes(4).toString('hex')}`,
    custodySuiteId: record.custodySuiteId,
    forceName: suite.forceName,
    custodySuiteName: suite.custodySuiteName,
    policeStationName: suite.policeStationName,
    possiblePhoneNumber: candidate.display,
    normalizedPhoneNumber: candidate.normalized,
    e164: toE164Uk(candidate.normalized),
    numberFlags: numberSafetyFlags(candidate.normalized),
    sourceTitle: `Recheck of ${record.sourceUrl}`,
    sourceUrl: record.sourceUrl,
    sourceDomain: extractDomain(record.sourceUrl),
    sourceType,
    pageSnippet: candidate.context,
    classification: 'unknown',
    confidenceScore,
    confidenceLevel: confidenceLevelFromScore(confidenceScore),
    status: 'needs_review',
    dateFound: now,
    lastChecked: now,
    hashOfSourceEvidence: hash,
    notes: `[Recheck ${now.slice(0, 10)}] Seeded from approved-number recheck — page lists ${candidate.display}; previously approved ${record.phoneNumber}.`,
    conflictReason: 'recheck_page_number_changed',
    createdAt: now,
    updatedAt: now,
  };

  await saveFinding(finding);
  return finding;
}

function pickReplacementCandidate(
  text: string,
  record: ApprovedCustodyNumber,
  suiteNames: string[],
  forceName?: string,
): ExtractedPhone | null {
  const approvedNorm = normalizePhoneDigits(record.normalizedPhoneNumber);
  const candidates = extractPhonesFromText(text, 80, forceName).filter(
    (c) => c.normalized !== approvedNorm,
  );
  if (candidates.length === 0) return null;

  const pickOpts = { forceName, suiteNames, minScore: 40 };
  let best: ExtractedPhone | null = null;
  let bestScore = -Infinity;
  for (const phone of candidates) {
    const candidateScore = scorePhoneCandidate(phone.context, pickOpts);
    if (candidateScore > bestScore) {
      bestScore = candidateScore;
      best = phone;
    }
  }
  if (best && bestScore >= 40) return best;
  return candidates[0];
}

/**
 * Re-verify one approved number against its original source page.
 * Never unpublishes or deletes — failures downgrade to `unverified` and
 * reopen the source finding so it appears in the outstanding digest.
 * When the page shows a different custody-context number, seeds a new finding.
 */
export async function recheckApprovedNumber(
  record: ApprovedCustodyNumber,
): Promise<RecheckOutcome> {
  const now = new Date().toISOString();

  if (/\.pdf(\?|#|$)/i.test(record.sourceUrl)) {
    return 'skipped_pdf';
  }

  const text = await fetchPageTextFromUrl(record.sourceUrl);

  if (!text) {
    const updated = appendAuditEntry(
      { ...record, verificationStatus: 'unverified' },
      {
        actor: 'cron:approved-recheck',
        action: 'recheck_source_missing',
        detail: `Source page unreachable: ${record.sourceUrl}`,
      },
    );
    await saveApprovedNumber(updated);
    await flagSourceFindingForReview(record, 'Source page unreachable — number kept published but unverified.');
    return 'source_missing';
  }

  const suite = await getCustodySuite(record.custodySuiteId);
  const suiteNames = suite
    ? [suite.custodySuiteName, suite.policeStationName].filter(Boolean)
    : [];

  if (pageTextContainsNumber(text, record.normalizedPhoneNumber)) {
    // Approved number still on page — also check for a stronger alternative.
    const replacement = pickReplacementCandidate(
      text,
      record,
      suiteNames,
      suite?.forceName,
    );
    if (
      replacement &&
      scorePhoneCandidate(replacement.context, {
        forceName: suite?.forceName,
        suiteNames,
      }) >= 50
    ) {
      const updated = appendAuditEntry(
        { ...record, verificationStatus: 'unverified' },
        {
          actor: 'cron:approved-recheck',
          action: 'recheck_conflict',
          detail: `Approved number still on page, but page also lists stronger custody candidate ${replacement.display}.`,
        },
      );
      await saveApprovedNumber(updated);
      await flagSourceFindingForReview(
        record,
        `Source page still has approved number but also lists ${replacement.display} with custody context.`,
      );
      await seedReplacementFindingFromRecheck(record, replacement);
      return 'conflict';
    }

    const updated = appendAuditEntry(
      { ...record, lastVerifiedAt: now },
      {
        actor: 'cron:approved-recheck',
        action: 'recheck_ok',
        detail: 'Number still present on source page.',
      },
    );
    await saveApprovedNumber(updated);
    return 'still_present';
  }

  // Number gone — check whether the page now shows a different candidate.
  const replacement = pickReplacementCandidate(
    text,
    record,
    suiteNames,
    suite?.forceName,
  );
  const conflict = Boolean(replacement);

  const updated = appendAuditEntry(
    { ...record, verificationStatus: 'unverified' },
    {
      actor: 'cron:approved-recheck',
      action: conflict ? 'recheck_conflict' : 'recheck_number_missing',
      detail: conflict
        ? `Number no longer on page; page now lists ${replacement!.display} — human review required.`
        : 'Number no longer on source page — human review required.',
    },
  );
  await saveApprovedNumber(updated);
  await flagSourceFindingForReview(
    record,
    conflict
      ? `Approved number missing from source; page now shows ${replacement!.display}.`
      : 'Approved number no longer on source page.',
  );
  if (replacement) {
    await seedReplacementFindingFromRecheck(record, replacement);
  }
  return conflict ? 'conflict' : 'number_missing';
}

/**
 * Safety net for already-published data: any publicly visible number in an
 * unsafe range (mobile / premium / emergency / invalid) is downgraded to
 * `unverified` once and its source finding reopened for human review.
 * Nothing is unpublished automatically.
 */
export async function sweepUnsafePublishedNumbers(): Promise<{
  flagged: { suiteId: string; phoneNumber: string; flag: string }[];
}> {
  const approvedMap = await loadAllApprovedNumbers();
  const flagged: { suiteId: string; phoneNumber: string; flag: string }[] = [];

  for (const record of approvedMap.values()) {
    if (!record.publicVisible) continue;
    const flags = numberSafetyFlags(record.normalizedPhoneNumber);
    if (flags.length === 0) continue;
    const alreadyFlagged = record.auditLog?.some((e) => e.action === 'unsafe_number_flagged');
    if (alreadyFlagged) continue;

    const detail = flags.map((f) => describeSafetyFlag(f)).join('; ');
    const updated = appendAuditEntry(
      { ...record, verificationStatus: 'unverified' },
      { actor: 'cron:approved-recheck', action: 'unsafe_number_flagged', detail },
    );
    await saveApprovedNumber(updated);
    await flagSourceFindingForReview(record, `Published number is in an unsafe range: ${detail}`);
    flagged.push({ suiteId: record.custodySuiteId, phoneNumber: record.phoneNumber, flag: flags[0] });
  }

  if (flagged.length > 0) invalidateApprovedCache();
  return { flagged };
}

export async function runApprovedRecheckBatch(opts?: {
  limit?: number;
  now?: Date;
}): Promise<ApprovedRecheckStats> {
  const limit = opts?.limit ?? recheckBatchLimit();
  const now = opts?.now ?? new Date();
  const approvedMap = await loadAllApprovedNumbers();

  const due = [...approvedMap.values()]
    .filter((r) => isDueForRecheck(r, now))
    .sort((a, b) => (a.lastVerifiedAt || a.approvedAt).localeCompare(b.lastVerifiedAt || b.approvedAt));

  const stats: ApprovedRecheckStats = {
    due: due.length,
    checked: 0,
    stillPresent: 0,
    sourceMissing: 0,
    numberMissing: 0,
    conflicts: 0,
    skipped: 0,
    failed: 0,
    results: [],
  };

  for (const record of due.slice(0, limit)) {
    try {
      const outcome = await recheckApprovedNumber(record);
      stats.checked++;
      if (outcome === 'still_present') stats.stillPresent++;
      else if (outcome === 'source_missing') stats.sourceMissing++;
      else if (outcome === 'number_missing') stats.numberMissing++;
      else if (outcome === 'conflict') stats.conflicts++;
      else stats.skipped++;
      stats.results.push({
        suiteId: record.custodySuiteId,
        phoneNumber: record.phoneNumber,
        outcome,
      });
    } catch (err) {
      stats.failed++;
      console.warn('[approved-recheck] failed for', record.custodySuiteId, err);
    }
  }

  if (stats.checked > 0) invalidateApprovedCache();
  return stats;
}
