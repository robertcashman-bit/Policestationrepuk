import type { OfficialForceContact } from '@/lib/official-force-contacts';
import { OFFICIAL_FORCE_CONTACTS, getOfficialContact } from '@/lib/official-force-contacts';
import { FORCE_CUSTODY_PAGES } from '@/lib/custody-discovery/official-pages';
import { forceDomainForName } from '@/lib/custody-discovery/force-domains';

export type SourceTier = 1 | 2 | 3 | 4;

export type CrawlPermission = 'allowed' | 'restricted' | 'unknown';

export interface ForceSourceRegistryEntry {
  forceName: string;
  forceKey: string;
  officialDomain: string;
  contactPageUrls: string[];
  custodyPageUrls: string[];
  nonEmergency: string;
  switchboard?: string;
  international?: string;
  contactSource: string;
  crawlPermission: CrawlPermission;
  preferredUpdateIntervalHours: number;
  notes?: string;
}

function forceKey(name: string): string {
  return name.toLowerCase().trim();
}

function titleCaseForce(key: string): string {
  return key.replace(/\b\w/g, (c) => c.toUpperCase());
}

function canonicalForceName(key: string): string {
  for (const name of Object.keys(OFFICIAL_FORCE_CONTACTS)) {
    if (forceKey(name) === key) return name;
  }
  return titleCaseForce(key);
}

/** Build a unified force source registry from existing contacts + custody pages. */
export function buildForceSourceRegistry(): ForceSourceRegistryEntry[] {
  const keys = new Set<string>([
    ...Object.keys(OFFICIAL_FORCE_CONTACTS).map(forceKey),
    ...Object.keys(FORCE_CUSTODY_PAGES).map(forceKey),
  ]);

  const entries: ForceSourceRegistryEntry[] = [];
  for (const key of keys) {
    const forceName = canonicalForceName(key);
    const contact = getOfficialContact(forceName) as OfficialForceContact | null;
    const domain = forceDomainForName(forceName);
    const custodyUrls = FORCE_CUSTODY_PAGES[key] ?? [];
    const contactPageUrls = [
      ...custodyUrls,
      ...(contact?.source?.startsWith('http') ? [contact.source] : []),
      `https://www.${domain}/contact/`,
    ];

    entries.push({
      forceName,
      forceKey: key,
      officialDomain: domain,
      contactPageUrls: [...new Set(contactPageUrls)],
      custodyPageUrls: custodyUrls,
      nonEmergency: contact?.nonEmergency ?? '101',
      switchboard: contact?.switchboard,
      international: contact?.international,
      contactSource: contact?.source ?? `https://www.${domain}/`,
      crawlPermission: domain.endsWith('.police.uk') ? 'allowed' : 'unknown',
      preferredUpdateIntervalHours: 168,
      notes:
        contact?.switchboard || contact?.international
          ? undefined
          : 'Force-wide geographic/switchboard line not yet corroborated from an official page.',
    });
  }

  return entries.sort((a, b) => a.forceName.localeCompare(b.forceName));
}

let _cache: ForceSourceRegistryEntry[] | null = null;

export function getForceSourceRegistry(): ForceSourceRegistryEntry[] {
  if (!_cache) _cache = buildForceSourceRegistry();
  return _cache;
}

/** Test helper — clear registry cache after fixture changes. */
export function clearForceSourceRegistryCache(): void {
  _cache = null;
}

export function getForceSourceEntry(forceName: string | undefined): ForceSourceRegistryEntry | null {
  if (!forceName?.trim()) return null;
  const key = forceKey(forceName);
  return getForceSourceRegistry().find((e) => e.forceKey === key) ?? null;
}

export function sourceTierForUrl(url: string): SourceTier {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '').toLowerCase();
    if (
      host.endsWith('.police.uk') ||
      host === 'police.uk' ||
      host === 'data.police.uk' ||
      host.endsWith('.gov.uk')
    ) {
      return 1;
    }
    if (host.includes('pcc') || host.includes('hmicfrs') || host.includes('local.gov')) return 2;
    if (
      host.includes('solicitor') ||
      host.includes('yell.com') ||
      host.includes('thomsonlocal') ||
      host.includes('192.com')
    ) {
      return 3;
    }
    return 4;
  } catch {
    return 4;
  }
}
