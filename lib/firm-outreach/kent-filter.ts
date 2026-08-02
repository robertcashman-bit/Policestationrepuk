import type { RawProspectInput } from './merge-prospects';

const KENT_POSTCODE_PREFIXES = ['TN', 'ME', 'CT', 'DA', 'BR'] as const;

/** Town / locality tokens used when county/postcode were stripped from KV rows. */
const KENT_TOWN_TOKENS = [
  'maidstone',
  'canterbury',
  'ashford',
  'tunbridge wells',
  'tonbridge',
  'dartford',
  'gravesend',
  'sittingbourne',
  'folkestone',
  'dover',
  'margate',
  'ramsgate',
  'chatham',
  'rochester',
  'gillingham',
  'sevenoaks',
  'swanley',
  'whitstable',
  'herne bay',
  'deal',
  'faversham',
  'edenbridge',
  'cranbrook',
  'hythe',
  'broadstairs',
  'sheerness',
  'medway',
  'gravesham',
  'thanet',
  'swale',
  'tonbridge and malling',
] as const;

export function isKentProspectInput(input: {
  county?: string;
  postcode?: string;
  town?: string;
}): boolean {
  const county = (input.county ?? '').trim().toLowerCase();
  if (county.includes('kent') || county.includes('medway')) return true;
  const pc = (input.postcode ?? '').trim().toUpperCase().replace(/\s+/g, '');
  if (pc && KENT_POSTCODE_PREFIXES.some((prefix) => pc.startsWith(prefix))) {
    return true;
  }
  const town = (input.town ?? '').trim().toLowerCase();
  if (town && KENT_TOWN_TOKENS.some((token) => town.includes(token))) {
    return true;
  }
  return false;
}

export function filterKentInputs(inputs: RawProspectInput[]): RawProspectInput[] {
  return inputs.filter(isKentProspectInput);
}
