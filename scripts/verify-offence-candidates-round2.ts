/**
 * Round-2 maximize: remaining SC catalogue gaps.
 * Run: npx tsx scripts/verify-offence-candidates-round2.ts
 */
import fs from 'fs';

type Candidate = {
  id: string;
  title: string;
  statute: string;
  legislationUrl: string;
  sentencingGuidelineUrl: string;
};

const CANDIDATES: Candidate[] = [
  // Kidnap — common law + verified CPS primary page
  {
    id: 'kidnap-false-imprisonment',
    title: 'Kidnap / false imprisonment',
    statute: 'Common law (kidnap and false imprisonment)',
    legislationUrl:
      'https://www.cps.gov.uk/prosecution-guidance/offences-against-person-incorporating-charging-standard',
    sentencingGuidelineUrl: 'https://www.sentencingcouncil.org.uk/guidelines/kidnap-false-imprisonment/',
  },
  // Manslaughter / homicide-adjacent
  {
    id: 'unlawful-act-manslaughter',
    title: 'Unlawful act manslaughter',
    statute: 'Common law (manslaughter)',
    legislationUrl:
      'https://www.cps.gov.uk/prosecution-guidance/homicide-murder-and-manslaughter',
    sentencingGuidelineUrl: 'https://www.sentencingcouncil.org.uk/guidelines/unlawful-act-manslaughter/',
  },
  {
    id: 'gross-negligence-manslaughter',
    title: 'Gross negligence manslaughter',
    statute: 'Common law (manslaughter)',
    legislationUrl:
      'https://www.cps.gov.uk/prosecution-guidance/homicide-murder-and-manslaughter',
    sentencingGuidelineUrl: 'https://www.sentencingcouncil.org.uk/guidelines/gross-negligence-manslaughter/',
  },
  {
    id: 'manslaughter-loss-of-control',
    title: 'Manslaughter by reason of loss of control',
    statute: 'Coroners and Justice Act 2009, ss.54–55 (partial defence); manslaughter at common law',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/2009/25/section/54',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/manslaughter-by-reason-of-loss-of-control/',
  },
  {
    id: 'manslaughter-diminished-responsibility',
    title: 'Manslaughter by reason of diminished responsibility',
    statute: 'Homicide Act 1957, s.2; manslaughter at common law',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1957/11/section/2',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/manslaughter-by-reason-of-diminished-responsibility/',
  },
  {
    id: 'attempted-murder',
    title: 'Attempted murder',
    statute: 'Criminal Attempts Act 1981, s.1 (attempt); murder at common law',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1981/47/section/1',
    sentencingGuidelineUrl: 'https://www.sentencingcouncil.org.uk/guidelines/attempted-murder/',
  },
  {
    id: 'corporate-manslaughter',
    title: 'Corporate manslaughter',
    statute: 'Corporate Manslaughter and Corporate Homicide Act 2007, s.1',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/2007/19/section/1',
    sentencingGuidelineUrl: 'https://www.sentencingcouncil.org.uk/guidelines/corporate-manslaughter/',
  },
  // Robbery variants
  {
    id: 'robbery-dwelling',
    title: 'Robbery — dwelling',
    statute: 'Theft Act 1968, s.8',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1968/60/section/8',
    sentencingGuidelineUrl: 'https://www.sentencingcouncil.org.uk/guidelines/robbery-dwelling/',
  },
  {
    id: 'robbery-commercial',
    title: 'Robbery — professionally planned commercial',
    statute: 'Theft Act 1968, s.8',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1968/60/section/8',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/robbery-professionally-planned-commercial/',
  },
  // Criminal damage low value
  {
    id: 'criminal-damage-low-value',
    title: 'Criminal damage (value not exceeding £5,000)',
    statute: 'Criminal Damage Act 1971, s.1(1)',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1971/48/section/1',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/criminal-damage-other-than-by-fire-value-not-exceeding-5-000-racially-or-religiously-aggravated-criminal-damage/',
  },
  // Bladed threats
  {
    id: 'bladed-article-threats',
    title: 'Bladed articles and offensive weapons — threats',
    statute: 'Criminal Justice Act 1988, s.139AA; Prevention of Crime Act 1953, s.1A',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1988/33/section/139AA',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/bladed-articles-and-offensive-weapons-threats/',
  },
  // Firearms remaining
  {
    id: 'firearms-endanger-life',
    title: 'Possession of firearm with intent to endanger life',
    statute: 'Firearms Act 1968, s.16',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1968/27/section/16',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/firearms-possession-with-intent-to-endanger-life/',
  },
  {
    id: 'firearms-intent-other',
    title: 'Firearms — possession with intent (other offences)',
    statute: 'Firearms Act 1968, ss.17(2), 18',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1968/27/section/18',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/firearms-possession-with-intent-other-offences/',
  },
  {
    id: 'firearms-prohibited-person',
    title: 'Possession of firearm by prohibited person',
    statute: 'Firearms Act 1968, s.21',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1968/27/section/21',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/firearms-possession-by-person-prohibited/',
  },
  {
    id: 'firearms-transfer-manufacture',
    title: 'Firearms — transfer and manufacture',
    statute: 'Firearms Act 1968 (transfer/manufacture provisions; check charged section)',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1968/27/contents',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/firearms-transfer-and-manufacture/',
  },
  {
    id: 'firearms-importation',
    title: 'Firearms — importation',
    statute: 'Customs and Excise Management Act 1979 / Firearms Act 1968 (as charged)',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1979/2/section/50',
    sentencingGuidelineUrl: 'https://www.sentencingcouncil.org.uk/guidelines/firearms-importation/',
  },
  // Aggravated vehicle taking death
  {
    id: 'aggravated-vehicle-taking-death',
    title: 'Aggravated vehicle taking — death caused',
    statute: 'Theft Act 1968, s.12A',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1968/60/section/12A',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/aggravated-vehicle-taking-death-caused/',
  },
  // Serious driving
  {
    id: 'causing-death-dangerous',
    title: 'Causing death by dangerous driving',
    statute: 'Road Traffic Act 1988, s.1',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1988/52/section/1',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/causing-death-by-dangerous-driving/',
  },
  {
    id: 'causing-death-careless-drink',
    title: 'Causing death by careless driving under the influence',
    statute: 'Road Traffic Act 1988, s.3A',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1988/52/section/3A',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/causing-death-by-careless-driving-whilst-under-the-influence-of-drink-or-drugs-causing-death-by-careless-driving-when-under-the-influence-of-drink-or-drugs-or-having-failed-either-to-provide-a-specimen-for-analysis-or-to-permit-analysis-of-/',
  },
  {
    id: 'causing-death-unlicensed-uninsured',
    title: 'Causing death by driving: unlicensed or uninsured drivers',
    statute: 'Road Traffic Act 1988, s.3ZB',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1988/52/section/3ZB',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/causing-death-by-driving-unlicensed-or-uninsured-drivers/',
  },
  {
    id: 'causing-death-disqualified',
    title: 'Causing death by driving: disqualified drivers',
    statute: 'Road Traffic Act 1988, s.3ZC',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1988/52/section/3ZC',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/causing-death-by-driving-disqualified-drivers/',
  },
  {
    id: 'causing-serious-injury-dangerous',
    title: 'Causing serious injury by dangerous driving',
    statute: 'Road Traffic Act 1988, s.1A',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1988/52/section/1A',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/causing-serious-injury-by-dangerous-driving/',
  },
  {
    id: 'causing-serious-injury-disqualified',
    title: 'Causing serious injury by driving: disqualified drivers',
    statute: 'Road Traffic Act 1988, s.3ZD',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1988/52/section/3ZD',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/causing-serious-injury-by-driving-disqualified-drivers/',
  },
  {
    id: 'drug-driving-in-charge',
    title: 'Being in charge with a specified drug above the limit',
    statute: 'Road Traffic Act 1988, s.5A',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1988/52/section/5A',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/being-in-charge-of-a-motor-vehicle-with-a-specified-drug-above-the-specified-limit/',
  },
  {
    id: 'unfit-in-charge',
    title: 'Unfit through drink or drugs (in charge)',
    statute: 'Road Traffic Act 1988, s.4(2)',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1988/52/section/4',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/unfit-through-drink-or-drugs-in-charge-revised-2017/',
  },
  {
    id: 'fail-roadside-breath',
    title: 'Fail to co-operate with preliminary (roadside) breath test',
    statute: 'Road Traffic Act 1988, s.6(6)',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1988/52/section/6',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/fail-to-co-operate-with-preliminary-roadside-breath-test/',
  },
  {
    id: 'fail-provide-in-charge',
    title: 'Fail to provide specimen for analysis (in charge)',
    statute: 'Road Traffic Act 1988, s.7(6)',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1988/52/section/7',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/fail-to-provide-specimen-for-analysis-in-charge-revised-2017/',
  },
  // Fraud family
  {
    id: 'fraud-articles',
    title: 'Possession / making / supplying articles for use in frauds',
    statute: 'Fraud Act 2006, ss.6–7',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/2006/35/section/6',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/possession-of-articles-for-use-in-frauds-making-or-supplying-articles-for-use-in-frauds/',
  },
  {
    id: 'benefit-fraud',
    title: 'Benefit fraud',
    statute: 'Social Security Administration Act 1992 / Fraud Act 2006 (as charged)',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1992/5/section/111A',
    sentencingGuidelineUrl: 'https://www.sentencingcouncil.org.uk/guidelines/benefit-fraud/',
  },
  {
    id: 'revenue-fraud',
    title: 'Revenue fraud',
    statute: 'Fraud Act 2006 / Customs and Excise Management Act 1979 (as charged)',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/2006/35/section/1',
    sentencingGuidelineUrl: 'https://www.sentencingcouncil.org.uk/guidelines/revenue-fraud/',
  },
  {
    id: 'bribery',
    title: 'Bribery',
    statute: 'Bribery Act 2010, ss.1–2',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/2010/23/section/1',
    sentencingGuidelineUrl: 'https://www.sentencingcouncil.org.uk/guidelines/bribery/',
  },
  {
    id: 'vehicle-registration-fraud',
    title: 'Vehicle registration fraud',
    statute: 'Vehicle Excise and Registration Act 1994 (as charged)',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1994/22/section/44',
    sentencingGuidelineUrl: 'https://www.sentencingcouncil.org.uk/guidelines/vehicle-registration-fraud/',
  },
  // Sexual offences remaining
  {
    id: 'causing-sexual-activity-without-consent',
    title: 'Causing a person to engage in sexual activity without consent',
    statute: 'Sexual Offences Act 2003, s.4',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/2003/42/section/4',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/causing-a-person-to-engage-in-sexual-activity-without-consent/',
  },
  {
    id: 'assault-child-under-13-penetration',
    title: 'Assault of a child under 13 by penetration',
    statute: 'Sexual Offences Act 2003, s.6',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/2003/42/section/6',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/assault-of-a-child-under-13-by-penetration/',
  },
  {
    id: 'causing-inciting-child-under-13',
    title: 'Causing or inciting a child under 13 to engage in sexual activity',
    statute: 'Sexual Offences Act 2003, s.8',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/2003/42/section/8',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/causing-or-inciting-a-child-under-13-to-engage-in-sexual-activity/',
  },
  {
    id: 'sexual-activity-child-family',
    title: 'Sexual activity with a child family member',
    statute: 'Sexual Offences Act 2003, ss.25–26',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/2003/42/section/25',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/sexual-activity-with-a-child-family-member-inciting-a-child-family-member-to-engage-in-sexual-activity/',
  },
  {
    id: 'arranging-child-sex-offence',
    title: 'Arranging or facilitating the commission of a child sex offence',
    statute: 'Sexual Offences Act 2003, s.14',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/2003/42/section/14',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/arranging-or-facilitating-the-commission-of-a-child-sex-offence/',
  },
  {
    id: 'engaging-sexual-activity-presence-child',
    title: 'Engaging in sexual activity in the presence of a child / causing a child to watch',
    statute: 'Sexual Offences Act 2003, ss.11–12',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/2003/42/section/11',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/engaging-in-sexual-activity-in-the-presence-of-a-child-causing-a-child-to-watch-a-sexual-act/',
  },
  {
    id: 'abuse-position-trust-sexual-child',
    title: 'Abuse of position of trust: sexual activity with a child',
    statute: 'Sexual Offences Act 2003, ss.16–19',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/2003/42/section/16',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/abuse-of-position-of-trust-sexual-activity-with-a-child-abuse-of-position-of-trust-causing-or-inciting-a-child-to-engage-in-sexual-activity/',
  },
  {
    id: 'abuse-position-trust-presence-child',
    title: 'Abuse of position of trust: sexual activity in presence of a child',
    statute: 'Sexual Offences Act 2003, ss.18–19',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/2003/42/section/18',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/abuse-of-position-of-trust-sexual-activity-in-the-presence-of-a-child-abuse-of-position-of-trust-causing-a-child-to-watch-a-sexual-act/',
  },
  {
    id: 'sexual-activity-mental-disorder',
    title: 'Sexual activity with a person with a mental disorder impeding choice',
    statute: 'Sexual Offences Act 2003, ss.30–31',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/2003/42/section/30',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/sexual-activity-with-a-person-with-a-mental-disorder-impeding-choice-causing-or-inciting-a-person-with-a-mental-disorder-impeding-choice-to-engage-in-sexual-activity/',
  },
  {
    id: 'care-workers-sexual-mental-disorder',
    title: 'Care workers: sexual activity with a person with a mental disorder',
    statute: 'Sexual Offences Act 2003, ss.38–41',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/2003/42/section/38',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/care-workers-sexual-activity-with-a-person-with-a-mental-disorder-care-workers-causing-or-inciting-sexual-activity/',
  },
  {
    id: 'inducement-sexual-mental-disorder',
    title: 'Inducement/threat/deception to procure sexual activity (mental disorder)',
    statute: 'Sexual Offences Act 2003, ss.34–37',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/2003/42/section/34',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/inducement-threat-or-deception-to-procure-sexual-activity-with-a-person-with-a-mental-disorder-causing-a-person-with-a-mental-disorder-to-engage-in-or-agree-to-engage-in-sexual-activity-by-inducement-threat-or-deception/',
  },
  {
    id: 'sex-adult-relative',
    title: 'Sex with an adult relative',
    statute: 'Sexual Offences Act 2003, ss.64–65',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/2003/42/section/64',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/sex-with-an-adult-relative-penetration-sex-with-an-adult-relative-consenting-to-penetration/',
  },
  {
    id: 'sexual-activity-public-lavatory',
    title: 'Sexual activity in a public lavatory',
    statute: 'Sexual Offences Act 2003, s.71',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/2003/42/section/71',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/sexual-activity-in-a-public-lavatory/',
  },
  {
    id: 'trespass-intent-sexual',
    title: 'Trespass with intent to commit a sexual offence',
    statute: 'Sexual Offences Act 2003, s.63',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/2003/42/section/63',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/trespass-with-intent-to-commit-a-sexual-offence/',
  },
  {
    id: 'committing-offence-intent-sexual',
    title: 'Committing an offence with intent to commit a sexual offence',
    statute: 'Sexual Offences Act 2003, s.62',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/2003/42/section/62',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/committing-an-offence-with-intent-to-commit-a-sexual-offence/',
  },
  {
    id: 'paying-sexual-services-child',
    title: 'Paying for the sexual services of a child',
    statute: 'Sexual Offences Act 2003, s.47',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/2003/42/section/47',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/paying-for-the-sexual-services-of-a-child/',
  },
  {
    id: 'prostitution-for-gain',
    title: 'Causing/inciting/controlling prostitution for gain',
    statute: 'Sexual Offences Act 2003, ss.52–53',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/2003/42/section/52',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/causing-or-inciting-prostitution-for-gain-controlling-prostitution-for-gain/',
  },
  {
    id: 'child-sexual-exploitation',
    title: 'Sexual exploitation of a child (causing/inciting/controlling/arranging)',
    statute: 'Sexual Offences Act 2003, ss.48–50',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/2003/42/section/48',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/causing-or-inciting-sexual-exploitation-of-a-child-controlling-a-child-in-relation-to-sexual-exploitation-arranging-or-facilitating-sexual-exploitation-of-a-child/',
  },
  {
    id: 'keeping-brothel',
    title: 'Keeping a brothel used for prostitution',
    statute: 'Sexual Offences Act 1956, s.33A',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1956/69/section/33A',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/keeping-a-brothel-used-for-prostitution/',
  },
  // Child cruelty adjacent
  {
    id: 'causing-allowing-child-harm',
    title: 'Causing or allowing a child to suffer serious physical harm / die',
    statute: 'Domestic Violence, Crime and Victims Act 2004, s.5',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/2004/28/section/5',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/causing-or-allowing-a-child-to-suffer-serious-physical-harm-causing-or-allowing-a-child-to-die/',
  },
  // Modern slavery extras
  {
    id: 'trafficking-intent-offence',
    title: 'Committing an offence with intent to commit a human trafficking offence',
    statute: 'Modern Slavery Act 2015, s.4',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/2015/30/section/4',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/committing-offence-with-intent-to-commit-a-human-trafficking-offence/',
  },
  {
    id: 'breach-stpo',
    title: 'Breach of slavery and trafficking prevention / risk order',
    statute: 'Modern Slavery Act 2015 (STPO/STRO breach provisions)',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/2015/30/section/30',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/breach-of-a-slavery-and-trafficking-prevention-order-breach-of-a-slavery-and-trafficking-risk-order/',
  },
  // Psychoactive
  {
    id: 'psychoactive-supply',
    title: 'Supplying / PWITS a psychoactive substance',
    statute: 'Psychoactive Substances Act 2016, ss.5, 7',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/2016/2/section/5',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/supplying-or-offering-to-supply-a-psychoactive-substance-possession-of-psychoactive-substance-with-intent-to-supply/',
  },
  {
    id: 'psychoactive-import-export',
    title: 'Importing or exporting a psychoactive substance',
    statute: 'Psychoactive Substances Act 2016, s.8',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/2016/2/section/8',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/importing-or-exporting-a-psychoactive-substance/',
  },
  // Terrorism
  {
    id: 'terrorism-membership',
    title: 'Membership of a proscribed organisation',
    statute: 'Terrorism Act 2000, s.11',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/2000/11/section/11',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/proscribed-organisations-membership/',
  },
  {
    id: 'terrorism-support',
    title: 'Support for a proscribed organisation',
    statute: 'Terrorism Act 2000, s.12',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/2000/11/section/12',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/proscribed-organisations-support/',
  },
  {
    id: 'terrorism-funding',
    title: 'Funding terrorism',
    statute: 'Terrorism Act 2000, ss.15–18',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/2000/11/section/15',
    sentencingGuidelineUrl: 'https://www.sentencingcouncil.org.uk/guidelines/funding-terrorism/',
  },
  {
    id: 'terrorism-collection-information',
    title: 'Collection of terrorist information',
    statute: 'Terrorism Act 2000, s.58',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/2000/11/section/58',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/collection-of-terrorist-information/',
  },
  {
    id: 'terrorism-possession-purposes',
    title: 'Possession for terrorist purposes',
    statute: 'Terrorism Act 2000, s.57',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/2000/11/section/57',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/possession-for-terrorist-purposes/',
  },
  {
    id: 'terrorism-preparation',
    title: 'Preparation of terrorist acts',
    statute: 'Terrorism Act 2006, s.5',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/2006/11/section/5',
    sentencingGuidelineUrl: 'https://www.sentencingcouncil.org.uk/guidelines/preparation-of-terrorist-acts/',
  },
  {
    id: 'terrorism-encouragement',
    title: 'Encouragement of terrorism / dissemination of terrorist publications',
    statute: 'Terrorism Act 2006, ss.1–2',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/2006/11/section/1',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/encouragement-of-terrorism-dissemination-of-terrorist-publications/',
  },
  {
    id: 'terrorism-explosive-substances',
    title: 'Explosive substances (terrorism only)',
    statute: 'Explosive Substances Act 1883 (terrorism context as per guideline)',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1883/3/section/2',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/explosive-substances-terrorism-only/',
  },
  {
    id: 'terrorism-fail-disclose',
    title: 'Failure to disclose information about acts of terrorism',
    statute: 'Terrorism Act 2000, s.38B',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/2000/11/section/38B',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/failure-to-disclose-information-about-acts-of-terrorism/',
  },
  // Breach orders
  {
    id: 'breach-community-order',
    title: 'Breach of a community order',
    statute: 'Sentencing Code (community order breach provisions)',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/2020/17/section/215',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/breach-of-a-community-order/',
  },
  {
    id: 'breach-suspended-sentence',
    title: 'Breach of a suspended sentence order',
    statute: 'Sentencing Code (suspended sentence breach provisions)',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/2020/17/section/286',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/breach-of-a-suspended-sentence-order/',
  },
  {
    id: 'breach-post-sentence-supervision',
    title: 'Breach of post-sentence supervision',
    statute: 'Offender Rehabilitation Act 2014 / Sentencing Code (as charged)',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/2014/11/section/3',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/breach-of-post-sentence-supervision-breach-of-supervision-default-order/',
  },
  // Dogs / animals
  {
    id: 'dog-dangerously-death',
    title: 'Dog dangerously out of control causing death',
    statute: 'Dangerous Dogs Act 1991, s.3',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1991/65/section/3',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/owner-or-person-in-charge-of-a-dog-dangerously-out-of-control-in-any-place-in-england-or-wales-whether-or-not-a-public-place-where-death-is-caused/',
  },
  {
    id: 'dog-dangerously-assistance',
    title: 'Dog dangerously out of control injuring/killing an assistance dog',
    statute: 'Dangerous Dogs Act 1991, s.3',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1991/65/section/3',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/owner-or-person-in-charge-of-a-dog-dangerously-out-of-control-in-any-place-in-england-or-wales-whether-or-not-a-public-place-where-an-assistance-dog-is-injured-or-killed/',
  },
  {
    id: 'prohibited-dog',
    title: 'Possession of a prohibited dog / breeding/selling/advertising',
    statute: 'Dangerous Dogs Act 1991, s.1',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1991/65/section/1',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/possession-of-a-prohibited-dog-breeding-selling-exchanging-or-advertising-a-prohibited-dog/',
  },
  // Misc custody-adjacent
  {
    id: 'fgm-fail-protect',
    title: 'Failing to protect a girl from risk of genital mutilation',
    statute: 'Female Genital Mutilation Act 2003, s.3A',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/2003/31/section/3A',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/failing-to-protect-girl-from-risk-of-genital-mutilation/',
  },
  {
    id: 'drugs-fail-sample',
    title: 'Class A drugs — fail/refuse to provide a sample',
    statute: 'Police and Criminal Evidence Act 1984 / Drugs Act provisions as charged',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/2005/17/section/9',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/drugs-class-a-failrefuse-to-provide-a-sample/',
  },
  {
    id: 'drugs-fail-assessment',
    title: 'Class A drugs — fail to attend/remain for initial assessment',
    statute: 'Drugs Act 2005 (assessment provisions as charged)',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/2005/17/section/9',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/drugs-class-a-fail-to-attendremain-for-initial-assessment/',
  },
  {
    id: 'knife-sale-under-18',
    title: 'Sale of knives etc to persons under 18',
    statute: 'Criminal Justice Act 1988, s.141A',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1988/33/section/141A',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/individuals-sale-of-knives-etc-by-retailers-to-persons-under-18/',
  },
  {
    id: 'breach-director-disqualification',
    title: 'Breach of disqualification from acting as a director',
    statute: 'Company Directors Disqualification Act 1986, s.13',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1986/46/section/13',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/breach-of-disqualification-from-acting-as-a-director/',
  },
  {
    id: 'breach-animal-disqualification',
    title: 'Breach of disqualification from keeping an animal',
    statute: 'Animal Welfare Act 2006, s.34 / related breach provisions',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/2006/45/section/34',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/breach-of-disqualification-from-keeping-an-animal/',
  },
  {
    id: 'hare-coursing',
    title: 'Hare coursing',
    statute: 'Hunting Act 2004 / related provisions as charged',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/2004/37/section/1',
    sentencingGuidelineUrl: 'https://www.sentencingcouncil.org.uk/guidelines/hare-coursing/',
  },
  {
    id: 'alcohol-sale',
    title: 'Alcohol sale offences',
    statute: 'Licensing Act 2003 (as charged)',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/2003/17/section/146',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/alcohol-sale-offences-revised-2017/',
  },
  {
    id: 'tv-licence-evasion',
    title: 'TV licence payment evasion',
    statute: 'Communications Act 2003, s.363',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/2003/21/section/363',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/tv-licence-payment-evasion-revised-2017/',
  },
  {
    id: 'no-excise-licence',
    title: 'No excise licence (VED)',
    statute: 'Vehicle Excise and Registration Act 1994, s.29',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1994/22/section/29',
    sentencingGuidelineUrl: 'https://www.sentencingcouncil.org.uk/guidelines/no-excise-licence/',
  },
  {
    id: 'no-test-certificate',
    title: 'No test certificate (MOT)',
    statute: 'Road Traffic Act 1988, s.47',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1988/52/section/47',
    sentencingGuidelineUrl: 'https://www.sentencingcouncil.org.uk/guidelines/no-test-certificate/',
  },
  {
    id: 'seat-belt',
    title: 'Seat belt offences',
    statute: 'Road Traffic Act 1988, s.14 / regulations',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1988/52/section/14',
    sentencingGuidelineUrl: 'https://www.sentencingcouncil.org.uk/guidelines/seat-belt-offences/',
  },
  {
    id: 'keeping-vehicle-no-insurance',
    title: 'Keeping a vehicle which does not meet insurance requirements',
    statute: 'Road Traffic Act 1988, s.144A',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1988/52/section/144A',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/keeping-a-vehicle-which-does-not-meet-insurance-requirements/',
  },
  {
    id: 'trade-mark',
    title: 'Unauthorised use of a trade mark etc.',
    statute: 'Trade Marks Act 1994, s.92',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1994/26/section/92',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/individuals-trade-mark-unauthorised-use-of-etc/',
  },
  {
    id: 'health-safety-individuals',
    title: 'Health and safety breaches (individuals)',
    statute: 'Health and Safety at Work etc. Act 1974 (as charged)',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1974/37/section/33',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/individuals-breach-of-duty-of-employer-towards-employees-and-non-employees-breach-of-duty-of-self-employed-to-others-breach-of-duty-of-employees-at-work-breach-of-health-and-safety-regulations-secondary-liability/',
  },
  {
    id: 'food-safety-individuals',
    title: 'Food safety and hygiene breaches (individuals)',
    statute: 'Food Safety Act 1990 / Food Hygiene Regulations (as charged)',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1990/16/section/7',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/individuals-breach-of-food-safety-and-food-hygiene-regulations/',
  },
  {
    id: 'waste-deposit-individuals',
    title: 'Unauthorised deposit/treatment of waste / illegal discharges (individuals)',
    statute: 'Environmental Protection Act 1990 / related provisions (as charged)',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1990/43/section/33',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/individuals-unauthorised-or-harmful-deposit-treatment-or-disposal-etc-of-waste-illegal-discharges-to-air-land-and-water/',
  },
  {
    id: 'dog-dangerously-basic',
    title: 'Dog dangerously out of control (no injury)',
    statute: 'Dangerous Dogs Act 1991, s.3',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1991/65/section/3',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/owner-or-person-in-charge-of-a-dog-dangerously-out-of-control-in-any-place-in-england-or-wales-whether-or-not-a-public-place/',
  },
  {
    id: 'engaging-sexual-presence-mental-disorder',
    title: 'Sexual activity in presence of person with mental disorder impeding choice',
    statute: 'Sexual Offences Act 2003, ss.32–33',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/2003/42/section/32',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/engaging-in-sexual-activity-in-the-presence-of-a-person-with-mental-disorder-impeding-choice-causing-a-person-with-mental-disorder-impeding-choice-to-watch-a-sexual-act/',
  },
  {
    id: 'care-workers-presence-mental-disorder',
    title: 'Care workers: sexual activity in presence of person with mental disorder',
    statute: 'Sexual Offences Act 2003, ss.40–41',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/2003/42/section/40',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/care-workers-sexual-activity-in-the-presence-of-a-person-with-a-mental-disorder-care-workers-causing-a-person-with-a-mental-disorder-to-watch-a-sexual-act/',
  },
  // Round-2b — remaining catalogue gaps with clear statutes
  {
    id: 'drug-importation-evasion',
    title: 'Fraudulent evasion of a prohibition — controlled drug import/export',
    statute: 'Customs and Excise Management Act 1979, s.170 (controlled drugs context)',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1979/2/section/170',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/fraudulent-evasion-of-a-prohibition-by-bringing-into-or-taking-out-of-the-uk-a-controlled-drug/',
  },
  {
    id: 'animal-welfare-fail-ensure',
    title: 'Failure to ensure animal welfare',
    statute: 'Animal Welfare Act 2006, s.9',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/2006/45/section/9',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/failure-to-ensure-animal-welfare/',
  },
  {
    id: 'sexual-presence-inducement-mental-disorder',
    title: 'Sexual activity in presence procured by inducement (mental disorder)',
    statute: 'Sexual Offences Act 2003, ss.36–37',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/2003/42/section/36',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/engaging-in-sexual-activity-in-the-presence-procured-by-inducement-threat-or-deception-of-a-person-with-mental-disorder-causing-a-person-with-a-mental-disorder-to-watch-a-sexual-act-by-inducement-threat-or-deception/',
  },
  {
    id: 'fail-stop-police-constable',
    title: 'Fail to stop when required by a police constable',
    statute: 'Road Traffic Act 1988, s.163',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1988/52/section/163',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/fail-to-stop-when-required-by-police-constable/',
  },
  {
    id: 'fail-comply-pc-directing-traffic',
    title: 'Fail to comply with police constable directing traffic',
    statute: 'Road Traffic Act 1988, s.35',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1988/52/section/35',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/fail-to-comply-with-police-constable-directing-traffic/',
  },
  {
    id: 'school-non-attendance',
    title: 'School non-attendance',
    statute: 'Education Act 1996, s.444',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1996/56/section/444',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/school-non-attendance-revised-2017/',
  },
  {
    id: 'using-untaxed-vehicle-sorn',
    title: 'Using an untaxed vehicle (with a SORN) on a public road',
    statute: 'Vehicle Excise and Registration Act 1994, s.29 / related provisions',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1994/22/section/29',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/using-an-untaxed-vehicle-with-a-sorn-on-a-public-road/',
  },
  {
    id: 'fail-traffic-sign-endorsable',
    title: 'Fail to comply with traffic sign (endorsable)',
    statute: 'Road Traffic Act 1988, s.36',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1988/52/section/36',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/fail-to-comply-with-traffic-sign-endorsable/',
  },
  {
    id: 'fail-traffic-sign-non-endorsable',
    title: 'Fail to comply with traffic sign (non-endorsable)',
    statute: 'Road Traffic Act 1988, s.36',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1988/52/section/36',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/fail-to-comply-with-traffic-sign-non-endorsable/',
  },
  {
    id: 'dangerous-parking',
    title: 'Dangerous parking',
    statute: 'Road Traffic Act 1988, s.22',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1988/52/section/22',
    sentencingGuidelineUrl: 'https://www.sentencingcouncil.org.uk/guidelines/dangerous-parking/',
  },
  {
    id: 'lights-defective',
    title: 'Lights defective',
    statute: 'Road Vehicle Lighting Regulations / Road Traffic Act 1988 (as charged)',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1988/52/section/41A',
    sentencingGuidelineUrl: 'https://www.sentencingcouncil.org.uk/guidelines/lights-defective/',
  },
  {
    id: 'tyres-defective',
    title: 'Tyres defective',
    statute: 'Road Vehicles (Construction and Use) Regulations / RTA 1988 (as charged)',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1988/52/section/41A',
    sentencingGuidelineUrl: 'https://www.sentencingcouncil.org.uk/guidelines/tyres-defective/',
  },
  {
    id: 'brakes-defective',
    title: 'Brakes defective',
    statute: 'Road Vehicles (Construction and Use) Regulations / RTA 1988 (as charged)',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1988/52/section/41A',
    sentencingGuidelineUrl: 'https://www.sentencingcouncil.org.uk/guidelines/brakes-defective/',
  },
  {
    id: 'steering-defective',
    title: 'Steering defective',
    statute: 'Road Vehicles (Construction and Use) Regulations / RTA 1988 (as charged)',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1988/52/section/41A',
    sentencingGuidelineUrl: 'https://www.sentencingcouncil.org.uk/guidelines/steering-defective/',
  },
  {
    id: 'exhaust-defective',
    title: 'Exhaust defective',
    statute: 'Road Vehicles (Construction and Use) Regulations / RTA 1988 (as charged)',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1988/52/section/42',
    sentencingGuidelineUrl: 'https://www.sentencingcouncil.org.uk/guidelines/exhaust-defective/',
  },
  {
    id: 'fail-produce-insurance',
    title: 'Fail to produce insurance certificate',
    statute: 'Road Traffic Act 1988, s.165',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1988/52/section/165',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/fail-to-produce-insurance-certificate/',
  },
  {
    id: 'fail-produce-test-certificate',
    title: 'Fail to produce test certificate',
    statute: 'Road Traffic Act 1988, s.165',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1988/52/section/165',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/fail-to-produce-test-certificate/',
  },
  {
    id: 'fail-notify-change-ownership',
    title: 'Fail to notify change of ownership to DVLA',
    statute: 'Vehicle Excise and Registration Act 1994 / regulations (as charged)',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1994/22/section/59',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/fail-to-notify-change-of-ownership-to-dvla/',
  },
  {
    id: 'no-operators-licence',
    title: 'No operator’s licence',
    statute: 'Goods Vehicles (Licensing of Operators) Act 1995, s.2',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1995/23/section/2',
    sentencingGuidelineUrl: 'https://www.sentencingcouncil.org.uk/guidelines/no-operators-licence/',
  },
  {
    id: 'pelican-zebra-crossing',
    title: 'Pelican / zebra crossing contravention',
    statute: 'Zebra, Pelican and Puffin Pedestrian Crossings Regulations / RTA 1988 (as charged)',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1988/52/section/25',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/pelicanzebra-crossing-contravention/',
  },
  {
    id: 'fail-child-car-seat',
    title: 'Fail to use appropriate child car seat',
    statute: 'Road Traffic Act 1988, s.15 / regulations',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1988/52/section/15',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/fail-to-use-appropriate-child-car-seat/',
  },
  {
    id: 'motorway-hard-shoulder',
    title: 'Stop on hard shoulder on motorway',
    statute: 'Motorways Traffic (England and Wales) Regulations / RTA 1988 (as charged)',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1988/52/section/17',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/stop-on-hard-shoulder-on-motorway/',
  },
  {
    id: 'motorway-wrong-way',
    title: 'Drive in reverse or wrong way on motorway',
    statute: 'Motorways Traffic (England and Wales) Regulations / RTA 1988 (as charged)',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1988/52/section/17',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/drive-in-reverse-or-wrong-way-on-motorway/',
  },
  {
    id: 'registration-mark-non-conforming',
    title: 'Drive when registration mark fails to conform with regulations',
    statute: 'Vehicle Excise and Registration Act 1994 / regulations (as charged)',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1994/22/section/59',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/drive-a-vehicle-when-the-registration-mark-fails-to-conform-with-regulations/',
  },
  {
    id: 'condition-vehicle-danger-injury',
    title: 'Condition of vehicle/accessories/equipment involving danger of injury',
    statute: 'Road Traffic Act 1988, s.40A',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1988/52/section/40A',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/condition-of-vehicleaccessories-equipment-involving-danger-of-injury/',
  },
  {
    id: 'load-danger-injury',
    title: 'Weight/position/distribution of load involving danger of injury',
    statute: 'Road Traffic Act 1988, s.40A',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1988/52/section/40A',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/weight-position-or-distribution-of-load-or-manner-in-which-load-secured-involving-danger-of-injury/',
  },
  {
    id: 'assault-police-constable',
    title: 'Assault on a police constable in the execution of duty',
    statute: 'Police Act 1996, s.89(1)',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1996/16/section/89',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/assault-on-a-police-constable-in-execution-of-his-duty-interim-guidance/',
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
      /page not found|404 error/i.test(title) ||
      /\/search/i.test(res.url) ||
      /interim/i.test(url) ||
      /interim/i.test(title) ||
      /for-consultation|consultation only/i.test(url + title);
    const plain = text
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ');
    const eff = plain.match(/Effective from[:\s]*([0-9]{1,2}\s+\w+\s+[0-9]{4})/i)?.[1] || '';
    const triable = plain.match(/Triable[^.]*?(?:Maximum|\.)/)?.[0]?.slice(0, 160) || '';
    const maximum = plain.match(/Maximum[:\s][^.]{0,140}/)?.[0]?.slice(0, 160) || '';
    const range = plain.match(/Offence range[:\s][^.]{0,120}/)?.[0]?.slice(0, 140) || '';
    return { status: res.status, final: res.url, title, bad, plainSnippet: plain.slice(0, 2500), eff, triable, maximum, range };
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
    if (sg.bad || leg.bad) {
      const reason = [
        sg.bad ? `SC ${sg.status} ${sg.title}` : null,
        leg.bad ? `LEG ${leg.status} ${leg.title}` : null,
      ]
        .filter(Boolean)
        .join('; ');
      rejected.push({ id: c.id, title: c.title, reason, sgUrl: c.sentencingGuidelineUrl, legUrl: c.legislationUrl });
      console.log(`REJECT ${c.id}: ${reason}`);
    } else {
      accepted.push({
        ...c,
        sgStatus: sg.status,
        sgEff: sg.eff,
        sgTriable: sg.triable,
        sgMaximum: sg.maximum,
        sgRange: sg.range,
        sgSnippet: sg.plainSnippet,
        legStatus: leg.status,
        legTitle: leg.title,
      });
      console.log(`OK ${c.id}: ${sg.eff || '?'} | ${(sg.maximum || '').slice(0, 70)}`);
    }
  }
  fs.mkdirSync('/opt/cursor/artifacts', { recursive: true });
  fs.writeFileSync(
    '/opt/cursor/artifacts/offence-candidates-round2.json',
    JSON.stringify({ accepted, rejected }, null, 2),
  );
  console.log(`\nAccepted ${accepted.length}, rejected ${rejected.length}`);
}

main();
