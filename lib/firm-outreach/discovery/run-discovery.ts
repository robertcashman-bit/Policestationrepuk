import { readFileSync } from 'fs';
import { resolve } from 'path';
import { ensureDsccRegisterCache } from '@/lib/dscc-register-lookup';
import { readLaaCrimeJson } from '@/lib/legal-directory/laa-fetch';
import { listApprovedListings } from '@/lib/legal-directory/storage';
import { normalizeFirmName } from '@robertcashman/firm-outreach-core';
import { AGENT_COVER_KENT_CAMPAIGN_ID } from '../campaign-scope';
import { countyAllowlist } from '../constants';
import { filterKentInputs, isKentProspectInput } from '../kent-filter';
import {
  archiveFirmsToInputs,
  buildProspectForCampaign,
  buildProspectFromInput,
  dsccEntriesToInputs,
  laaRecordsToInputs,
  mergeProspect,
  type ArchiveLawFirm,
  type RawProspectInput,
} from '../merge-prospects';
import { FIRM_OUTREACH_CAMPAIGN_ID } from '../site-config';
import { buildCrimeRegistry } from '../qualification';
import { getProspectsByIds, saveProspect } from '../storage';
import type { DiscoveryRunStats, FirmProspect } from '../types';

const DISCOVERY_WRITE_CONCURRENCY = 20;

/** Compare prospects ignoring updatedAt (merge always bumps the timestamp). */
function prospectPayloadEqual(a: FirmProspect, b: FirmProspect): boolean {
  const strip = ({ updatedAt: _u, ...rest }: FirmProspect) => rest;
  return JSON.stringify(strip(a)) === JSON.stringify(strip(b));
}

async function mapPool<T>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<void>,
): Promise<void> {
  let next = 0;
  const runners = Array.from({ length: Math.max(1, concurrency) }, async () => {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      await worker(items[i], i);
    }
  });
  await Promise.all(runners);
}

/** Keep geo-Kent rows plus DSCC firms whose name matches a Kent LAA firm. */
export function filterAgentCoverKentInputs(
  inputs: RawProspectInput[],
  kentLaaFirmNames: Set<string>,
): RawProspectInput[] {
  return inputs.filter((input) => {
    if (isKentProspectInput(input)) return true;
    if (input.prospectType !== 'firm') return false;
    if (input.source !== 'dscc') return false;
    return kentLaaFirmNames.has(normalizeFirmName(input.firmName));
  });
}

const ARCHIVE_PATH = resolve(process.cwd(), 'data/archive/law-firms.json');

function loadArchiveFirms(): ArchiveLawFirm[] {
  try {
    return JSON.parse(readFileSync(ARCHIVE_PATH, 'utf-8')) as ArchiveLawFirm[];
  } catch {
    return [];
  }
}

function countyAllowed(county: string | undefined, allowlist: string[] | null): boolean {
  if (!allowlist?.length) return true;
  const c = (county ?? '').trim().toLowerCase();
  if (!c) return true;
  return allowlist.some((a) => c.includes(a) || a.includes(c));
}

function filterByCounty(
  inputs: RawProspectInput[],
  allowlist: string[] | null,
): RawProspectInput[] {
  return inputs.filter((i) => countyAllowed(i.county, allowlist));
}

async function directoryInputs(): Promise<RawProspectInput[]> {
  try {
    const listings = await listApprovedListings();
    return listings
      .filter((l) => l.categorySlug === 'solicitors' || l.categorySlug === 'prison-law')
      .map((l) => ({
        prospectType: 'firm' as const,
        firmName: l.businessName,
        town: l.town,
        county: l.county,
        postcode: l.postcode,
        phone: l.phone,
        websiteUrl: l.websiteUrl,
        regulatoryNumber: l.regulatoryNumber,
        email: l.ownerEmail || l.email,
        emailConfidence: 'directory' as const,
        emailScore: 90,
        source: 'directory' as const,
        priorityBoost: 40,
      }))
      .filter((i) => i.email?.trim());
  } catch (err) {
    console.warn('[firm-outreach] directory import skipped:', err);
    return [];
  }
}

