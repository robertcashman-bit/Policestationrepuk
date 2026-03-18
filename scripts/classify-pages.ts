/**
 * STEP 2 – Detect content types from crawled data/pages.json.
 * Classifies each page as: homepage | county | representative_profile | police_station | directory | informational
 *
 * Run after crawl: npx tsx scripts/classify-pages.ts
 */

import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const PAGES_PATH = path.join(DATA_DIR, 'pages.json');
const OUTPUT_PATH = path.join(DATA_DIR, 'page-types.json');

export type ContentType =
  | 'homepage'
  | 'county'
  | 'representative_profile'
  | 'police_station'
  | 'directory'
  | 'informational';

interface ClassifiedPage {
  path: string;
  url: string;
  title: string;
  contentType: ContentType;
  slug?: string;
  countyName?: string;
  stationName?: string;
}

const COUNTY_PREFIX = 'PoliceStationReps';
const STATION_SUFFIX = 'PoliceStationReps'; // e.g. MaidstonePoliceStationReps
const STATION_PATTERNS = [
  /^(.+)PoliceStationReps$/,  // MaidstonePoliceStationReps, GravesendPoliceStationReps
  /^(.+)PoliceStation$/,      // fallback
];

function classifyPath(urlPath: string, title: string): Omit<ClassifiedPage, 'url' | 'title'> & { path: string } {
  const pathNorm = urlPath === '' || urlPath === '/' ? '/' : urlPath.startsWith('/') ? urlPath : `/${urlPath}`;

  if (pathNorm === '/') {
    return { path: pathNorm, contentType: 'homepage' };
  }

  if (pathNorm === '/Directory' || pathNorm === '/FindYourRep' || pathNorm === '/CountyReps' || pathNorm === '/PoliceStationRepsByCounty') {
    return { path: pathNorm, contentType: 'directory', slug: pathNorm.slice(1).toLowerCase() };
  }

  const segment = pathNorm.replace(/^\//, '');

  if (segment === 'PoliceStationRepsKent' || segment === 'PoliceStationRepsLondon' || segment === 'PoliceStationRepsEssex' ||
      segment === 'PoliceStationRepsBerkshire' || segment === 'PoliceStationRepsHampshire' || segment === 'PoliceStationRepsHertfordshire' ||
      segment === 'PoliceStationRepsManchester' || segment === 'PoliceStationRepsNorfolk' || segment === 'PoliceStationRepsSuffolk' ||
      segment === 'PoliceStationRepsSurrey' || segment === 'PoliceStationRepsSussex' || segment === 'PoliceStationRepsWestMidlands' ||
      segment === 'PoliceStationRepsWestYorkshire') {
    const countyName = segment.replace('PoliceStationReps', '').replace(/([A-Z])/g, ' $1').trim();
    return { path: pathNorm, contentType: 'county', countyName, slug: segment.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '') };
  }

  for (const pattern of STATION_PATTERNS) {
    const m = segment.match(pattern);
    if (m) {
      const name = m[1].replace(/([A-Z])/g, ' $1').trim();
      const stationSlug = m[1].replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
      return { path: pathNorm, contentType: 'police_station', stationName: name, slug: stationSlug };
    }
  }

  if (segment === 'RepProfile' || segment === 'SpotlightProfile') {
    return { path: pathNorm, contentType: 'representative_profile', slug: segment.toLowerCase() };
  }

  return { path: pathNorm, contentType: 'informational', slug: segment };
}

function main() {
  if (!fs.existsSync(PAGES_PATH)) {
    console.error('Run the crawler first: npm run crawl');
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(PAGES_PATH, 'utf-8'));
  const pages: Array<{ path: string; url: string; title: string }> = raw.pages || [];

  const classified: ClassifiedPage[] = pages.map((p: { path: string; url: string; title: string }) => {
    const { path: pPath, contentType, slug, countyName, stationName } = classifyPath(p.path, p.title);
    return {
      path: pPath,
      url: p.url,
      title: p.title,
      contentType,
      ...(slug && { slug }),
      ...(countyName && { countyName }),
      ...(stationName && { stationName }),
    };
  });

  const summary: Record<ContentType, number> = {
    homepage: 0,
    county: 0,
    representative_profile: 0,
    police_station: 0,
    directory: 0,
    informational: 0,
  };
  classified.forEach((c) => { summary[c.contentType]++; });

  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(
    OUTPUT_PATH,
    JSON.stringify({ classifiedAt: new Date().toISOString(), summary, pages: classified }, null, 2),
    'utf-8',
  );
  console.log('Content types:', summary);
  console.log('Written to', OUTPUT_PATH);
}

main();
