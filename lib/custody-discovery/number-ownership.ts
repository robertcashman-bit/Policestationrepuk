/**
 * Detect shared / duplicated numbers across suites without auto-invalidating them.
 */

import type { CustodyNumberFinding } from './types';

export interface SharedNumberCluster {
  normalizedPhoneNumber: string;
  suiteIds: string[];
  classifications: string[];
  likelyForceSwitchboard: boolean;
}

export function clusterSharedNumbers(
  findings: CustodyNumberFinding[],
  minSuites = 3,
): SharedNumberCluster[] {
  const map = new Map<string, CustodyNumberFinding[]>();
  for (const f of findings) {
    if (f.status === 'rejected') continue;
    if (f.classification === 'general_101') continue;
    const list = map.get(f.normalizedPhoneNumber) ?? [];
    list.push(f);
    map.set(f.normalizedPhoneNumber, list);
  }

  const clusters: SharedNumberCluster[] = [];
  for (const [normalizedPhoneNumber, rows] of map) {
    const suiteIds = [...new Set(rows.map((r) => r.custodySuiteId))];
    if (suiteIds.length < minSuites) continue;
    const classifications = [...new Set(rows.map((r) => r.classification))];
    const forceNames = new Set(rows.map((r) => r.forceName));
    const likelyForceSwitchboard =
      classifications.includes('switchboard') ||
      (forceNames.size === 1 && suiteIds.length >= 5);
    clusters.push({
      normalizedPhoneNumber,
      suiteIds,
      classifications,
      likelyForceSwitchboard,
    });
  }

  return clusters.sort((a, b) => b.suiteIds.length - a.suiteIds.length);
}

/** True when 101 / emergency should never be labelled as a station-specific line. */
export function isNonStationSpecificNumber(normalizedDigits: string): boolean {
  const d = normalizedDigits.replace(/\D/g, '');
  return d === '101' || d === '999' || d === '112' || d === '911' || d === '111';
}
