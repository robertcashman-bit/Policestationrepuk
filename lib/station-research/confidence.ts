import type { ContactTypeCandidate, ConfidenceStatus, ResearchEvidence } from './types';
import type { SourceTier } from './force-source-registry';

export interface ConfidenceInput {
  sourceTier: SourceTier[];
  contactType: ContactTypeCandidate;
  contextScore: number;
  stationNameMatched: boolean;
  postcodeMatched: boolean;
  forceMatched: boolean;
  numberValid: boolean;
  conflictingExisting: boolean;
  manuallyLocked: boolean;
  excerptContainsNumber: boolean;
}

export function computeConfidence(input: ConfidenceInput): {
  score: number;
  status: ConfidenceStatus;
} {
  if (input.manuallyLocked) {
    return { score: 0, status: 'MANUALLY_LOCKED' };
  }
  if (input.contactType === 'do_not_publish' || input.contactType === 'unrelated') {
    return { score: 0, status: 'DO_NOT_PUBLISH' };
  }
  if (!input.numberValid || !input.excerptContainsNumber) {
    return { score: 0, status: 'REJECTED' };
  }

  let score = 20;
  const bestTier = Math.min(...input.sourceTier);
  if (bestTier === 1) score += 40;
  else if (bestTier === 2) score += 25;
  else if (bestTier === 3) score += 10;
  else score += 0;

  score += Math.min(25, Math.max(0, input.contextScore / 3));
  if (input.stationNameMatched) score += 15;
  if (input.postcodeMatched) score += 10;
  if (input.forceMatched) score += 5;
  if (input.sourceTier.filter((t) => t <= 2).length >= 2) score += 10;
  if (input.conflictingExisting) score -= 25;

  score = Math.max(0, Math.min(100, Math.round(score)));

  let status: ConfidenceStatus = 'RESEARCH_REQUIRED';
  if (score >= 90 && bestTier === 1 && !input.conflictingExisting) status = 'HIGH_CONFIDENCE';
  else if (score >= 75) status = 'PROVISIONAL';
  else if (input.conflictingExisting) status = 'CONFLICTED';
  else if (score < 40) status = 'REJECTED';

  return { score, status };
}

export function evidenceContainsExactNumber(evidence: ResearchEvidence[], normalized: string): boolean {
  const digits = normalized.replace(/\D/g, '');
  return evidence.some((e) => {
    const excerptDigits = e.excerpt.replace(/\D/g, '');
    return excerptDigits.includes(digits) || e.excerpt.includes(normalized);
  });
}
