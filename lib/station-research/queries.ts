import type { PoliceStation } from '@/lib/types';
import { getForceSourceEntry } from './force-source-registry';

/** Adaptive search queries for main-line / front-counter / hours research. */
export function buildStationResearchQueries(station: PoliceStation): string[] {
  const name = station.name.trim();
  const short = name.replace(/\s*police station\s*/gi, ' ').replace(/\s+/g, ' ').trim();
  const force = station.forceName?.trim() || '';
  const postcode = station.postcode?.trim() || '';
  const domain = getForceSourceEntry(force)?.officialDomain || 'police.uk';

  const queries = [
    `"${name}" telephone OR phone OR contact`,
    `"${short}" police station telephone`,
    `"${name}" front counter telephone`,
    `site:${domain} "${short}" telephone OR phone OR contact`,
    postcode ? `site:${domain} "${postcode}" police` : '',
    force ? `"${force}" "${short}" contact` : '',
    force ? `site:${domain} station directory OR locations "${short}"` : '',
    `"${name}" opening hours`,
    `filetype:pdf site:${domain} "${short}" telephone`,
  ].filter(Boolean);

  return [...new Set(queries)];
}
