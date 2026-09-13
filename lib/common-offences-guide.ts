/**
 * Common offences reference for police station representatives.
 *
 * Case citations are imported from lib/case-law-registry.ts only.
 * Do not add free-text case citations here — register and verify first.
 *
 * Sentencing guideline and legislation URLs must be live-verified (HTTP 200)
 * on sentencingcouncil.org.uk / legislation.gov.uk before adding entries.
 */

import { caseRefsByIds, toCaseLawRef, getVerifiedCase } from '@/lib/case-law-registry';

export interface CaseLawRef {
  citation: string;
  name: string;
  holding: string;
  url?: string;
}

export interface OffenceGuideEntry {
  id: string;
  title: string;
  statute: string;
  legislationUrl: string;
  triable: string;
  maxPenalty: string;
  sentencingGuidelineUrl: string;
  sentencingNote: string;
  actusReus: string[];
  mensRea: string[];
  keyCases: CaseLawRef[];
  commonDefences: string[];
  stationNotes: string;
}

export interface DefenceGuideEntry {
  id: string;
  title: string;
  summary: string;
  keyCases: CaseLawRef[];
  stationNotes: string;
}

export const CRIMINAL_LAW_PRINCIPLES = {
  actusReus:
    'The prohibited conduct — what the defendant did or failed to do. For most offences this must be voluntary (see automatism). Causation may be required where the charge includes a result (e.g. "occasioning" ABH).',
  mensRea:
    'The mental element — what the prosecution must prove about the defendant\'s state of mind. This varies by offence: intention, recklessness (subjective foresight of risk), knowledge, or dishonesty. Some offences are strict-liability as to part of the actus reus (e.g. simple possession in certain drug cases).',
  burdenOfProof: {
    text: 'The prosecution must prove every element of the offence beyond reasonable doubt. The defendant bears no burden to prove innocence.',
    case: toCaseLawRef(getVerifiedCase('woolmington-v-dpp')!),
  },
};

export const GENERAL_DEFENCES: DefenceGuideEntry[] = [
  {
    id: 'self-defence',
    title: 'Self-defence and prevention of crime',
    summary:
      'A person may use reasonable force to defend themselves or another, or to prevent crime (Criminal Justice and Immigration Act 2008, s.76). The force used must be reasonable in the circumstances as the defendant honestly believed them to be (even if mistaken). Excessive force is not a complete defence.',
    keyCases: caseRefsByIds(['palmer', 'gladstone-williams']),
    stationNotes:
      'Take detailed instructions on what the client perceived (threat, weapon, size of attacker, escape routes). The police account and CCTV may differ — your client\'s honest belief is the starting point for advice.',
  },
  {
    id: 'intoxication',
    title: 'Intoxication',
    summary:
      'Voluntary intoxication is not a defence to basic-intent offences but may negate specific intent for offences requiring purpose/intent (e.g. s.18 GBH). Involuntary intoxication may support a denial of mens rea where the defendant lacked capacity to form the required mental element.',
    keyCases: caseRefsByIds(['majewski']),
    stationNotes:
      'Establish what the client consumed, when, and whether any medication or spiking may make intoxication involuntary. Intoxication rarely helps on common assault or s.47; it may matter for s.18 or dishonesty-based offences.',
  },
  {
    id: 'duress',
    title: 'Duress and duress of circumstances',
    summary:
      'Duress (by threats) and duress of circumstances can excuse offences where the defendant reasonably believed death or serious injury would follow if they did not comply, and a person of reasonable firmness would have acted similarly. Not available for murder.',
    keyCases: caseRefsByIds(['hasan']),
    stationNotes:
      'Take full instructions on threats, who made them, and whether the client had realistic alternatives (including going to the police).',
  },
  {
    id: 'insanity-automatism',
    title: 'Insanity and automatism',
    summary:
      'Insanity (M\'Naghten rules) applies where a defect of reason from disease of the mind caused the defendant not to know the nature of the act or that it was wrong. Automatism covers involuntary acts where there is no voluntary act.',
    keyCases: [],
    stationNotes:
      'If mental health, learning disability, or a medical episode is raised, explore whether capacity to form mens rea is in issue and whether an appropriate adult should have been present.',
  },
  {
    id: 'consent',
    title: 'Consent',
    summary:
      'Consent is a defence to common assault/battery where the contact is within the ordinary scope of everyday life or falls within recognised exceptions (sport, surgery, etc.). Consent is not a defence to ABH or GBH unless a recognised exception applies.',
    keyCases: caseRefsByIds(['brown', 'collins-v-wilcock']),
    stationNotes:
      'Consent arguments arise in pub fights, sport, and medical/procedure contexts. Clarify whether the client says they were attacked first or that contact was agreed.',
  },
];

