import OpenAI from 'openai';
import type { PhoneClassification } from './types';
import { hasCustodyWordingNear, hasEnquiryWordingNear } from './phone';

export interface ClassifyInput {
  phoneNumber: string;
  pageSnippet: string;
  sourceTitle: string;
  custodySuiteName: string;
  forceName: string;
}

const VALID: PhoneClassification[] = [
  'direct_custody',
  'direct_station',
  'public_enquiry',
  'switchboard',
  'general_101',
  'solicitor_office',
  'victim_witness',
  'irrelevant',
  'unknown',
];

function nameTokensMatch(hay: string, name: string): boolean {
  const tokens = name
    .toLowerCase()
    .replace(/police station|custody suite/gi, ' ')
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 4);
  if (tokens.length === 0) return false;
  const hit = tokens.filter((t) => hay.includes(t)).length;
  return hit >= Math.min(2, tokens.length) || (tokens[0] != null && hay.includes(tokens[0]));
}

export function ruleBasedClassify(input: ClassifyInput): PhoneClassification {
  const hay = `${input.pageSnippet} ${input.sourceTitle}`.toLowerCase();
  const digits = input.phoneNumber.replace(/\D/g, '');

  if (digits === '101') return 'general_101';
  if (/victim|witness|victim support|witness care/i.test(hay)) return 'victim_witness';
  if (/solicitor|law firm|legal aid|chambers|defence firm/i.test(hay)) return 'solicitor_office';
  if (/switchboard|contact centre|contact center|main line|force headquarters/i.test(hay)) {
    return 'switchboard';
  }

  if (
    hasCustodyWordingNear(input.pageSnippet) &&
    (nameTokensMatch(hay, input.custodySuiteName) ||
      /custody (suite|desk|telephone|phone|contact)/i.test(hay))
  ) {
    return 'direct_custody';
  }

  if (
    hasEnquiryWordingNear(input.pageSnippet) &&
    nameTokensMatch(hay, input.custodySuiteName)
  ) {
    return 'public_enquiry';
  }

  if (
    nameTokensMatch(hay, input.custodySuiteName) &&
    /police station|station (?:telephone|phone|contact)|enquiry office|front counter/i.test(hay)
  ) {
    return 'direct_station';
  }

  return 'unknown';
}

function getClient(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;
  return new OpenAI({ apiKey: key });
}

export async function classifyPhoneNumber(input: ClassifyInput): Promise<PhoneClassification> {
  const fallback = ruleBasedClassify(input);
  const client = getClient();
  if (!client) return fallback;

  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0,
      max_tokens: 30,
      messages: [
        {
          role: 'system',
          content: `Classify UK police phone numbers found on web pages. Reply with exactly one label:
direct_custody, direct_station, public_enquiry, switchboard, general_101, solicitor_office, victim_witness, irrelevant, unknown.
Use direct_custody only when text strongly indicates a custody suite desk line for the named station.
Use direct_station for a station-specific contact number that is not clearly a custody desk.
Use public_enquiry for public enquiry office / front counter lines.
Never invent a number — classify only from the supplied snippet.`,
        },
        {
          role: 'user',
          content: `Force: ${input.forceName}
Custody suite / station: ${input.custodySuiteName}
Number: ${input.phoneNumber}
Source title: ${input.sourceTitle}
Snippet: ${input.pageSnippet}`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim().toLowerCase() as PhoneClassification;
    if (VALID.includes(raw)) return raw;
    return fallback;
  } catch {
    return fallback;
  }
}
