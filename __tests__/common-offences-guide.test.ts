import { describe, expect, it } from 'vitest';
import { COMMON_OFFENCES, GENERAL_DEFENCES } from '@/lib/common-offences-guide';

/** Snapshot of offence ids — accidental drops fail CI. */
const EXPECTED_OFFENCE_IDS = [
  'common-assault',
  'assault-emergency-worker',
  'abh',
  'gbh-s20',
  'gbh-s18',
  'threats-to-kill',
  'theft',
  'burglary',
  'robbery',
  'handling-stolen-goods',
  'going-equipped',
  'making-off-without-payment',
  'twoc',
  'aggravated-vehicle-taking',
  'criminal-damage',
  'possession-drugs',
  'pwits',
  'bladed-article',
  'public-order',
  'affray',
  'violent-disorder',
  'fraud',
  'harassment-stalking',
  'harassment-fear-violence',
  'breach-protective-order',
  'excess-alcohol',
  'fail-to-provide',
  'careless-driving',
  'dangerous-driving',
  'fail-to-surrender',
  'obstruct-police',
  'shop-theft',
  'non-domestic-burglary',
  'aggravated-burglary',
  'abstracting-electricity',
  'blackmail',
  'arson',
  'arson-endanger-life',
  'threats-to-damage',
  'drug-production',
  'permitting-premises-drugs',
  'drive-whilst-disqualified',
  'no-insurance',
  'aggravated-vehicle-taking-injury',
  'aggravated-vehicle-taking-dangerous',
  'wanton-furious-driving',
  'assault-resist-arrest',
  'strangulation',
  'controlling-coercive',
  'witness-intimidation',
  'perverting-justice',
  'sexual-assault',
  'rape',
  'assault-by-penetration',
  'indecent-images',
  'exposure',
  'voyeurism',
  'disclose-private-sexual-images',
  'sexual-communication-child',
  'meeting-child-grooming',
  'sexual-activity-child',
  'drunk-disorderly',
  'riot',
  'breach-cbo',
  'firearms-public-place',
  'firearms-prohibited-weapon',
  'firearms-without-certificate',
  'firearms-intent-fear',
  'money-laundering',
  'cruelty-to-child',
  'animal-cruelty',
  'dog-dangerously-out-of-control',
  'poa-s4a',
  'poa-s5',
  'breach-shpo',
  'fail-notification',
  'psychoactive-produce',
  'causing-death-careless',
  'causing-serious-injury-careless',
  'drug-driving',
  'unfit-drink-drugs',
  'excess-alcohol-in-charge',
  'fail-stop-report-accident',
  'mobile-phone-driving',
  'speeding',
  'fail-driver-identity',
  'vehicle-interference',
  'communication-network',
  'football-related',
  'bladed-article-school',
  'offensive-weapon',
  'drive-otherwise-licence',
  'railway-fare-evasion',
  'taxi-touting',
  'sexual-assault-child-under-13',
  'rape-child-under-13',
  'administering-substance-intent',
  'slavery-trafficking',
  'racial-hatred',
  'kidnap-false-imprisonment',
  'unlawful-act-manslaughter',
  'gross-negligence-manslaughter',
  'manslaughter-loss-of-control',
  'manslaughter-diminished-responsibility',
  'attempted-murder',
  'corporate-manslaughter',
  'robbery-dwelling',
  'robbery-commercial',
  'criminal-damage-low-value',
  'bladed-article-threats',
  'firearms-endanger-life',
  'firearms-intent-other',
  'firearms-prohibited-person',
  'firearms-transfer-manufacture',
  'firearms-importation',
  'aggravated-vehicle-taking-death',
  'causing-death-dangerous',
  'causing-death-careless-drink',
  'causing-death-unlicensed-uninsured',
  'causing-death-disqualified',
  'causing-serious-injury-dangerous',
  'causing-serious-injury-disqualified',
  'drug-driving-in-charge',
  'unfit-in-charge',
  'fail-roadside-breath',
  'fail-provide-in-charge',
  'fraud-articles',
  'benefit-fraud',
  'revenue-fraud',
  'bribery',
  'vehicle-registration-fraud',
  'causing-sexual-activity-without-consent',
  'assault-child-under-13-penetration',
  'causing-inciting-child-under-13',
  'sexual-activity-child-family',
  'arranging-child-sex-offence',
  'engaging-sexual-activity-presence-child',
  'abuse-position-trust-sexual-child',
  'abuse-position-trust-presence-child',
  'sexual-activity-mental-disorder',
  'care-workers-sexual-mental-disorder',
  'inducement-sexual-mental-disorder',
  'sex-adult-relative',
  'sexual-activity-public-lavatory',
  'trespass-intent-sexual',
  'committing-offence-intent-sexual',
  'paying-sexual-services-child',
  'prostitution-for-gain',
  'child-sexual-exploitation',
  'keeping-brothel',
  'causing-allowing-child-harm',
  'trafficking-intent-offence',
  'breach-stpo',
  'psychoactive-supply',
  'psychoactive-import-export',
  'terrorism-membership',
  'terrorism-support',
  'terrorism-funding',
  'terrorism-collection-information',
  'terrorism-possession-purposes',
  'terrorism-preparation',
  'terrorism-encouragement',
  'terrorism-explosive-substances',
  'terrorism-fail-disclose',
  'breach-community-order',
  'breach-suspended-sentence',
  'breach-post-sentence-supervision',
  'dog-dangerously-death',
  'dog-dangerously-assistance',
  'prohibited-dog',
  'fgm-fail-protect',
  'drugs-fail-sample',
  'drugs-fail-assessment',
  'knife-sale-under-18',
  'breach-director-disqualification',
  'breach-animal-disqualification',
  'hare-coursing',
  'alcohol-sale',
  'tv-licence-evasion',
  'no-excise-licence',
  'no-test-certificate',
  'seat-belt',
  'keeping-vehicle-no-insurance',
  'trade-mark',
  'health-safety-individuals',
  'food-safety-individuals',
  'waste-deposit-individuals',
  'dog-dangerously-basic',
  'engaging-sexual-presence-mental-disorder',
  'care-workers-presence-mental-disorder',
  'drug-importation-evasion',
  'animal-welfare-fail-ensure',
  'sexual-presence-inducement-mental-disorder',
  'fail-stop-police-constable',
  'fail-comply-pc-directing-traffic',
  'school-non-attendance',
  'using-untaxed-vehicle-sorn',
  'fail-traffic-sign-endorsable',
  'fail-traffic-sign-non-endorsable',
  'dangerous-parking',
  'lights-defective',
  'tyres-defective',
  'brakes-defective',
  'steering-defective',
  'exhaust-defective',
  'fail-produce-insurance',
  'fail-produce-test-certificate',
  'fail-notify-change-ownership',
  'no-operators-licence',
  'pelican-zebra-crossing',
  'fail-child-car-seat',
  'motorway-hard-shoulder',
  'motorway-wrong-way',
  'registration-mark-non-conforming',
  'condition-vehicle-danger-injury',
  'load-danger-injury',
] as const;