export const COMMON_OFFENCES: OffenceGuideEntry[] = [
  {
    id: 'common-assault',
    title: 'Common assault and battery',
    statute: 'Criminal Justice Act 1988, s.39 (common assault); battery at common law',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1988/33/section/39',
    triable: 'Summary only',
    maxPenalty: '6 months\' custody (s.39); higher maxima for racially/religiously aggravated variants and assault on an emergency worker under separate statutes',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/common-assault-racially-or-religiously-aggravated-common-assault-battery-common-assault-on-emergency-worker/',
    sentencingNote:
      'Sentencing Council definitive guideline effective 1 July 2021. Category by culpability and harm; offence range for basic common assault: discharge to 26 weeks\' custody.',
    actusReus: [
      'Assault: cause the victim to apprehend immediate unlawful personal violence (threat only — no touch required).',
      'Battery: intentional or reckless application of unlawful force to another (even slight — e.g. spitting, grabbing).',
      'Force must be unlawful — lawful authority or valid consent negates the actus reus.',
    ],
    mensRea: [
      'Intention to cause apprehension of immediate violence (assault), or intention/recklessness as to applying force (battery).',
      'Recklessness means the defendant foresaw the risk and went ahead anyway (subjective test).',
    ],
    keyCases: caseRefsByIds(['fagan-v-mpc', 'collins-v-wilcock', 'r-v-venna']),
    commonDefences: ['Self-defence (s.76 CJIA 2008)', 'Consent (within lawful bounds)', 'Prevention of crime', 'Lawful arrest/resistance issues'],
    stationNotes:
      'Very common at custody. Check CCTV/BWV, whether a weapon is alleged, and whether emergency-worker or racial/religious aggravation is in play (different maxima). Spitting at someone is battery even without injury.',
  },
  {
    id: 'assault-emergency-worker',
    title: 'Assault on an emergency worker',
    statute: 'Assaults on Emergency Workers (Offences) Act 2018, s.1',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/2018/23/section/1',
    triable: 'Either way',
    maxPenalty: '2 years\' custody (1 year for offences committed before 28 June 2022)',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/common-assault-racially-or-religiously-aggravated-common-assault-battery-common-assault-on-emergency-worker/',
    sentencingNote:
      'Covered in the same Sentencing Council common assault guideline (effective 1 July 2021). Category the basic assault, then apply the emergency-worker uplift at Step 3; maximum 2 years\' custody.',
    actusReus: [
      'Common assault or battery (same actus reus as s.39) against an emergency worker acting in the exercise of functions as such a worker.',
      '"Emergency worker" includes police, fire, ambulance, NHS workers and others defined in the Act (and Sentencing Code s.68).',
    ],
    mensRea: [
      'Same mens rea as common assault/battery (intention or recklessness as to the assault/battery).',
      'No separate requirement to know the victim was an emergency worker for the basic offence elements — but status drives charging and sentencing.',
    ],
    keyCases: caseRefsByIds(['fagan-v-mpc', 'collins-v-wilcock', 'r-v-venna']),
    commonDefences: ['Self-defence', 'Deny assault/battery', 'Consent (rare)', 'Challenge whether victim was acting as an emergency worker'],
    stationNotes:
      'Extremely common in custody suites (spitting, kicking, resisting). Confirm whether charged under the 2018 Act or as s.39 / assault PC (Police Act 1996 s.89(1) — check current CPS charging practice). Take instructions on BWV and any struggle during restraint.',
  },
  {
    id: 'abh',
    title: 'Assault occasioning actual bodily harm (ABH)',
    statute: 'Offences Against the Person Act 1861, s.47',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1861/100/section/47',
    triable: 'Either way',
    maxPenalty: '5 years\' custody (7 years if racially/religiously aggravated under Crime and Disorder Act 1998, s.29)',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/assault-occasioning-actual-bodily-harm-racially-or-religiously-aggravated-abh/',
    sentencingNote:
      'Sentencing Council ABH guideline effective 1 July 2021. Offence range for s.47: fine to 4 years\' custody; category by culpability and harm.',
    actusReus: [
      'An assault or battery (see above) that causes actual bodily harm.',
      'ABH means more than trivial or transient harm — bruising, cuts, lost teeth, recognisable psychiatric injury (not mere fear/distress).',
      'Causation: the assault must have caused the harm (operating and substantial cause).',
    ],
    mensRea: [
      'Same mens rea as for the underlying assault or battery only — no need to intend or foresee ABH.',
      'If the prosecution proves intentional/reckless assault and ABH resulted, s.47 is made out.',
    ],
    keyCases: caseRefsByIds(['savage-parmenter', 'chan-fook', 'donovan']),
    commonDefences: ['Deny assault/battery', 'Self-defence', 'Causation break (novus actus)', 'Consent (rare for ABH — see R v Brown)'],
    stationNotes:
      'Police often charge s.47 where there are visible injuries. Ask for medical records/photos and whether the client admits any contact. Consider whether s.39 would suffice on the facts (charging standard).',
  },
  {
    id: 'gbh-s20',
    title: 'Unlawful wounding / inflicting GBH (s.20)',
    statute: 'Offences Against the Person Act 1861, s.20',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1861/100/section/20',
    triable: 'Either way',
    maxPenalty: '5 years\' custody (7 years if racially/religiously aggravated)',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/inflicting-grievous-bodily-harm-unlawful-wounding-racially-or-religiously-aggravated-gbh-unlawful-wounding/',
    sentencingNote:
      'Sentencing Council s.20 guideline effective 1 July 2021. Offence range: community order to 4 years 6 months\' custody; separate Step 3 uplift for racial/religious aggravation.',
    actusReus: [
      'Wound: break in the continuity of the whole skin (both layers); or inflict/cause grievous bodily harm.',
      'GBH means really serious harm — includes serious psychiatric injury and serious permanent disability.',
    ],
    mensRea: [
      'Intention or recklessness as to causing some physical harm — need not be GBH-level harm.',
      '"Maliciously" requires subjective foresight of some harm (Cunningham recklessness), not Caldwell recklessness.',
    ],
    keyCases: caseRefsByIds(['savage-parmenter', 'cunningham']),
    commonDefences: ['Deny causation', 'Self-defence', 'No foresight/intent for any harm (accident)', 'Intoxication (limited — basic intent)'],
    stationNotes:
      'Distinguish from s.18 — s.20 does not require intent to cause GBH. Knife/glass cases often charged s.18; explore whether instructions support only recklessness as to minor harm.',
  },
  {
    id: 'gbh-s18',
    title: 'Wounding / GBH with intent (s.18)',
    statute: 'Offences Against the Person Act 1861, s.18',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1861/100/section/18',
    triable: 'Indictable only',
    maxPenalty: 'Life imprisonment',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/causing-grievous-bodily-harm-with-intent-to-do-grievous-bodily-harm-wounding-with-intent-to-do-gbh/',
    sentencingNote:
      'Sentencing Council s.18 guideline effective 1 July 2021. Offence range: 2–16 years\' custody; starting points commonly 3–12 years depending on harm/culpability category.',
    actusReus: [
      'Wound or cause grievous bodily harm (as for s.20).',
    ],
    mensRea: [
      'Specific intent: intention to cause GBH, or intention to resist/prevent lawful arrest and GBH results.',
      'Recklessness is not enough for the main limb — the prosecution must prove purpose to cause really serious harm.',
    ],
    keyCases: caseRefsByIds(['savage-parmenter']),
    commonDefences: ['Deny intent for GBH (only s.20 if recklessness as to some harm)', 'Self-defence', 'Deny identification', 'Voluntary intoxication may negate specific intent if supported by facts'],
    stationNotes:
      'Indictable-only — client will appear in Crown Court if charged. Focus instructions on whether any weapon use was aimed at causing really serious injury or merely to scare/escape.',
  },
  {
    id: 'threats-to-kill',
    title: 'Threats to kill',
    statute: 'Offences Against the Person Act 1861, s.16',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1861/100/section/16',
    triable: 'Either way',
    maxPenalty: '10 years\' custody',
    sentencingGuidelineUrl: 'https://www.sentencingcouncil.org.uk/guidelines/threats-to-kill/',
    sentencingNote:
      'Sentencing Council guideline effective 1 October 2018. Offence range: community order to 7 years\' custody.',
    actusReus: [
      'Make a threat to kill another person.',
      'Threat may be words, writing, or conduct conveying an intention to kill.',
    ],
    mensRea: [
      'Intention that the person to whom the threat is made would fear it would be carried out.',
    ],
    keyCases: [],
    commonDefences: ['No threat to kill (venting / hyperbole)', 'No intention that the hearer would fear it would be carried out', 'Deny making the words/conduct', 'Context of self-defence / heated dispute'],
    stationNotes:
      'Often arises in domestic and custody contexts (\"I\'ll kill you\"). Capture exact words, audience, and whether said in heat. Check for linked restraining-order / harassment issues.',
  },
  {
    id: 'theft',
    title: 'Theft',
    statute: 'Theft Act 1968, s.1',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1968/60/section/1',
    triable: 'Either way (most general theft)',
    maxPenalty: '7 years\' custody (s.1)',
    sentencingGuidelineUrl: 'https://www.sentencingcouncil.org.uk/guidelines/theft-general/',
    sentencingNote:
      'Sentencing Council \"Theft — general\" guideline effective 1 February 2016 (offence range discharge to 6 years). Separate guideline exists for theft from a shop or stall.',
    actusReus: [
      'Dishonest appropriation of property belonging to another.',
      'Appropriation: any assumption of the rights of an owner (including where the owner consented if obtained by deception).',
      'Property: money, goods, land, things in action, etc. (s.4).',
    ],
    mensRea: [
      'Dishonesty (Ivey test): (1) ascertain the defendant\'s actual belief about the facts; (2) was the conduct dishonest by the objective standards of ordinary decent people?',
      'Intention to permanently deprive (or treat as own to dispose of) — borrowing may suffice if for the period and in circumstances making it equivalent to an outright taking (s.6).',
    ],
    keyCases: caseRefsByIds(['ivey', 'gomez', 'lloyd']),
    commonDefences: ['Honest belief in legal right', 'Honest belief owner would consent', 'No intention to permanently deprive', 'No dishonesty on Ivey test'],
    stationNotes:
      'Check value, whether shop/theft-from-person sub-categories apply, and any CCTV. "I was going to pay" / "I thought it was mine" goes to dishonesty and permanent deprivation — take clear instructions.',
  },
  {
    id: 'burglary',
    title: 'Burglary',
    statute: 'Theft Act 1968, s.9',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1968/60/section/9',
    triable: 'Either way (with limited indictable-only dwelling cases — check current triability)',
    maxPenalty: '14 years\' custody (dwelling); 10 years (other buildings)',
    sentencingGuidelineUrl: 'https://www.sentencingcouncil.org.uk/guidelines/domestic-burglary/',
    sentencingNote:
      'Revised domestic burglary guideline effective 1 July 2022 (offence range community order to 6 years). Separate non-domestic burglary guideline also exists. Third domestic burglary may trigger minimum sentencing provisions.',
    actusReus: [
      'Enter any building or part of a building as a trespasser.',
      'With intent to steal, inflict GBH, or do unlawful damage (s.9(1)(a)); OR having entered as trespasser, steal/attempt GBH/unlawful damage (s.9(1)(b)).',
      'Building includes inhabited vehicles/vessels (s.9(4)).',
    ],
    mensRea: [
      'Knowledge or recklessness as to trespass at time of entry.',
      'For s.9(1)(a): intent at time of entry; for s.9(1)(b): mens rea for the ulterior offence when inside.',
    ],
    keyCases: caseRefsByIds(['walkington', 'collins-burglary']),
    commonDefences: ['No trespass (permission to enter)', 'No intent for ulterior offence (s.9(1)(a))', 'Deny entry / identification', 'Inside building but not as trespasser'],
    stationNotes:
      'Establish whether dwelling/non-dwelling, time of day, occupants present, and value of goods. Distinction from simple theft — trespass element is key.',
  },
  {
    id: 'robbery',
    title: 'Robbery',
    statute: 'Theft Act 1968, s.8',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1968/60/section/8',
    triable: 'Indictable only',
    maxPenalty: 'Life imprisonment',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/robbery-street-and-less-sophisticated-commercial/',
    sentencingNote:
      'Street and less sophisticated commercial robbery guideline effective 1 April 2016 (offence range community order to 12 years). Separate guidelines cover dwelling and professionally planned commercial robbery.',
    actusReus: [
      'Theft (s.1) plus force or threat of force immediately before or at time of doing so, or immediately after to secure the stolen goods.',
      'Force need not be substantial — a push or snatch with force can suffice.',
    ],
    mensRea: [
      'Mens rea for theft (dishonesty + intention to permanently deprive) plus intention to use force or recklessness as to whether force would be used.',
    ],
    keyCases: caseRefsByIds(['gomez']),
    commonDefences: ['Deny theft (honest belief, no appropriation)', 'No force or threat of force', 'Deny identification', 'Duress (rare)'],
    stationNotes:
      'Often charged where mugging or shop theft involves a struggle. Clarify sequence: was property taken first, then force used to escape? That may still be robbery if force was to retain goods.',
  },
  {
    id: 'handling-stolen-goods',
    title: 'Handling stolen goods',
    statute: 'Theft Act 1968, s.22',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1968/60/section/22',
    triable: 'Either way',
    maxPenalty: '14 years\' custody',
    sentencingGuidelineUrl: 'https://www.sentencingcouncil.org.uk/guidelines/handling-stolen-goods/',
    sentencingNote:
      'Sentencing Council guideline effective 1 February 2016. Offence range: discharge to 8 years\' custody.',
    actusReus: [
      'Otherwise than in the course of stealing, receive, retain, remove, dispose of or realise stolen goods (or arrange to do so), knowing or believing them to be stolen.',
    ],
    mensRea: [
      'Knowledge or belief that the goods are stolen.',
      'Dishonesty.',
    ],
    keyCases: caseRefsByIds(['ivey']),
    commonDefences: ['No knowledge/belief goods stolen', 'Not dishonest', 'Goods not stolen (or no longer stolen)', 'Innocent receipt / returning to owner'],
    stationNotes:
      'Common with phone/bike/car-parts markets and \"mates\' rates\" deals. Probe how the client came by the goods, price paid, and any messages. Distinguish from theft of the same goods.',
  },
  {
    id: 'going-equipped',
    title: 'Going equipped for theft or burglary',
    statute: 'Theft Act 1968, s.25',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1968/60/section/25',
    triable: 'Either way',
    maxPenalty: '3 years\' custody',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/going-equipped-for-theft-or-burglary/',
    sentencingNote:
      'Sentencing Council guideline effective 1 February 2016. Offence range: discharge to 18 months\' custody.',
    actusReus: [
      'Not at place of abode, have with them any article for use in the course of or in connection with any burglary or theft.',
    ],
    mensRea: [
      'Intention that the article be used in the course of or in connection with burglary or theft (proof may be inferred from circumstances).',
    ],
    keyCases: [],
    commonDefences: ['Article for innocent purpose', 'At place of abode', 'No intention for use in burglary/theft', 'Deny possession of the article'],
    stationNotes:
      'Crowbars, gloves, torches, and \"theft kits\" in vehicles are classic. Take instructions on why each item was carried and any work/hobby explanation.',
  },
  {
    id: 'making-off-without-payment',
    title: 'Making off without payment',
    statute: 'Theft Act 1978, s.3',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1978/31/section/3',
    triable: 'Either way',
    maxPenalty: '2 years\' custody',
    sentencingGuidelineUrl: 'https://www.sentencingcouncil.org.uk/guidelines/making-off-without-payment/',
    sentencingNote:
      'Sentencing Council guideline effective 1 February 2016. Offence range: discharge to 36 weeks\' custody.',
    actusReus: [
      'Knowing that payment on the spot for goods or services is required or expected, make off without having paid as required/expected.',
    ],
    mensRea: [
      'Dishonesty.',
      'Intent to avoid payment of the amount due.',
    ],
    keyCases: caseRefsByIds(['ivey']),
    commonDefences: ['Honest belief payment arranged / would be paid', 'No knowledge payment required on the spot', 'Not dishonest', 'Did not make off'],
    stationNotes:
      'Taxi, fuel, restaurant, and hotel \"bilking\" cases. Check whether client left details, disputed the fare, or expected to pay later — goes to dishonesty and intent.',
  },
  {
    id: 'twoc',
    title: 'Taking a vehicle without consent (TWOC)',
    statute: 'Theft Act 1968, s.12',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1968/60/section/12',
    triable: 'Summary only',
    maxPenalty: 'Unlimited fine and/or 6 months\' custody',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/vehicle-taking-without-consent-revised-2017/',
    sentencingNote:
      'Magistrates\' guideline (revised 2017) effective 24 April 2017. Offence range: Band B fine to 26 weeks\' custody; consider disqualification.',
    actusReus: [
      'Take a conveyance (other than a pedal cycle) for one\'s own or another\'s use without the owner\'s consent or other lawful authority; or, knowing it has been taken without authority, drive it or allow oneself to be carried.',
    ],
    mensRea: [
      'Knowledge that the conveyance was taken without consent/authority (for driving/being carried limb).',
      'No intention to permanently deprive is required (that would be theft).',
    ],
    keyCases: [],
    commonDefences: ['Owner consented / believed owner would consent', 'Lawful authority', 'Did not take/drive/allow to be carried', 'Thought vehicle was hired/borrowed with permission'],
    stationNotes:
      'Distinguish from theft (permanent deprivation) and from aggravated vehicle taking (s.12A). Ask about damage, injury, or dangerous driving during the taking.',
  },
  {
    id: 'aggravated-vehicle-taking',
    title: 'Aggravated vehicle taking',
    statute: 'Theft Act 1968, s.12A',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1968/60/section/12A',
    triable: 'Either way (summary only if damage not exceeding £5,000 for damage-only variants)',
    maxPenalty: '2 years\' custody for damage/dangerous-driving variants (higher maxima apply where death is caused — check the charged limb)',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/aggravated-vehicle-taking-damage-caused-to-vehicle-or-other-property/',
    sentencingNote:
      'Damage-caused guideline effective 1 April 2025 (summary max 6 months if damage ≤ £5,000; either-way max 2 years). Separate SC guidelines cover dangerous-driving and injury-caused limbs.',
    actusReus: [
      'Commit TWOC (s.12) and, after the taking and before recovery, the vehicle is driven dangerously, injury is caused, or damage is caused to the vehicle or other property (see s.12A limbs).',
    ],
    mensRea: [
      'Mens rea for the underlying taking; additional elements depend on the charged aggravating limb (e.g. damage caused).',
    ],
    keyCases: [],
    commonDefences: ['No TWOC', 'No aggravating event after taking', 'Deny driving / presence', 'Challenge causation of damage/injury'],
    stationNotes:
      'Identify which s.12A limb is charged (damage, injury, dangerous driving). Check dashcam/BWV and whether client was driver or passenger.',
  },
  {
    id: 'criminal-damage',
    title: 'Criminal damage',
    statute: 'Criminal Damage Act 1971, s.1',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1971/48/section/1',
    triable: 'Either way where value exceeds £5,000 (unless endanger life — indictable); lower-value damage usually summary',
    maxPenalty: '10 years\' custody (s.1(1) where value exceeds £5,000); life if endangering life (s.1(2)); lower maxima for damage not exceeding £5,000',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/criminal-damage-other-than-by-fire-value-exceeding-5-000-racially-or-religiously-aggravated-criminal-damage/',
    sentencingNote:
      'Guideline for damage exceeding £5,000 effective 1 October 2019 (offence range discharge to 4 years). Separate guideline covers damage not exceeding £5,000; arson has its own guideline.',
    actusReus: [
      'Destroy or damage property belonging to another (or own property with intent/endangerment as per s.1(2)–(3)).',
      'Damage need not be permanent — temporary impairment can suffice.',
    ],
    mensRea: [
      'Intention or recklessness as to destroying or damaging property.',
      'Recklessness is subjective: did the defendant foresee the risk and take it anyway (R v G)?',
    ],
    keyCases: caseRefsByIds(['r-v-g']),
    commonDefences: ['Lawful excuse (s.5 — e.g. belief owner would consent)', 'Accident (no recklessness)', 'Deny causation', 'Self-defence of property (limited)'],
    stationNotes:
      'Common in domestic, pub, and vehicle cases. £5,000+ value or arson triggers more serious handling. Ask whether client admits damage or only presence.',
  },
  {
    id: 'possession-drugs',
    title: 'Possession of a controlled drug',
    statute: 'Misuse of Drugs Act 1971, s.5(2) (offence of possession; prohibition in s.5(1))',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1971/38/section/5',
    triable: 'Either way (Class A/B); summary for some Class C',
    maxPenalty: '7 years\' custody (Class A); 5 years (Class B); 2 years (Class C) — maxima vary by class',
    sentencingGuidelineUrl: 'https://www.sentencingcouncil.org.uk/guidelines/possession-of-a-controlled-drug/',
    sentencingNote:
      'Drug offences possession guideline effective 1 April 2021. Typical ranges: Class A fine to 51 weeks; Class B discharge to 26 weeks; Class C discharge to medium community order.',
    actusReus: [
      'Possession of a substance controlled under the Act.',
      'Possession = custody or control — need not be on person (e.g. in home, car).',
    ],
    mensRea: [
      'Knowledge of possession of some substance (not necessarily knowledge of exact drug or quantity in all circumstances).',
      'In vehicle/house cases, knowledge/control must be linked to the defendant — mere proximity may not suffice.',
    ],
    keyCases: caseRefsByIds(['warner', 'kennedy-no-2']),
    commonDefences: ['No knowledge of possession', 'Drugs belong to another / planted', 'Not in custody or control', 'Lawful prescription (specific substances)'],
    stationNotes:
      'Confirm drug class, weight, and whether PWITS charged. Text messages, scales, and multiple wraps point to supply. "Joint enterprise" / holding for friend needs careful instructions.',
  },
  {
    id: 'pwits',
    title: 'Possession with intent to supply (controlled drug)',
    statute: 'Misuse of Drugs Act 1971, s.5(3) (PWITS); supply/offer to supply under s.4(3)',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1971/38/section/5',
    triable: 'Either way (indictable only if third drug-trafficking minimum sentence under Sentencing Code s.313 may apply)',
    maxPenalty: 'Life (Class A); 14 years and/or unlimited fine (Class B/C)',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/supplying-or-offering-to-supply-a-controlled-drug-possession-of-a-controlled-drug-with-intent-to-supply-it-to-another/',
    sentencingNote:
      'Supply/PWITS guideline effective 1 April 2021. Category by role (leading/significant/lesser) and harm (quantity/purity indicators). Statutory minimum sentencing provisions may apply.',
    actusReus: [
      'Possession of a controlled drug (as for simple possession) with intent to supply it to another; or supplying / offering to supply (s.4(3)).',
    ],
    mensRea: [
      'Knowledge of possession plus intent to supply to another (social supply still counts).',
    ],
    keyCases: caseRefsByIds(['warner']),
    commonDefences: ['Simple possession only (no intent to supply)', 'No knowledge of possession', 'Holding exclusively for own use', 'Challenge quantity/role indicators'],
    stationNotes:
      'Messages, scales, deal lists, multiple bags, and cash are classic PWITS indicators. \"Holding for a friend\" is still supply intent — take precise instructions.',
  },
  {
    id: 'bladed-article',
    title: 'Possession of a bladed article / offensive weapon in public',
    statute: 'Criminal Justice Act 1988, s.139 (bladed/pointed article); Prevention of Crime Act 1953, s.1 (offensive weapon) — related',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1988/33/section/139',
    triable: 'Either way',
    maxPenalty: '4 years\' custody (subject to statutory minimum sentencing provisions in many cases)',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/bladed-articles-and-offensive-weapons-having-in-a-public-place/',
    sentencingNote:
      'Sentencing Council guideline effective 1 June 2018. Offence range: fine to 2 years 6 months\' custody. Minimum sentencing provisions often apply — check Step 3 of the guideline.',
    actusReus: [
      'Have with them in a public place any article which has a blade or is sharply pointed (except a folding pocketknife with cutting edge 3 inches or less), without good reason / lawful authority.',
      'Offensive weapon (PCA 1953): any article made, adapted, or intended for causing injury, possessed in a public place.',
    ],
    mensRea: [
      'Knowledge of possession of the article.',
      'For offensive weapon \"intended\" limb: intention to use for causing injury.',
    ],
    keyCases: [],
    commonDefences: ['Good reason / lawful authority (work, religion, legitimate recreational)', 'Not a public place', 'Folding pocketknife within exception', 'No knowledge of possession'],
    stationNotes:
      '\"Good reason\" is critical — work tools, fishing, religious ceremonial use. Photograph the item and measure blade. Warn about minimum sentences and previous \"relevant\" convictions.',
  },
  {
    id: 'public-order',
    title: 'Public order offences (s.4, s.4A, s.5 POA 1986)',
    statute: 'Public Order Act 1986, ss.4, 4A, 5',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1986/64/section/4',
    triable: 's.4/s.4A/s.5 basic offences: summary only; racially/religiously aggravated variants either way',
    maxPenalty:
      'Basic s.4/s.4A: 6 months\' custody; basic s.5: fine only (level 3); racially/religiously aggravated s.4/s.4A: 2 years\' custody (see Crime and Disorder Act 1998, s.31)',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/threatening-behaviour-fear-or-provocation-of-violence-racially-or-religiously-aggravated-threatening-behaviour-fear-or-provocation-of-violence/',
    sentencingNote:
      's.4 guideline effective 1 January 2020 (basic: discharge to 26 weeks). Separate SC guidelines cover s.4A and s.5 (disorderly behaviour). Affray and violent disorder have their own guidelines.',
    actusReus: [
      's.4: use towards another threatening, abusive or insulting words/behaviour with intent to cause fear of immediate unlawful violence, or so as to cause such fear.',
      's.4A: use threatening/abusive/insulting words/behaviour with intent to cause harassment/alarm/distress, or so as to cause HAD.',
      's.5: use threatening/abusive/insulting words/behaviour or disorderly behaviour within hearing/sight of person likely to be caused HAD (no intent required for the result).',
    ],
    mensRea: [
      's.4: intent for first limb; recklessness as to causing fear for second limb.',
      's.4A: intent or recklessness as to causing HAD.',
      's.5: no mens rea as to causing HAD — but must intend/use the words/behaviour (or be reckless for disorderly behaviour).',
    ],
    keyCases: caseRefsByIds(['brutus-cozens']),
    commonDefences: ['Reasonable excuse', 'No threatening/abusive/insulting character', 'Not within sight/hearing of likely victim (s.5)', 'Freedom of expression (Art 10) in context'],
    stationNotes:
      'Often linked to pub/domestic incidents and football. Check BWV for exact words, whether s.5 sufficient vs s.4, and if racial/religious aggravation applies (separate statutes).',
  },
  {
    id: 'affray',
    title: 'Affray',
    statute: 'Public Order Act 1986, s.3',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1986/64/section/3',
    triable: 'Either way',
    maxPenalty: '3 years\' custody',
    sentencingGuidelineUrl: 'https://www.sentencingcouncil.org.uk/guidelines/affray/',
    sentencingNote:
      'Sentencing Council guideline effective 1 January 2020. Offence range: fine to 2 years 9 months\' custody.',
    actusReus: [
      'Use or threaten unlawful violence towards another, and the conduct is such as would cause a person of reasonable firmness present at the scene to fear for their personal safety.',
      'Where two or more persons, consider their conduct together. Threat cannot be made by words alone.',
    ],
    mensRea: [
      'Intend to use or threaten violence, or be aware that conduct may be violent or threaten violence.',
    ],
    keyCases: [],
    commonDefences: ['Self-defence / prevention of crime', 'No unlawful violence or threat', 'Conduct would not cause fear to person of reasonable firmness', 'Deny presence / participation'],
    stationNotes:
      'Often charged for pub fights and street disorder where multiple people are involved. Distinguish from s.4 (directed at a person) and violent disorder (3+ using/threatening violence).',
  },
  {
    id: 'violent-disorder',
    title: 'Violent disorder',
    statute: 'Public Order Act 1986, s.2',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1986/64/section/2',
    triable: 'Either way',
    maxPenalty: '5 years\' custody',
    sentencingGuidelineUrl: 'https://www.sentencingcouncil.org.uk/guidelines/violent-disorder/',
    sentencingNote:
      'Sentencing Council guideline effective 1 January 2020. Offence range: community order to 4 years 6 months\' custody.',
    actusReus: [
      'Three or more persons present together use or threaten unlawful violence, and the conduct of them (taken together) would cause a person of reasonable firmness present to fear for personal safety.',
    ],
    mensRea: [
      'Intend to use or threaten violence, or be aware that conduct may be violent or threaten violence.',
    ],
    keyCases: [],
    commonDefences: ['Fewer than three persons using/threatening violence', 'Self-defence', 'No fear to person of reasonable firmness', 'Deny participation'],
    stationNotes:
      'Requires a group of three. Check how many were actually using/threatening violence versus bystanders. Football and protest contexts are common.',
  },
  {
    id: 'fraud',
    title: 'Fraud by false representation',
    statute: 'Fraud Act 2006, s.1 (by false representation); s.2',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/2006/35/section/2',
    triable: 'Either way (s.1 fraud); indictable-only for some conspiracy/large-scale fraud',
    maxPenalty: '10 years\' custody (s.1)',
    sentencingGuidelineUrl: 'https://www.sentencingcouncil.org.uk/guidelines/fraud/',
    sentencingNote:
      'Sentencing Council fraud guideline effective 1 October 2014. Categorises by culpability and harm (primarily financial loss); offence range for s.1 fraud typically discharge to 8 years.',
    actusReus: [
      'Dishonestly make a false representation (express or implied).',
      'Representation is false if untrue or misleading and the maker knows that or is reckless as to whether it is.',
      'Representation made to a device/system can suffice (s.2(5)).',
    ],
    mensRea: [
      'Dishonesty (Ivey test).',
      'Intent to make a gain for self/another or cause loss to another (or risk of loss).',
    ],
    keyCases: caseRefsByIds(['ivey']),
    commonDefences: ['Honest belief representation true', 'No intent to gain/cause loss', 'Not dishonest on Ivey test', 'Civil dispute not criminal fraud'],
    stationNotes:
      'Increasingly common — benefits, online sales, business disputes. Obtain documents (contracts, messages, bank records) and explore whether it is a civil contract dispute rather than criminal fraud.',
  },
  {
    id: 'harassment-stalking',
    title: 'Harassment / stalking (without fear of violence)',
    statute: 'Protection from Harassment Act 1997, s.2 (harassment); s.2A (stalking)',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1997/40/section/2',
    triable: 'Summary only (basic); racially/religiously aggravated either way',
    maxPenalty: '6 months\' custody (basic); 2 years if racially/religiously aggravated',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/harassment-stalking-racially-or-religiously-aggravated-harassmentstalking/',
    sentencingNote:
      'Sentencing Council guideline effective 1 October 2018. Basic offence range: discharge to 26 weeks\' custody.',
    actusReus: [
      'Pursue a course of conduct (at least two occasions) which amounts to harassment of another (s.2), or stalking (s.2A — following, contacting, monitoring, loitering, interfering with property, watching/spying, etc.).',
    ],
    mensRea: [
      'Know or ought to know that the course of conduct amounts to harassment (objective element).',
    ],
    keyCases: [],
    commonDefences: ['Course of conduct for prevention/detection of crime', 'Pursuit under enactment', 'Reasonable in the particular circumstances', 'Deny course of conduct / identification'],
    stationNotes:
      'Domestic and neighbour disputes are common. Map the alleged incidents chronologically. Check for existing restraining / non-molestation orders.',
  },
  {
    id: 'harassment-fear-violence',
    title: 'Harassment / stalking involving fear of violence',
    statute: 'Protection from Harassment Act 1997, s.4 (fear of violence); s.4A (stalking involving fear of violence or serious alarm or distress)',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1997/40/section/4',
    triable: 'Either way',
    maxPenalty: '10 years\' custody',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/harassment-fear-of-violence-stalking-fear-of-violence-or-serious-alarm-or-distress-racially-or-religiously-aggravated-harassment-fear-of-violence-stalking-fear-of-violence-or-serious-alarm-or-distress/',
    sentencingNote:
      'Sentencing Council guideline effective 1 October 2018. Offence range: fine to 8 years\' custody.',
    actusReus: [
      'Course of conduct that causes another to fear on at least two occasions that violence will be used against them (s.4), or stalking causing fear of violence / serious alarm or distress (s.4A).',
    ],
    mensRea: [
      'Know or ought to know that the course of conduct would cause such fear (or serious alarm/distress for s.4A).',
    ],
    keyCases: [],
    commonDefences: ['Did not cause fear of violence', 'Reasonable in the circumstances', 'Prevention/detection of crime', 'Deny course of conduct'],
    stationNotes:
      'Higher stakes than s.2/s.2A. Confirm whether victim feared violence on two occasions. Often overlaps with threats to kill and breach of protective orders.',
  },
  {
    id: 'breach-protective-order',
    title: 'Breach of restraining order / non-molestation order',
    statute:
      'Protection from Harassment Act 1997, s.5A; Family Law Act 1996, s.42A (non-molestation); Sentencing Code, s.363 (restraining orders on conviction)',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1996/27/section/42A',
    triable: 'Either way',
    maxPenalty: '5 years\' custody',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/breach-of-a-protective-order-restraining-and-non-molestation-orders/',
    sentencingNote:
      'Sentencing Council guideline effective 1 October 2018. Offence range: fine to 4 years\' custody (note lower magistrates\' maxima for some restraining-order breaches).',
    actusReus: [
      'Do anything prohibited by a restraining order or non-molestation order without reasonable excuse (exact elements follow the governing statute and order terms).',
    ],
    mensRea: [
      'Knowledge of the order (or circumstances putting the defendant on notice) and intentional conduct amounting to breach — check the charged provision.',
    ],
    keyCases: [],
    commonDefences: ['Reasonable excuse', 'No knowledge of the order', 'Conduct outside the order\'s terms', 'Order not in force / wrongly served'],
    stationNotes:
      'Obtain the order wording. Accidental contact, third-party messages, and \"victim initiated contact\" are frequent instruction themes — still usually a breach if prohibited.',
  },
  {
    id: 'excess-alcohol',
    title: 'Driving / attempting to drive with excess alcohol',
    statute: 'Road Traffic Act 1988, s.5(1)(a)',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1988/52/section/5',
    triable: 'Summary only',
    maxPenalty: 'Unlimited fine and/or 6 months\' custody; obligatory disqualification (minimum 12 months, longer for high readings / repeat offences)',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/excess-alcohol-driveattempt-to-drive-revised-2017/',
    sentencingNote:
      'Magistrates\' guideline (revised 2017) effective 24 April 2017. Offence range: Band B fine to 26 weeks\' custody; sentence and disqualification length track alcohol level bands.',
    actusReus: [
      'Drive or attempt to drive a motor vehicle on a road or other public place after consuming so much alcohol that the proportion in breath, blood or urine exceeds the prescribed limit.',
    ],
    mensRea: [
      'No need to prove knowledge of being over the limit — the offence is committed by driving/attempting to drive over the limit.',
    ],
    keyCases: [],
    commonDefences: ['Not driving / attempting to drive', 'Not a road or public place', 'Challenge specimen reliability / procedure', 'Hip-flask / post-driving consumption (narrow)'],
    stationNotes:
      'Check breath/blood reading, whether high-risk offender thresholds apply, and any procedural points on the MGDD forms. Special reasons arguments need careful evidential basis.',
  },
  {
    id: 'fail-to-provide',
    title: 'Fail to provide specimen for analysis (drive / attempt to drive)',
    statute: 'Road Traffic Act 1988, s.7(6)',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1988/52/section/7',
    triable: 'Summary only',
    maxPenalty: 'Unlimited fine and/or 6 months\' custody; obligatory disqualification',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/fail-to-provide-specimen-for-analysis-driveattempt-to-drive-revised-2017/',
    sentencingNote:
      'Magistrates\' guideline (revised 2017) effective 24 April 2017. Offence range: Band B fine to 26 weeks\' custody. Treated similarly seriously to excess alcohol.',
    actusReus: [
      'Without reasonable excuse, fail to provide a specimen of breath, blood or urine for a laboratory test when required under s.7 in the course of an investigation into whether driving/attempting to drive offences were committed.',
    ],
    mensRea: [
      'The requirement and failure are factual; \"reasonable excuse\" (e.g. medical inability) is the usual battleground rather than a classic mens rea denial.',
    ],
    keyCases: [],
    commonDefences: ['Reasonable excuse (medical / genuine inability)', 'Requirement not lawfully made', 'Not the driver under investigation', 'Procedural defects in the requirement'],
    stationNotes:
      'Medical evidence for asthma, panic, or needle phobia must be specific. Check custody record and MGDD printouts for how the requirement was explained.',
  },
  {
    id: 'careless-driving',
    title: 'Careless driving (drive without due care and attention)',
    statute: 'Road Traffic Act 1988, s.3',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1988/52/section/3',
    triable: 'Summary only',
    maxPenalty: 'Unlimited fine; obligatory endorsement; discretionary disqualification',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/careless-driving-drive-without-due-care-and-attention/',
    sentencingNote:
      'Sentencing Council guideline effective 1 July 2025. Offence range: Band A fine to Band D fine (plus endorsement/disqualification considerations).',
    actusReus: [
      'Drive a mechanically propelled vehicle on a road or other public place without due care and attention, or without reasonable consideration for other road users.',
    ],
    mensRea: [
      'Objective standard: fell below what would be expected of a competent and careful driver — no need to prove subjective foresight of harm.',
    ],
    keyCases: [],
    commonDefences: ['Driving met the competent careful driver standard', 'Sudden emergency / unavoidable accident', 'Mechanical defect without fault', 'Deny identity of driver'],
    stationNotes:
      'Often arises from collisions. Obtain dashcam, witness accounts, and weather/road conditions. Distinguish from dangerous driving (far below standard / obvious danger).',
  },
  {
    id: 'dangerous-driving',
    title: 'Dangerous driving',
    statute: 'Road Traffic Act 1988, s.2 (meaning of dangerous driving: s.2A)',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1988/52/section/2',
    triable: 'Either way',
    maxPenalty: '2 years\' custody; obligatory disqualification (minimum 1 year) with compulsory extended re-test',
    sentencingGuidelineUrl: 'https://www.sentencingcouncil.org.uk/guidelines/dangerous-driving/',
    sentencingNote:
      'Sentencing Council guideline effective 1 July 2023. Offence range: community order to 2 years\' custody; obligatory disqualification minimum 1 year with extended test.',
    actusReus: [
      'Drive a mechanically propelled vehicle dangerously on a road or other public place — driving that falls far below what would be expected of a competent and careful driver, and it would be obvious to such a driver that driving in that way would be dangerous (see s.2A).',
    ],
    mensRea: [
      'Objective dangerousness test (no need to prove the defendant appreciated the danger), though awareness can aggravate sentence.',
    ],
    keyCases: [],
    commonDefences: ['Driving not far below the standard', 'Danger not obvious to a competent careful driver', 'Mechanical defect', 'Emergency / necessity (narrow)'],
    stationNotes:
      'Speed, racing, fleeing police, and prolonged dangerous manoeuvres push culpability up. Check for linked TWOC/aggravated taking.',
  },
  {
    id: 'fail-to-surrender',
    title: 'Failure to surrender to bail',
    statute: 'Bail Act 1976, s.6',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1976/63/section/6',
    triable: 'Either way (as charged)',
    maxPenalty: '3 months\' custody in the magistrates\' court; 12 months\' custody in the Crown Court',
    sentencingGuidelineUrl: 'https://www.sentencingcouncil.org.uk/guidelines/failure-to-surrender-to-bail/',
    sentencingNote:
      'Sentencing Council guideline effective 1 October 2018. Offence range: discharge to 26 weeks\' custody (subject to the court maxima above).',
    actusReus: [
      'Having been released on bail, fail without reasonable cause to surrender to custody at the appointed time/place.',
    ],
    mensRea: [
      'Failure is proved by non-surrender; \"reasonable cause\" is the usual issue (illness, genuine mistake as to date/court, etc.).',
    ],
    keyCases: [],
    commonDefences: ['Reasonable cause for failure to surrender', 'Not given adequate notice of surrender details', 'Already in custody elsewhere', 'Administrative error'],
    stationNotes:
      'Often discovered when the client is arrested on a warrant. Document reasons for missing court immediately. Advise that a later guilty plea to the bail offence is common once facts are clear.',
  },
  {
    id: 'obstruct-police',
    title: 'Obstruct / resist a police constable',
    statute: 'Police Act 1996, s.89(2)',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1996/16/section/89',
    triable: 'Summary only',
    maxPenalty: 'Level 3 fine and/or 1 month\'s custody',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/obstruct-resist-a-police-constable-in-execution-of-duty-revised-2017/',
    sentencingNote:
      'Magistrates\' guideline (revised 2017) effective 24 April 2017. Offence range: conditional discharge to medium-level community order.',
    actusReus: [
      'Resist or wilfully obstruct a constable in the execution of their duty, or a person assisting a constable in the execution of their duty.',
    ],
    mensRea: [
      'Wilful obstruction (deliberate act making it more difficult for the officer to carry out duty) or intentional resistance.',
    ],
    keyCases: [],
    commonDefences: ['Officer not acting in the execution of duty', 'No wilful obstruction', 'Self-defence against excessive force', 'Accident / misunderstanding'],
    stationNotes:
      'Lower-level than assault on emergency worker / assault PC. Often charged for refusing to move, blocking a doorway, or struggling during arrest without a full assault charge. Check BWV carefully.',
  },
];

