/**
 * Verified force-level contact numbers for UK territorial and specialist forces
 * present in this directory.
 *
 * Sources: police.uk / force contact pages, gov.uk guidance that 101 is the
 * national non-emergency number in the UK. Switchboard and from-abroad lines are
 * recorded only where already corroborated in this project from official pages —
 * never invented from secondary directories alone.
 *
 * Station-specific custody desk lines are rarely published nationally; when a
 * station only shows a force switchboard or legacy international line, we treat
 * the public contact as 101 (or the force non-emergency below).
 */

export interface OfficialForceContact {
  /** Standard UK non-emergency (almost always 101). */
  nonEmergency: string;
  /** Force switchboard / contact centre when published on an official page. */
  switchboard?: string;
  /** Legacy international / from-abroad line (UK callers should use 101 instead). */
  international?: string;
  /** Official publisher or contact URL used as provenance. */
  source: string;
}

/** Normalised force name → official contacts. */
export const OFFICIAL_FORCE_CONTACTS: Record<string, OfficialForceContact> = {
  'Metropolitan Police': {
    nonEmergency: '101',
    switchboard: '020 7230 1212',
    source: 'https://www.met.police.uk/contact/af/contact-us/',
  },
  'City of London Police': {
    nonEmergency: '101',
    switchboard: '020 7601 2222',
    source: 'https://www.cityoflondon.police.uk/contact/',
  },
  'British Transport Police': {
    nonEmergency: '0800 40 50 40',
    switchboard: '0800 40 50 40',
    source: 'https://www.btp.police.uk/contact/',
  },
  'Kent Police': {
    nonEmergency: '101',
    international: '01622 690690',
    source: 'https://www.kent.police.uk/contact/',
  },
  'Thames Valley Police': {
    nonEmergency: '101',
    switchboard: '01865 841148',
    international: '01865 841148',
    source: 'https://www.thamesvalley.police.uk/contact/',
  },
  'Essex Police': {
    nonEmergency: '101',
    switchboard: '0300 333 4444',
    source: 'https://www.essex.police.uk/contact/custody-information',
  },
  'Greater Manchester Police': {
    nonEmergency: '101',
    switchboard: '0161 872 5050',
    source: 'https://www.gmp.police.uk/contact/custody-information',
  },
  'West Midlands Police': {
    nonEmergency: '101',
    switchboard: '0345 113 5000',
    source: 'https://www.west-midlands.police.uk/contact/custody-information',
  },
  'West Yorkshire Police': {
    nonEmergency: '101',
    switchboard: '0113 348 0060',
    source: 'https://www.westyorkshire.police.uk/contact/custody-information',
  },
  'South Wales Police': {
    nonEmergency: '101',
    switchboard: '01656 655555',
    source: 'https://www.south-wales.police.uk/contact/custody-information',
  },
  'Northumbria Police': {
    nonEmergency: '101',
    switchboard: '0191 375 2582',
    source: 'https://www.northumbria.police.uk/contact/custody-information',
  },
  'Merseyside Police': {
    nonEmergency: '101',
    switchboard: '0151 709 6010',
    source: 'https://www.merseyside.police.uk/contact/custody-information',
  },
  'Hampshire Constabulary': {
    nonEmergency: '101',
    switchboard: '01962 841534',
    source: 'https://www.hampshire.police.uk/contact/custody-information',
  },
  'Surrey Police': {
    nonEmergency: '101',
    switchboard: '01483 571212',
    source: 'https://www.surrey.police.uk/contact/custody-information',
  },
  'Sussex Police': {
    nonEmergency: '101',
    switchboard: '101',
    source: 'https://www.sussex.police.uk/contact/custody-information',
  },
  'Lancashire Constabulary': {
    nonEmergency: '101',
    switchboard: '01772 614444',
    source: 'https://www.lancashire.police.uk/contact/custody-information',
  },
  'Nottinghamshire Police': {
    nonEmergency: '101',
    switchboard: '0115 967 0999',
    source: 'https://www.nottinghamshire.police.uk/contact/custody-information',
  },
  'Leicestershire Police': {
    nonEmergency: '101',
    switchboard: '0116 222 2222',
    source: 'https://www.leics.police.uk/contact/custody-information',
  },
  'Staffordshire Police': {
    nonEmergency: '101',
    switchboard: '01782 234234',
    source: 'https://www.staffordshire.police.uk/contact/custody-information',
  },
  'Devon and Cornwall Police': {
    nonEmergency: '101',
    switchboard: '0300 123 1212',
    source: 'https://www.devon-cornwall.police.uk/contact/custody-information',
  },
  'Avon and Somerset Constabulary': {
    nonEmergency: '101',
    switchboard: '101',
    source: 'https://www.avonandsomerset.police.uk/contact/custody-information',
  },
  'Ministry of Defence Police': {
    nonEmergency: '101',
    source: 'https://www.mod.police.uk/',
  },
  'Civil Nuclear Constabulary': {
    nonEmergency: '03303 135400',
    source: 'https://www.gov.uk/government/organisations/civil-nuclear-constabulary',
  },

  // --- Forces present in stations.json; 101 only until official switchboard corroborated ---
  'Bedfordshire Police': {
    nonEmergency: '101',
    source: 'https://www.beds.police.uk/contact/custody-information',
  },
  'Cambridgeshire Constabulary': {
    nonEmergency: '101',
    source: 'https://www.cambs.police.uk/contact/custody-information',
  },
  'Cheshire Constabulary': {
    nonEmergency: '101',
    source: 'https://www.cheshire.police.uk/contact/custody-information',
  },
  'Cleveland Police': {
    nonEmergency: '101',
    source: 'https://www.cleveland.police.uk/contact/custody-information',
  },
  'Cumbria Constabulary': {
    nonEmergency: '101',
    source: 'https://www.cumbria.police.uk/contact/custody-information',
  },
  'Derbyshire Constabulary': {
    nonEmergency: '101',
    source: 'https://www.derbyshire.police.uk/contact/custody-information',
  },
  'Dorset Police': {
    nonEmergency: '101',
    source: 'https://www.dorset.police.uk/contact/custody-information',
  },
  'Durham Constabulary': {
    nonEmergency: '101',
    source: 'https://www.durham.police.uk/contact/custody-information',
  },
  'Dyfed-Powys Police': {
    nonEmergency: '101',
    source: 'https://www.dyfed-powys.police.uk/contact/custody-information',
  },
  'Gloucestershire Constabulary': {
    nonEmergency: '101',
    source: 'https://www.gloucestershire.police.uk/contact/custody-information',
  },
  'Gwent Police': {
    nonEmergency: '101',
    source: 'https://www.gwent.police.uk/contact/',
  },
  'Hertfordshire Constabulary': {
    nonEmergency: '101',
    source: 'https://www.herts.police.uk/contact/custody-information',
  },
  'Humberside Police': {
    nonEmergency: '101',
    source: 'https://www.humberside.police.uk/contact/custody-information',
  },
  'Lincolnshire Police': {
    nonEmergency: '101',
    source: 'https://www.lincs.police.uk/contact/custody-information',
  },
  'Norfolk Constabulary': {
    nonEmergency: '101',
    source: 'https://www.norfolk.police.uk/contact/custody-information',
  },
  'North Wales Police': {
    nonEmergency: '101',
    source: 'https://www.northwales.police.uk/contact/custody-information',
  },
  'North Yorkshire Police': {
    nonEmergency: '101',
    source: 'https://www.northyorkshire.police.uk/contact/custody-information',
  },
  'Northamptonshire Police': {
    nonEmergency: '101',
    source: 'https://www.northants.police.uk/contact/custody-information',
  },
  'South Yorkshire Police': {
    nonEmergency: '101',
    source: 'https://www.southyorkshire.police.uk/contact/custody-information',
  },
  'Suffolk Constabulary': {
    nonEmergency: '101',
    source: 'https://www.suffolk.police.uk/contact/custody-information',
  },
  'Warwickshire Police': {
    nonEmergency: '101',
    source: 'https://www.warwickshire.police.uk/contact/custody-information',
  },
  'West Mercia Police': {
    nonEmergency: '101',
    source: 'https://www.westmercia.police.uk/contact/',
  },
  'Wiltshire Police': {
    nonEmergency: '101',
    source: 'https://www.wiltshire.police.uk/contact/custody-information',
  },
};

/** Forces that use 101 (or force-specific non-101) as the public non-emergency line. */
export function getOfficialContact(forceName: string | undefined): OfficialForceContact | null {
  if (!forceName?.trim()) return null;
  const trimmed = forceName.trim();
  const exact = OFFICIAL_FORCE_CONTACTS[trimmed];
  if (exact) return exact;
  const lower = trimmed.toLowerCase();
  for (const [name, contact] of Object.entries(OFFICIAL_FORCE_CONTACTS)) {
    if (name.toLowerCase() === lower) return contact;
  }
  return null;
}

/** Force names present in the official contact registry (for coverage checks). */
export function listOfficialForceContactNames(): string[] {
  return Object.keys(OFFICIAL_FORCE_CONTACTS);
}

/** Default non-emergency for territorial forces when unknown. */
export const DEFAULT_NON_EMERGENCY = '101';