export async function runFirmDiscovery(opts?: {
  campaignId?: string;
  countyAllowlist?: string[] | null;
}): Promise<DiscoveryRunStats> {
  const started = Date.now();
  const campaignId = opts?.campaignId ?? FIRM_OUTREACH_CAMPAIGN_ID;
  const isAgentCover = campaignId === AGENT_COVER_KENT_CAMPAIGN_ID;
  // PSA offer is Kent cover, but recipients are nationwide (England & Wales).
  // Pass countyAllowlist: ['kent'] only for legacy Kent-only discovery runs.
  const allowlist = isAgentCover
    ? (opts?.countyAllowlist !== undefined ? opts.countyAllowlist : null)
    : (opts?.countyAllowlist ?? countyAllowlist());

  const laa = readLaaCrimeJson();
  const archive = loadArchiveFirms();
  const dscc = await ensureDsccRegisterCache();
  const directory = await directoryInputs();

  const dsccInputs = dscc?.entries?.length ? dsccEntriesToInputs(dscc.entries) : [];
  const dsccFirms = dsccInputs.filter((i) => i.prospectType === 'firm').length;
  const dsccSolicitors = dsccInputs.filter((i) => i.prospectType === 'solicitor').length;
  const crimeRegistry = buildCrimeRegistry(laa, dscc?.entries ?? []);
  const archiveInputs = archiveFirmsToInputs(archive, crimeRegistry);

  let allInputs = filterByCounty(
    [...laaRecordsToInputs(laa), ...archiveInputs, ...dsccInputs, ...directory],
    allowlist,
  );
  // Legacy opt-in: only when an explicit Kent allowlist is requested.
  if (isAgentCover && allowlist?.some((a) => a.toLowerCase().includes('kent'))) {
    const kentLaaNames = new Set(
      filterKentInputs(laaRecordsToInputs(laa)).map((i) => normalizeFirmName(i.firmName)),
    );
    allInputs = filterAgentCoverKentInputs(allInputs, kentLaaNames);
  }

  const built: FirmProspect[] = [];
  let excluded = 0;
  for (const input of allInputs) {
    const prospect = isAgentCover
      ? buildProspectForCampaign(campaignId, input)
      : buildProspectFromInput(input);
    if (!prospect) continue;
    if (prospect.status === 'excluded') excluded++;
    built.push(prospect);
  }

  // Batch-read existing rows — sequential getProspect/saveProspect was hanging for
  // tens of minutes on nationwide DSCC+LAA merges (N× Redis round-trips).
  const existingMap = await getProspectsByIds(built.map((p) => p.id));

  let created = 0;
  let updated = 0;
  let unchanged = 0;

  await mapPool(built, DISCOVERY_WRITE_CONCURRENCY, async (prospect) => {
    const existing = existingMap.get(prospect.id);
    if (!existing) {
      await saveProspect(prospect);
      created++;
      return;
    }
    const merged = mergeProspect(existing, prospect);
    if (prospectPayloadEqual(merged, existing)) {
      unchanged++;
      return;
    }
    await saveProspect(merged, existing.status);
    updated++;
  });

  console.log(
    `[firm-outreach discovery] campaign=${campaignId} inputs=${allInputs.length} built=${built.length} created=${created} updated=${updated} unchanged=${unchanged} excluded=${excluded} elapsedMs=${Date.now() - started}`,
  );

  return {
    laaRows: laa.length,
    dsccFirms,
    dsccSolicitors,
    archiveRows: archiveInputs.length,
    archiveSkipped: archive.length - archiveInputs.length,
    directoryRows: directory.length,
    created,
    updated,
    excluded,
    elapsedMs: Date.now() - started,
  };
}