export const OFFENCES_GUIDE_SOURCES = [
  {
    label: 'Sentencing Council — definitive guidelines index',
    href: 'https://www.sentencingcouncil.org.uk/sentencing-guidelines/',
  },
  {
    label: 'CPS — Offences against the Person (charging standard)',
    href: 'https://www.cps.gov.uk/prosecution-guidance/offences-against-person-incorporating-charging-standard',
  },
  {
    label: 'CPS — Theft Act offences legal guidance',
    href: 'https://www.cps.gov.uk/legal-guidance/theft-act-offences',
  },
  {
    label: 'CPS — Public Order offences legal guidance',
    href: 'https://www.cps.gov.uk/legal-guidance/public-order-offences',
  },
  {
    label: 'CPS — Fraud Act 2006 legal guidance',
    href: 'https://www.cps.gov.uk/legal-guidance/fraud-act-2006-offences',
  },
  {
    label: 'CPS — Misuse of Drugs Act legal guidance',
    href: 'https://www.cps.gov.uk/legal-guidance/misuse-drugs-act-1971-0',
  },
  {
    label: 'CPS — Road traffic drink and drug driving',
    href: 'https://www.cps.gov.uk/prosecution-guidance/road-traffic-drink-and-drug-driving',
  },
  {
    label: 'CPS — Road traffic fatal offences and bad driving',
    href: 'https://www.cps.gov.uk/prosecution-guidance/road-traffic-fatal-offences-and-bad-driving',
  },
  {
    label: 'CPS — Stalking or harassment',
    href: 'https://www.cps.gov.uk/prosecution-guidance/stalking-or-harassment',
  },
  {
    label: 'legislation.gov.uk',
    href: 'https://www.legislation.gov.uk/',
  },
  {
    label: 'BAILII — free UK case law',
    href: 'https://www.bailii.org/',
  },
];
