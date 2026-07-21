import { formatPhoneUk, isPlausibleUkPhoneField, normalizePhoneDigits } from '@/lib/phone-format';
import { classifyUkNumberRange, isAutoPublishableRange } from '@/lib/custody-discovery/number-safety';
import type { ContactTypeCandidate } from './types';

const UK_PHONE_RE = /(?:\+44\s?|0)(?:\d[\s\-().]{0,3}){9,12}\d/g;
const SITE_OWN_RE = /policestationrepuk\.org|policestationreps\.com/i;
const JUNK_RE =
  /solicitor|barrister|legal aid|victim support|witness care|recruitment|media office|press office|fax\b|internal only|staff only|confidential|do not publish/i;
const STATION_CTX_RE =
  /police station|front counter|enquiry office|enquiry desk|public counter|telephone|tel\.|phone|contact|call us|ring/i;
const SWITCHBOARD_RE = /switchboard|force contact|non-emergency|call 101|control room/i;
const CUSTODY_RE = /custody suite|custody desk|custody centre|detainee|solicitor booking/i;
const ABROAD_RE = /from abroad|outside the uk|international callers|calling from overseas/i;

export interface StationPhoneExtraction {
  display: string;
  normalized: string;
  context: string;
  contactType: ContactTypeCandidate;
  contextScore: number;
}

export function classifyStationPhoneContext(context: string): {
  contactType: ContactTypeCandidate;
  score: number;
} {
  const ctx = context.toLowerCase();
  if (SITE_OWN_RE.test(ctx) || JUNK_RE.test(ctx)) {
    return { contactType: 'do_not_publish', score: -100 };
  }
  if (CUSTODY_RE.test(ctx)) {
    return { contactType: 'custody_suite_public', score: 20 };
  }
  if (ABROAD_RE.test(ctx)) {
    return { contactType: 'from_abroad', score: 55 };
  }
  if (SWITCHBOARD_RE.test(ctx) || /\b101\b/.test(ctx)) {
    return { contactType: 'force_switchboard', score: 25 };
  }
  if (/front counter|enquiry office|enquiry desk|public counter/i.test(ctx)) {
    return { contactType: 'front_counter', score: 70 };
  }
  if (STATION_CTX_RE.test(ctx)) {
    return { contactType: 'station_public', score: 60 };
  }
  return { contactType: 'unknown', score: 5 };
}

/** Extract station-relevant UK phones from page text (never invents digits). */
export function extractStationPhonesFromText(text: string, window = 100): StationPhoneExtraction[] {
  if (!text?.trim()) return [];
  const results: StationPhoneExtraction[] = [];
  const seen = new Set<string>();

  for (const match of text.matchAll(UK_PHONE_RE)) {
    const raw = match[0];
    const normalized = normalizePhoneDigits(raw);
    if (!normalized || seen.has(normalized)) continue;
    if (normalized === '101' || normalized === '999' || normalized === '112') continue;
    if (!isPlausibleUkPhoneField(raw)) continue;
    if (!isAutoPublishableRange(raw) && classifyUkNumberRange(raw) === 'mobile') continue;

    const idx = match.index ?? 0;
    const start = Math.max(0, idx - window);
    const end = Math.min(text.length, idx + raw.length + window);
    const context = text.slice(start, end);
    const { contactType, score } = classifyStationPhoneContext(context);
    if (contactType === 'do_not_publish' || score < 0) continue;
    if (contactType === 'custody_suite_public') continue; // custody pipeline owns these

    seen.add(normalized);
    results.push({
      display: formatPhoneUk(raw) || raw.trim(),
      normalized,
      context: context.trim(),
      contactType,
      contextScore: score,
    });
  }

  return results.sort((a, b) => b.contextScore - a.contextScore);
}
