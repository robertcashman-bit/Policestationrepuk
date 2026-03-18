import { getAllReps, getAllStations } from '@/lib/data';

export interface CountySeoPage {
  slug: string;
  countyName: string;
  pageSlug: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  intro: string;
  stationNames: string[];
}

export const COUNTY_SEO_PAGES: CountySeoPage[] = [
  {
    slug: 'kent',
    countyName: 'Kent',
    pageSlug: 'PoliceStationRepsKent',
    metaTitle: 'Kent Police Station Cover Network | Find Reps for Firms',
    metaDescription:
      'Find accredited police station representatives covering Kent. Representatives available 24/7 for Maidstone, Canterbury, Medway, Folkestone, Tunbridge Wells, and more.',
    h1: 'Kent Police Station Cover Network',
    intro:
      'Accredited police station representatives covering Maidstone, Canterbury, Medway, Folkestone, Tunbridge Wells, and all Kent custody suites. Our Kent representatives are available 24/7 for criminal defence solicitors needing police station cover.',
    stationNames: ['Maidstone', 'Canterbury', 'Medway', 'Folkestone', 'Tunbridge Wells', 'Gravesend', 'Tonbridge', 'Sevenoaks', 'Swanley'],
  },
  {
    slug: 'london',
    countyName: 'London',
    pageSlug: 'PoliceStationRepsLondon',
    metaTitle: 'London Police Station Representatives | Find Reps for Firms',
    metaDescription:
      'Find accredited police station representatives covering Greater London. Reps available 24/7 for all Metropolitan Police custody suites.',
    h1: 'London Police Station Representatives',
    intro:
      'Accredited police station representatives covering all Greater London custody suites. Our London representatives provide 24/7 cover for criminal defence solicitors across the Metropolitan Police area.',
    stationNames: ['Brixton', 'Lewisham', 'Charing Cross', 'Croydon', 'Islington', 'Hammersmith'],
  },
  {
    slug: 'essex',
    countyName: 'Essex',
    pageSlug: 'PoliceStationRepsEssex',
    metaTitle: 'Essex Police Station Representatives | Find Reps for Firms',
    metaDescription:
      'Find accredited police station representatives covering Essex. Representatives available for all Essex Police custody suites.',
    h1: 'Essex Police Station Representatives',
    intro:
      'Accredited police station representatives covering all Essex Police custody suites. Our Essex representatives are available for criminal defence solicitors needing police station cover across the county.',
    stationNames: ['Chelmsford', 'Southend', 'Basildon', 'Colchester', 'Harlow'],
  },
  {
    slug: 'manchester',
    countyName: 'Greater Manchester',
    pageSlug: 'PoliceStationRepsManchester',
    metaTitle: 'Manchester Police Station Representatives | Find Reps for Firms',
    metaDescription:
      'Find accredited police station representatives covering Greater Manchester. Representatives available for all GMP custody suites.',
    h1: 'Manchester Police Station Representatives',
    intro:
      'Accredited police station representatives covering Greater Manchester Police custody suites. Our Manchester representatives provide cover for criminal defence solicitors across the region.',
    stationNames: ['Manchester Central', 'Salford', 'Bolton', 'Stockport', 'Wigan'],
  },
  {
    slug: 'west-midlands',
    countyName: 'West Midlands',
    pageSlug: 'PoliceStationRepsWestMidlands',
    metaTitle: 'West Midlands Police Station Representatives | Find Reps for Firms',
    metaDescription:
      'Find accredited police station representatives covering the West Midlands. Representatives available for all WMP custody suites.',
    h1: 'West Midlands Police Station Representatives',
    intro:
      'Accredited police station representatives covering West Midlands Police custody suites including Birmingham, Coventry, Wolverhampton, and surrounding areas.',
    stationNames: ['Birmingham', 'Coventry', 'Wolverhampton', 'Walsall', 'Dudley'],
  },
  {
    slug: 'west-yorkshire',
    countyName: 'West Yorkshire',
    pageSlug: 'PoliceStationRepsWestYorkshire',
    metaTitle: 'West Yorkshire Police Station Representatives | Find Reps for Firms',
    metaDescription:
      'Find accredited police station representatives covering West Yorkshire. Representatives available for all WYP custody suites.',
    h1: 'West Yorkshire Police Station Representatives',
    intro:
      'Accredited police station representatives covering West Yorkshire Police custody suites including Leeds, Bradford, Wakefield, and surrounding areas.',
    stationNames: ['Leeds', 'Bradford', 'Wakefield', 'Huddersfield', 'Halifax'],
  },
  {
    slug: 'surrey',
    countyName: 'Surrey',
    pageSlug: 'PoliceStationRepsSurrey',
    metaTitle: 'Surrey Police Station Representatives | Find Reps for Firms',
    metaDescription:
      'Find accredited police station representatives covering Surrey. Representatives available for all Surrey Police custody suites.',
    h1: 'Surrey Police Station Representatives',
    intro:
      'Accredited police station representatives covering Surrey Police custody suites including Guildford, Woking, Staines, and surrounding areas.',
    stationNames: ['Guildford', 'Woking', 'Staines', 'Reigate'],
  },
  {
    slug: 'sussex',
    countyName: 'Sussex',
    pageSlug: 'PoliceStationRepsSussex',
    metaTitle: 'Sussex Police Station Representatives | Find Reps for Firms',
    metaDescription:
      'Find accredited police station representatives covering Sussex. Representatives available for all Sussex Police custody suites.',
    h1: 'Sussex Police Station Representatives',
    intro:
      'Accredited police station representatives covering Sussex Police custody suites including Brighton, Crawley, Eastbourne, and surrounding areas.',
    stationNames: ['Brighton', 'Crawley', 'Eastbourne', 'Hastings', 'Worthing'],
  },
  {
    slug: 'hampshire',
    countyName: 'Hampshire',
    pageSlug: 'PoliceStationRepsHampshire',
    metaTitle: 'Hampshire Police Station Representatives | Find Reps for Firms',
    metaDescription:
      'Find accredited police station representatives covering Hampshire. Representatives available for all Hampshire Constabulary custody suites.',
    h1: 'Hampshire Police Station Representatives',
    intro:
      'Accredited police station representatives covering Hampshire Constabulary custody suites including Southampton, Portsmouth, Winchester, and surrounding areas.',
    stationNames: ['Southampton', 'Portsmouth', 'Winchester', 'Basingstoke'],
  },
  {
    slug: 'norfolk',
    countyName: 'Norfolk',
    pageSlug: 'PoliceStationRepsNorfolk',
    metaTitle: 'Norfolk Police Station Representatives | Find Reps for Firms',
    metaDescription:
      'Find accredited police station representatives covering Norfolk. Representatives available for all Norfolk Constabulary custody suites.',
    h1: 'Norfolk Police Station Representatives',
    intro:
      'Accredited police station representatives covering Norfolk Constabulary custody suites including Norwich, King\'s Lynn, Great Yarmouth, and surrounding areas.',
    stationNames: ['Norwich', "King's Lynn", 'Great Yarmouth'],
  },
  {
    slug: 'suffolk',
    countyName: 'Suffolk',
    pageSlug: 'PoliceStationRepsSuffolk',
    metaTitle: 'Suffolk Police Station Representatives | Find Reps for Firms',
    metaDescription:
      'Find accredited police station representatives covering Suffolk. Representatives available for all Suffolk Constabulary custody suites.',
    h1: 'Suffolk Police Station Representatives',
    intro:
      'Accredited police station representatives covering Suffolk Constabulary custody suites including Ipswich, Bury St Edmunds, Lowestoft, and surrounding areas.',
    stationNames: ['Ipswich', 'Bury St Edmunds', 'Lowestoft'],
  },
  {
    slug: 'berkshire',
    countyName: 'Berkshire',
    pageSlug: 'PoliceStationRepsBerkshire',
    metaTitle: 'Berkshire Police Station Representatives | Find Reps for Firms',
    metaDescription:
      'Find accredited police station representatives covering Berkshire. Representatives available for all Thames Valley Police custody suites in Berkshire.',
    h1: 'Berkshire Police Station Representatives',
    intro:
      'Accredited police station representatives covering Berkshire custody suites including Reading, Slough, Maidenhead, and surrounding areas under Thames Valley Police.',
    stationNames: ['Reading', 'Slough', 'Maidenhead', 'Windsor'],
  },
  {
    slug: 'hertfordshire',
    countyName: 'Hertfordshire',
    pageSlug: 'PoliceStationRepsHertfordshire',
    metaTitle: 'Hertfordshire Police Station Representatives | Find Reps for Firms',
    metaDescription:
      'Find accredited police station representatives covering Hertfordshire. Representatives available for all Hertfordshire Constabulary custody suites.',
    h1: 'Hertfordshire Police Station Representatives',
    intro:
      'Accredited police station representatives covering Hertfordshire Constabulary custody suites including Hatfield, Stevenage, Watford, and surrounding areas.',
    stationNames: ['Hatfield', 'Stevenage', 'Watford', 'St Albans'],
  },
];

export function getCountySeoPage(pageSlug: string): CountySeoPage | null {
  return (
    COUNTY_SEO_PAGES.find(
      (p) => p.pageSlug.toLowerCase() === pageSlug.toLowerCase()
    ) ?? null
  );
}

export async function getCountySeoData(page: CountySeoPage) {
  const allReps = await getAllReps();
  const allStations = await getAllStations();

  const reps = allReps.filter((r) =>
    r.county.toLowerCase() === page.countyName.toLowerCase()
  );

  const stations = allStations.filter(
    (s) => (s.county || '').toLowerCase() === page.countyName.toLowerCase()
  );

  return { reps, stations };
}

export function getAllCountySeoPageSlugs(): string[] {
  return COUNTY_SEO_PAGES.map((p) => p.pageSlug);
}
