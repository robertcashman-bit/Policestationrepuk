import { normaliseStationName } from '@/lib/custody-station';
import { formatPhoneUk, isPlausibleUkPhoneField, normalizePhoneDigits } from '@/lib/phone-format';
import { isGenericCustodyNumber } from './generic-numbers';
import { classifyUkNumberRange } from './number-safety';

const EMERGENCY_NUMBERS = new Set(['999', '112', '911']);
const UK_PHONE_RE = /(?:\+44\s?|0)(?:\d[\s\-().]{0,3}){9,12}\d/g;

const JUNK_CONTEXT_RE = /solicitor|legal advice|victim|witness support|victim and witness/i;
const SWITCHBOARD_CONTEXT_RE = /switchboard|non-emergency|call 101|general enquiries|main switchboard/i;
const ENQUIRY_CONTEXT_RE =
  /enquiry office|public enquiry|front counter|contact (?:us|number)|telephone(?: number)?|opening times|police station phone/i;

export interface ExtractedPhone {
  display: string;
  normalized: string;
  context: string;
}

export interface PhonePickContext {
  forceName?: string;
  suiteNames?: string[];
  minScore?: number;
}

/** Minimum score for pickBestCustodyCandidatePhone to accept a candidate. */
export const MIN_PHONE_CANDIDATE_SCORE = 10;

/** Reject generic/switchboard/101 and emergency numbers — not direct custody desk lines. */
export function isValidCustodyCandidate(value: string, forceName?: string): boolean {
  const normalized = normalizePhoneDigits(value);
  if (!normalized) return false;
  if (EMERGENCY_NUMBERS.has(normalized)) return false;
  if (isGenericCustodyNumber(value, forceName)) return false;
  return isPlausibleUkPhoneField(value);
}

export function normalizeUkPhone(value: string, forceName?: string): string | null {
  if (!isValidCustodyCandidate(value, forceName)) return null;
  const display = formatPhoneUk(value) || value.trim();
  return display;
}

function suiteNameTokens(names: string[]): string[] {
  const tokens = new Set<string>();
  for (const name of names) {
    for (const t of normaliseStationName(name).split(/\s+/)) {
      if (t.length >= 4) tokens.add(t);
    }
  }
  return [...tokens];
}

/**
 * Score a phone candidate by custody wording, suite name proximity, number range,
 * and junk penalties. Mobiles/premium rarely belong on a station contact line.
 */
export function scorePhoneCandidate(
  context: string,
  opts?: PhonePickContext,
  phoneValue?: string,
): number {
  let score = 0;
  const ctx = context.toLowerCase();
  if (hasCustodyWordingNear(context)) score += 50;
  else if (hasEnquiryWordingNear(context)) score += 25;
  for (const token of suiteNameTokens(opts?.suiteNames ?? [])) {
    if (ctx.includes(token.toLowerCase())) score += 15;
  }
  if (JUNK_CONTEXT_RE.test(context)) score -= 80;
  if (SWITCHBOARD_CONTEXT_RE.test(context)) score -= 40;

  if (phoneValue) {
    const range = classifyUkNumberRange(phoneValue);
    if (range === 'mobile') score -= 80;
    else if (range === 'premium') score -= 100;
    else if (range === 'freephone') score -= 15;
    else if (range === 'geographic' || range === 'non_geographic_03') score += 10;
  }

  return score;
}

/** Extract UK phone numbers from text with surrounding context (skips 101 / switchboard). */
export function extractPhonesFromText(
  text: string,
  window = 80,
  forceName?: string,
): ExtractedPhone[] {
  if (!text?.trim()) return [];
  const results: ExtractedPhone[] = [];
  const seen = new Set<string>();

  for (const match of text.matchAll(UK_PHONE_RE)) {
    const raw = match[0];
    const normalized = normalizePhoneDigits(raw);
    if (!normalized || seen.has(normalized)) continue;
    if (!isValidCustodyCandidate(raw, forceName)) continue;
    seen.add(normalized);

    const start = Math.max(0, (match.index ?? 0) - window);
    const end = Math.min(text.length, (match.index ?? 0) + raw.length + window);
    const context = text.slice(start, end).replace(/\s+/g, ' ').trim();

    const display = normalizeUkPhone(raw, forceName);
    if (!display) continue;
    results.push({ display, normalized, context });
  }
  return results;
}

/** Pick the highest-scoring non-generic number in extracted list. */
export function pickBestCustodyCandidatePhone(
  text: string,
  opts?: PhonePickContext,
): ExtractedPhone | null {
  const phones = extractPhonesFromText(text, 120, opts?.forceName);
  if (phones.length === 0) return null;

  const minScore = opts?.minScore ?? MIN_PHONE_CANDIDATE_SCORE;
  let best: ExtractedPhone | null = null;
  let bestScore = -Infinity;

  for (const phone of phones) {
    const candidateScore = scorePhoneCandidate(phone.context, opts, phone.display);
    if (candidateScore > bestScore) {
      bestScore = candidateScore;
      best = phone;
    }
  }

  if (bestScore < minScore) return null;
  return best;
}

/** @deprecated Use pickBestCustodyCandidatePhone — kept for callers passing forceName only. */
export function pickCustodyCandidatePhone(
  text: string,
  forceName?: string,
): ExtractedPhone | null {
  return pickBestCustodyCandidatePhone(text, { forceName });
}

export function hasCustodyWordingNear(text: string): boolean {
  return /custody|custody suite|custody desk|detention|custody centre|custody center/i.test(text);
}

export function hasEnquiryWordingNear(text: string): boolean {
  return ENQUIRY_CONTEXT_RE.test(text);
}

/** All candidates scoring at/above threshold, best first. */
export function listScoredCustodyCandidatePhones(
  text: string,
  opts?: PhonePickContext,
): Array<ExtractedPhone & { score: number }> {
  const phones = extractPhonesFromText(text, 120, opts?.forceName);
  const minScore = opts?.minScore ?? MIN_PHONE_CANDIDATE_SCORE;
  return phones
    .map((phone) => ({ ...phone, score: scorePhoneCandidate(phone.context, opts, phone.display) }))
    .filter((p) => p.score >= minScore)
    .sort((a, b) => b.score - a.score);
}

export function isCommercialUnrelatedPage(url: string, title: string): boolean {
  const hay = `${url} ${title}`.toLowerCase();
  return /amazon\.|ebay\.|booking\.com|tripadvisor|facebook\.com\/marketplace|gumtree/i.test(hay);
}
