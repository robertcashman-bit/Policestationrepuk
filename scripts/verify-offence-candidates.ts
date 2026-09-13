/**
 * Batch-verify candidate offence guidelines + legislation, then emit facts.
 * Run: npx tsx scripts/verify-offence-candidates.ts
 */
import fs from 'fs';

type Candidate = {
  id: string;
  title: string;
  statute: string;
  legislationUrl: string;
  sentencingGuidelineUrl: string;
};

/** Custody-common / accredited-rep relevant candidates not already in COMMON_OFFENCES. */
const CANDIDATES: Candidate[] = [
  {
    id: 'shop-theft',
    title: 'Theft from a shop or stall',
    statute: 'Theft Act 1968, s.1',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1968/60/section/1',
    sentencingGuidelineUrl: 'https://www.sentencingcouncil.org.uk/guidelines/theft-from-a-shop-or-stall/',
  },
  {
    id: 'non-domestic-burglary',
    title: 'Non-domestic burglary',
    statute: 'Theft Act 1968, s.9',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1968/60/section/9',
    sentencingGuidelineUrl: 'https://www.sentencingcouncil.org.uk/guidelines/non-domestic-burglary/',
  },
  {
    id: 'aggravated-burglary',
    title: 'Aggravated burglary',
    statute: 'Theft Act 1968, s.10',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1968/60/section/10',
    sentencingGuidelineUrl: 'https://www.sentencingcouncil.org.uk/guidelines/aggravated-burglary/',
  },
  {
    id: 'abstracting-electricity',
    title: 'Abstracting electricity',
    statute: 'Theft Act 1968, s.13',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1968/60/section/13',
    sentencingGuidelineUrl: 'https://www.sentencingcouncil.org.uk/guidelines/abstracting-electricity/',
  },
  {
    id: 'blackmail',
    title: 'Blackmail',
    statute: 'Theft Act 1968, s.21',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1968/60/section/21',
    sentencingGuidelineUrl: 'https://www.sentencingcouncil.org.uk/guidelines/blackmail/',
  },
  {
    id: 'arson',
    title: 'Arson (criminal damage by fire)',
    statute: 'Criminal Damage Act 1971, s.1(1) and (3)',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1971/48/section/1',
    sentencingGuidelineUrl: 'https://www.sentencingcouncil.org.uk/guidelines/arson-criminal-damage-by-fire/',
  },
  {
    id: 'arson-endanger-life',
    title: 'Arson / criminal damage with intent to endanger life',
    statute: 'Criminal Damage Act 1971, s.1(2) and (3)',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1971/48/section/1',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/arsoncriminal-damage-with-intent-to-endanger-life-or-reckless-as-to-whether-life-endangered/',
  },
  {
    id: 'threats-to-damage',
    title: 'Threats to destroy or damage property',
    statute: 'Criminal Damage Act 1971, s.2',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1971/48/section/2',
    sentencingGuidelineUrl: 'https://www.sentencingcouncil.org.uk/guidelines/threats-to-destroy-or-damage-property/',
  },
  {
    id: 'drug-production',
    title: 'Production of a controlled drug / cultivation of cannabis',
    statute: 'Misuse of Drugs Act 1971, s.4(2) (production); s.6 (cultivation of cannabis)',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1971/38/section/4',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/production-of-a-controlled-drug-cultivation-of-cannabis-plant/',
  },
  {
    id: 'permitting-premises-drugs',
    title: 'Permitting premises to be used for drug offences',
    statute: 'Misuse of Drugs Act 1971, s.8',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1971/38/section/8',
    sentencingGuidelineUrl: 'https://www.sentencingcouncil.org.uk/guidelines/permitting-premises-to-be-used/',
  },
  {
    id: 'drive-whilst-disqualified',
    title: 'Drive whilst disqualified',
    statute: 'Road Traffic Act 1988, s.103',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1988/52/section/103',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/drive-whilst-disqualified-revised-2017/',
  },
  {
    id: 'no-insurance',
    title: 'Using a vehicle without insurance',
    statute: 'Road Traffic Act 1988, s.143',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1988/52/section/143',
    sentencingGuidelineUrl: 'https://www.sentencingcouncil.org.uk/guidelines/no-insurance-revised-2017/',
  },
  {
    id: 'aggravated-vehicle-taking-injury',
    title: 'Aggravated vehicle taking — injury caused',
    statute: 'Theft Act 1968, s.12A(2)(b)',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1968/60/section/12A',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/aggravated-vehicle-taking-injury-caused/',
  },
  {
    id: 'aggravated-vehicle-taking-dangerous',
    title: 'Aggravated vehicle taking — dangerous driving',
    statute: 'Theft Act 1968, s.12A(2)(a)',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1968/60/section/12A',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/aggravated-vehicle-taking-dangerous-driving/',
  },
  {
    id: 'wanton-furious-driving',
    title: 'Causing injury by wanton or furious driving',
    statute: 'Offences Against the Person Act 1861, s.35',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1861/100/section/35',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/causing-injury-by-wanton-or-furious-driving/',
  },
  {
    id: 'assault-resist-arrest',
    title: 'Assault with intent to resist arrest',
    statute: 'Offences Against the Person Act 1861, s.38',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1861/100/section/38',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/assault-with-intent-to-resist-arrest/',
  },
  {
    id: 'strangulation',
    title: 'Strangulation or suffocation',
    statute: 'Serious Crime Act 2015, s.75A',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/2015/9/section/75A',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/strangulation-or-suffocation-racially-or-religiously-aggravated-strangulation-or-suffocation/',
  },
  {
    id: 'controlling-coercive',
    title: 'Controlling or coercive behaviour',
    statute: 'Serious Crime Act 2015, s.76',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/2015/9/section/76',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/controlling-or-coercive-behaviour-in-an-intimate-or-family-relationship/',
  },
  {
    id: 'witness-intimidation',
    title: 'Witness intimidation',
    statute: 'Criminal Justice and Public Order Act 1994, s.51',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1994/33/section/51',
    sentencingGuidelineUrl: 'https://www.sentencingcouncil.org.uk/guidelines/witness-intimidation/',
  },
  {
    id: 'perverting-justice',
    title: 'Perverting the course of justice',
    statute: 'Common law',
    legislationUrl: 'https://www.cps.gov.uk/legal-guidance/public-justice-offences-incorporating-charging-standard',
    sentencingGuidelineUrl: 'https://www.sentencingcouncil.org.uk/guidelines/perverting-the-course-of-justice/',
  },
  {
    id: 'sexual-assault',
    title: 'Sexual assault',
    statute: 'Sexual Offences Act 2003, s.3',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/2003/42/section/3',
    sentencingGuidelineUrl: 'https://www.sentencingcouncil.org.uk/guidelines/sexual-assault/',
  },
  {
    id: 'rape',
    title: 'Rape',
    statute: 'Sexual Offences Act 2003, s.1',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/2003/42/section/1',
    sentencingGuidelineUrl: 'https://www.sentencingcouncil.org.uk/guidelines/rape/',
  },
  {
    id: 'assault-by-penetration',
    title: 'Assault by penetration',
    statute: 'Sexual Offences Act 2003, s.2',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/2003/42/section/2',
    sentencingGuidelineUrl: 'https://www.sentencingcouncil.org.uk/guidelines/assault-by-penetration/',
  },
  {
    id: 'indecent-images',
    title: 'Possession of indecent photographs of children',
    statute: 'Criminal Justice Act 1988, s.160; Protection of Children Act 1978, s.1',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1988/33/section/160',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/possession-of-indecent-photograph-of-child-indecent-photographs-of-children/',
  },
  {
    id: 'exposure',
    title: 'Exposure',
    statute: 'Sexual Offences Act 2003, s.66',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/2003/42/section/66',
    sentencingGuidelineUrl: 'https://www.sentencingcouncil.org.uk/guidelines/exposure/',
  },
  {
    id: 'voyeurism',
    title: 'Voyeurism',
    statute: 'Sexual Offences Act 2003, s.67',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/2003/42/section/67',
    sentencingGuidelineUrl: 'https://www.sentencingcouncil.org.uk/guidelines/voyeurism/',
  },
  {
    id: 'disclose-private-sexual-images',
    title: 'Disclosing or threatening to disclose private sexual images',
    statute: 'Criminal Justice and Courts Act 2015, s.33',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/2015/2/section/33',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/disclosing-or-threatening-to-disclose-private-sexual-images/',
  },
  {
    id: 'sexual-communication-child',
    title: 'Sexual communication with a child',
    statute: 'Sexual Offences Act 2003, s.15A',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/2003/42/section/15A',
    sentencingGuidelineUrl: 'https://www.sentencingcouncil.org.uk/guidelines/sexual-communication-with-a-child/',
  },
  {
    id: 'meeting-child-grooming',
    title: 'Meeting a child following sexual grooming',
    statute: 'Sexual Offences Act 2003, s.15',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/2003/42/section/15',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/meeting-a-child-following-sexual-grooming/',
  },
  {
    id: 'sexual-activity-child',
    title: 'Sexual activity with a child',
    statute: 'Sexual Offences Act 2003, s.9',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/2003/42/section/9',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/sexual-activity-with-a-child-causing-or-inciting-a-child-to-engage-in-sexual-activity/',
  },
  {
    id: 'drunk-disorderly',
    title: 'Drunk and disorderly in a public place',
    statute: 'Criminal Justice Act 1967, s.91',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1967/80/section/91',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/drunk-and-disorderly-in-a-public-place-revised-2017/',
  },
  {
    id: 'riot',
    title: 'Riot',
    statute: 'Public Order Act 1986, s.1',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1986/64/section/1',
    sentencingGuidelineUrl: 'https://www.sentencingcouncil.org.uk/guidelines/riot/',
  },
  {
    id: 'breach-cbo',
    title: 'Breach of a criminal behaviour order',
    statute: 'Anti-social Behaviour, Crime and Policing Act 2014, s.30',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/2014/12/section/30',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/breach-of-a-criminal-behaviour-order/',
  },
  {
    id: 'firearms-public-place',
    title: 'Carrying a firearm in a public place',
    statute: 'Firearms Act 1968, s.19',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1968/27/section/19',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/firearms-carrying-in-a-public-place/',
  },
  {
    id: 'firearms-prohibited-weapon',
    title: 'Possession of a prohibited weapon',
    statute: 'Firearms Act 1968, s.5',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1968/27/section/5',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/firearms-possession-of-prohibited-weapon/',
  },
  {
    id: 'firearms-without-certificate',
    title: 'Possession of a firearm without certificate',
    statute: 'Firearms Act 1968, s.1',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1968/27/section/1',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/firearms-possession-without-certificate/',
  },
  {
    id: 'firearms-intent-fear',
    title: 'Possession of firearm with intent to cause fear of violence',
    statute: 'Firearms Act 1968, s.16A',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1968/27/section/16A',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/firearms-possession-with-intent-to-cause-fear-of-violence/',
  },
  {
    id: 'kidnap-false-imprisonment',
    title: 'Kidnap / false imprisonment',
    statute: 'Common law (kidnap and false imprisonment)',
    legislationUrl: 'https://www.cps.gov.uk/legal-guidance/false-imprisonment-and-kidnapping',
    sentencingGuidelineUrl: 'https://www.sentencingcouncil.org.uk/guidelines/kidnap-false-imprisonment/',
  },
  {
    id: 'money-laundering',
    title: 'Money laundering',
    statute: 'Proceeds of Crime Act 2002, ss.327–329',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/2002/29/section/327',
    sentencingGuidelineUrl: 'https://www.sentencingcouncil.org.uk/guidelines/money-laundering/',
  },
  {
    id: 'cruelty-to-child',
    title: 'Cruelty to a child',
    statute: 'Children and Young Persons Act 1933, s.1',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1933/12/section/1',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/cruelty-to-a-child-assault-and-ill-treatment-abandonment-neglect-and-failure-to-protect/',
  },
  {
    id: 'animal-cruelty',
    title: 'Animal cruelty',
    statute: 'Animal Welfare Act 2006, s.4',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/2006/45/section/4',
    sentencingGuidelineUrl: 'https://www.sentencingcouncil.org.uk/guidelines/animal-cruelty/',
  },
  {
    id: 'dog-dangerously-out-of-control',
    title: 'Dog dangerously out of control causing injury',
    statute: 'Dangerous Dogs Act 1991, s.3',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1991/65/section/3',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/owner-or-person-in-charge-of-a-dog-dangerously-out-of-control-in-any-place-in-england-or-wales-whether-or-not-a-public-place-where-a-person-is-injured/',
  },
  {
    id: 'poa-s4a',
    title: 'Disorderly behaviour with intent to cause harassment, alarm or distress (s.4A)',
    statute: 'Public Order Act 1986, s.4A',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1986/64/section/4A',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/disorderly-behaviour-with-intent-to-cause-harassment-alarm-or-distress-racially-or-religiously-aggravated-disorderly-behaviour-with-intent-to-cause-harassment-alarm-or-distress/',
  },
  {
    id: 'poa-s5',
    title: 'Disorderly behaviour (s.5 POA)',
    statute: 'Public Order Act 1986, s.5',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1986/64/section/5',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/disorderly-behaviour-racially-or-religiously-aggravated-disorderly-behaviour/',
  },
  {
    id: 'racial-hatred',
    title: 'Racial / religious hatred offences',
    statute: 'Public Order Act 1986, Parts 3 and 3A',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1986/64/part/3',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/racial-hatred-offences-hatred-against-persons-on-religious-grounds-or-grounds-of-sexual-orientation/',
  },
  {
    id: 'breach-shpo',
    title: 'Breach of a sexual harm prevention order',
    statute: 'Sexual Offences Act 2003, s.103I',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/2003/42/section/103I',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/breach-of-a-sexual-harm-prevention-order/',
  },
  {
    id: 'fail-notification',
    title: 'Fail to comply with sex offender notification requirements',
    statute: 'Sexual Offences Act 2003, s.91',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/2003/42/section/91',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/fail-to-comply-with-notification-requirements/',
  },
  {
    id: 'psychoactive-produce',
    title: 'Producing a psychoactive substance',
    statute: 'Psychoactive Substances Act 2016, s.4',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/2016/2/section/4',
    sentencingGuidelineUrl: 'https://www.sentencingcouncil.org.uk/guidelines/producing-a-psychoactive-substance/',
  },
  {
    id: 'causing-death-careless',
    title: 'Causing death by careless or inconsiderate driving',
    statute: 'Road Traffic Act 1988, s.2B',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1988/52/section/2B',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/causing-death-by-careless-or-inconsiderate-driving/',
  },
  {
    id: 'causing-serious-injury-careless',
    title: 'Causing serious injury by careless or inconsiderate driving',
    statute: 'Road Traffic Act 1988, s.2C',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1988/52/section/2C',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/causing-serious-injury-by-careless-or-inconsiderate-driving/',
  },
  {
    id: 'drug-driving',
    title: 'Driving with a specified drug above the specified limit',
    statute: 'Road Traffic Act 1988, s.5A',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1988/52/section/5A',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/driving-or-attempting-to-drive-with-a-specified-drug-above-the-specified-limit/',
  },
  {
    id: 'unfit-drink-drugs',
    title: 'Unfit through drink or drugs (drive / attempt to drive)',
    statute: 'Road Traffic Act 1988, s.4(1)',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1988/52/section/4',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/unfit-through-drink-or-drugs-drive-attempt-to-drive-revised-2017/',
  },
  {
    id: 'excess-alcohol-in-charge',
    title: 'In charge of a vehicle with excess alcohol',
    statute: 'Road Traffic Act 1988, s.5(1)(b)',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1988/52/section/5',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/excess-alcohol-in-charge-revised-2017/',
  },
  {
    id: 'fail-stop-report-accident',
    title: 'Fail to stop / report a road accident',
    statute: 'Road Traffic Act 1988, s.170',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1988/52/section/170',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/fail-to-stopreport-road-accident-revised-2017/',
  },
  {
    id: 'mobile-phone-driving',
    title: 'Use of mobile telephone while driving',
    statute: 'Road Vehicles (Construction and Use) Regulations 1986, reg.110; Road Traffic Act 1988, s.41D',
    legislationUrl: 'https://www.legislation.gov.uk/uksi/1986/1078/regulation/110',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/use-of-mobile-telephone-while-driving/',
  },
  {
    id: 'speeding',
    title: 'Speeding',
    statute: 'Road Traffic Regulation Act 1984, s.89',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1984/27/section/89',
    sentencingGuidelineUrl: 'https://www.sentencingcouncil.org.uk/guidelines/speeding-revised-2017/',
  },
  {
    id: 'fail-driver-identity',
    title: 'Fail to give information of driver’s identity',
    statute: 'Road Traffic Act 1988, s.172',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1988/52/section/172',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/fail-to-give-information-of-driver-s-identity-as-required/',
  },
  {
    id: 'vehicle-interference',
    title: 'Vehicle interference',
    statute: 'Criminal Attempts Act 1981, s.9',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1981/47/section/9',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/vehicle-interference-revised-2017/',
  },
  {
    id: 'communication-network',
    title: 'Communication network offences (malicious communications / improper use of public electronic communications network)',
    statute: 'Malicious Communications Act 1988, s.1; Communications Act 2003, s.127',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/2003/21/section/127',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/communication-network-offences-revised-2017/',
  },
  {
    id: 'football-related',
    title: 'Football-related offences',
    statute: 'Football (Offences) Act 1991; Sporting Events (Control of Alcohol etc.) Act 1985 (as applicable)',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1991/19/contents',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/football-related-offences-revised-2017/',
  },
  {
    id: 'bladed-article-school',
    title: 'Bladed article / offensive weapon on school premises',
    statute: 'Criminal Justice Act 1988, s.139A',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1988/33/section/139A',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/bladed-articles-and-offensive-weapons-having-in-a-public-place/',
  },
  {
    id: 'offensive-weapon',
    title: 'Possession of an offensive weapon in a public place',
    statute: 'Prevention of Crime Act 1953, s.1',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1953/14/section/1',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/bladed-articles-and-offensive-weapons-having-in-a-public-place/',
  },
  {
    id: 'drive-otherwise-licence',
    title: 'Drive otherwise than in accordance with a licence',
    statute: 'Road Traffic Act 1988, s.87',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1988/52/section/87',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/drive-otherwise-than-in-accordance-with-licence/',
  },
  {
    id: 'railway-fare-evasion',
    title: 'Railway fare evasion',
    statute: 'Regulation of Railways Act 1889, s.5',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1889/57/section/5',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/railway-fare-evasion-revised-2017/',
  },
  {
    id: 'taxi-touting',
    title: 'Taxi touting / soliciting for hire',
    statute: 'Criminal Justice and Public Order Act 1994, s.167',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1994/33/section/167',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/taxi-toutingsoliciting-for-hire-revised-2017/',
  },
  {
    id: 'sexual-assault-child-under-13',
    title: 'Sexual assault of a child under 13',
    statute: 'Sexual Offences Act 2003, s.7',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/2003/42/section/7',
    sentencingGuidelineUrl: 'https://www.sentencingcouncil.org.uk/guidelines/sexual-assault-of-a-child-under-13/',
  },
  {
    id: 'rape-child-under-13',
    title: 'Rape of a child under 13',
    statute: 'Sexual Offences Act 2003, s.5',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/2003/42/section/5',
    sentencingGuidelineUrl: 'https://www.sentencingcouncil.org.uk/guidelines/rape-of-a-child-under-13/',
  },
  {
    id: 'administering-substance-intent',
    title: 'Administering a substance with intent',
    statute: 'Sexual Offences Act 2003, s.61',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/2003/42/section/61',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/administering-a-substance-with-intent/',
  },
  {
    id: 'slavery-trafficking',
    title: 'Slavery, servitude and forced labour / human trafficking',
    statute: 'Modern Slavery Act 2015, ss.1–2',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/2015/30/section/1',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/slavery-servitude-and-forced-or-compulsory-labour-human-trafficking/',
  },
];