describe('common offences guide', () => {
  it('exports the expected offence id list (no accidental drops)', () => {
    expect(COMMON_OFFENCES.map((o) => o.id)).toEqual([...EXPECTED_OFFENCE_IDS]);
  });

  it('has unique offence ids', () => {
    const ids = COMMON_OFFENCES.map((o) => o.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every sentencingGuidelineUrl is https on sentencingcouncil.org.uk', () => {
    for (const offence of COMMON_OFFENCES) {
      expect(offence.sentencingGuidelineUrl, offence.id).toMatch(
        /^https:\/\/www\.sentencingcouncil\.org\.uk\//
      );
    }
  });

  it('every legislationUrl is https on legislation.gov.uk or an accepted primary source host', () => {
    for (const offence of COMMON_OFFENCES) {
      expect(offence.legislationUrl, offence.id).toMatch(
        /^https:\/\/www\.(legislation\.gov\.uk|cps\.gov\.uk)\//
      );
    }
  });

  it('every entry fills the OffenceGuideEntry shape with non-empty core fields', () => {
    for (const offence of COMMON_OFFENCES) {
      expect(offence.title.length, offence.id).toBeGreaterThan(3);
      expect(offence.statute.length, offence.id).toBeGreaterThan(5);
      expect(offence.triable.length, offence.id).toBeGreaterThan(3);
      expect(offence.maxPenalty.length, offence.id).toBeGreaterThan(3);
      expect(offence.sentencingNote.length, offence.id).toBeGreaterThan(10);
      expect(offence.actusReus.length, offence.id).toBeGreaterThan(0);
      expect(offence.mensRea.length, offence.id).toBeGreaterThan(0);
      expect(offence.commonDefences.length, offence.id).toBeGreaterThan(0);
      expect(offence.stationNotes.length, offence.id).toBeGreaterThan(10);
      expect(Array.isArray(offence.keyCases), offence.id).toBe(true);
    }
  });

  it('does not point common assault legislation at the Road Traffic Act', () => {
    const assault = COMMON_OFFENCES.find((o) => o.id === 'common-assault');
    expect(assault?.legislationUrl).toBe('https://www.legislation.gov.uk/ukpga/1988/33/section/39');
    expect(assault?.legislationUrl).not.toContain('ukpga/1988/52');
  });

  it('general defences remain available', () => {
    expect(GENERAL_DEFENCES.map((d) => d.id)).toEqual([
      'self-defence',
      'intoxication',
      'duress',
      'insanity-automatism',
      'consent',
    ]);
  });
});