async function check(url: string) {
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(25000),
    });
    const text = await res.text();
    const title = (text.match(/<title>([^<]+)/i)?.[1] || '').replace(/\s+/g, ' ').slice(0, 120);
    const bad =
      res.status !== 200 ||
      /page not found|404/i.test(title) ||
      /\/search/i.test(res.url);
    // Extract key facts from SC pages
    const plain = text
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ');
    const eff = plain.match(/Effective from[:\s]*([0-9]{1,2}\s+\w+\s+[0-9]{4})/i)?.[1] || '';
    const triable = plain.match(/Triable[^.]*?(?:Maximum|\.)/)?.[0]?.slice(0, 160) || '';
    const maximum = plain.match(/Maximum[:\s][^.]{0,140}/)?.[0]?.slice(0, 160) || '';
    const range = plain.match(/Offence range[:\s][^.]{0,120}/)?.[0]?.slice(0, 140) || '';
    return { status: res.status, final: res.url, title, bad, plainSnippet: plain.slice(0, 3500), eff, triable, maximum, range };
  } catch (e: unknown) {
    return { status: 0, final: '', title: String(e), bad: true, plainSnippet: '', eff: '', triable: '', maximum: '', range: '' };
  }
}

async function main() {
  const accepted = [];
  const rejected = [];
  for (const c of CANDIDATES) {
    const sg = await check(c.sentencingGuidelineUrl);
    const leg = await check(c.legislationUrl);
    const row = {
      ...c,
      sgStatus: sg.status,
      sgBad: sg.bad,
      sgTitle: sg.title,
      sgEff: sg.eff,
      sgTriable: sg.triable,
      sgMaximum: sg.maximum,
      sgRange: sg.range,
      sgSnippet: sg.plainSnippet.slice(0, 2000),
      legStatus: leg.status,
      legBad: leg.bad,
      legTitle: leg.title,
    };
    if (sg.bad || leg.bad) {
      rejected.push({
        id: c.id,
        title: c.title,
        reason: [
          sg.bad ? `SC ${sg.status} ${sg.title}` : null,
          leg.bad ? `LEG ${leg.status} ${leg.title}` : null,
        ]
          .filter(Boolean)
          .join('; '),
        sgUrl: c.sentencingGuidelineUrl,
        legUrl: c.legislationUrl,
      });
      console.log(`REJECT ${c.id}: ${rejected[rejected.length - 1].reason}`);
    } else {
      accepted.push(row);
      console.log(`OK ${c.id}: ${sg.eff} | ${sg.maximum.slice(0, 80)}`);
    }
  }
  fs.mkdirSync('/opt/cursor/artifacts', { recursive: true });
  fs.writeFileSync(
    '/opt/cursor/artifacts/offence-candidates-verified.json',
    JSON.stringify({ accepted, rejected }, null, 2),
  );
  console.log(`\nAccepted ${accepted.length}, rejected ${rejected.length}`);
}

main();
