import path from 'path';
import fs from 'fs';
import type { Representative, PoliceStation, County, SearchFilters, WikiArticle, LawFirm, LegalUpdate, FormDocument } from './types';
import {
  mergeScrapedWithFallback,
  fallbackOnlyReps,
  coerceScrapedRows,
  finalizeRepresentative,
} from './rep-merge';
import { repMatchesCountyName } from './county-matching';

type FileData = {
  counties: County[];
  stations: PoliceStation[];
  reps: Representative[];
  /** alternate URL slug -> canonical slug */
  slugAliases: Record<string, string>;
  /** 'scraped' | 'fallback' — which list drove rep count */
  repSource: 'scraped' | 'fallback';
};

let _fileData: FileData | null = null;

function readJson<T>(filePath: string): T | null {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
    }
  } catch {
    /* invalid JSON or missing — treat as unavailable */
  }
  return null;
}

function trimField(s: unknown): string {
  if (s == null) return '';
  return String(s).trim();
}

/** When county is missing, infer from first matching station in stations.json. */
function enrichRepCountyFromStations(rep: Representative, stations: PoliceStation[]): Representative {
  if (trimField(rep.county)) return rep;
  for (const label of rep.stations || []) {
    const needle = label.toLowerCase().trim();
    if (!needle) continue;
    const hit = stations.find((s) => {
      const n = trimField(s.name).toLowerCase();
      return n && (n.includes(needle) || needle.includes(n));
    });
    if (hit) {
      const c = trimField(hit.county) || trimField(hit.forceName);
      if (c) {
        return {
          ...rep,
          county: c,
          addressCounty: trimField(rep.addressCounty) || c,
        };
      }
    }
  }
  return rep;
}

function dedupeRepsBySlug(reps: Representative[]): Representative[] {
  const seen = new Set<string>();
  const out: Representative[] = [];
  for (const r of reps) {
    const key = (r.slug || '').toLowerCase();
    if (!key || key === 'unknown') continue;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r);
  }
  return out;
}

function loadDataFromFiles(): FileData | null {
  if (_fileData !== null) return _fileData;
  if (typeof window !== 'undefined') return null;

  try {
    const dir = path.join(process.cwd(), 'data');
    const countiesPath = path.join(dir, 'counties.json');
    const stationsPath = path.join(dir, 'stations.json');
    const scrapedPath = path.join(dir, 'scraped-reps.json');
    const repsPath = path.join(dir, 'reps.json');

    if (!fs.existsSync(countiesPath) || !fs.existsSync(stationsPath)) {
      return null;
    }

    const counties: County[] = readJson(countiesPath) ?? [];
    const stations: PoliceStation[] = readJson(stationsPath) ?? [];
    const fallbackRepsRaw = readJson<unknown>(repsPath);
    const fallbackReps: Representative[] = Array.isArray(fallbackRepsRaw)
      ? (fallbackRepsRaw as Representative[])
      : [];

    const scrapedParsed = readJson<unknown>(scrapedPath);
    const scrapedRows = coerceScrapedRows(scrapedParsed);
    const useScraped = scrapedRows.length > 0;

    let merged: { reps: Representative[]; slugAliases: Record<string, string> };
    let repSource: 'scraped' | 'fallback';

    if (useScraped) {
      try {
        merged = mergeScrapedWithFallback(scrapedRows, fallbackReps);
        repSource = 'scraped';
      } catch {
        merged = fallbackOnlyReps(fallbackReps);
        repSource = 'fallback';
      }
    } else {
      merged = fallbackOnlyReps(fallbackReps);
      repSource = 'fallback';
    }

    const reps = dedupeRepsBySlug(merged.reps)
      .map((r) => enrichRepCountyFromStations(r, stations))
      .map((r) => finalizeRepresentative(r));

    _fileData = {
      counties,
      stations,
      reps,
      slugAliases: merged.slugAliases,
      repSource,
    };
    return _fileData;
  } catch {
    return null;
  }
}

function resolveRepSlug(slug: string): string {
  const file = loadDataFromFiles();
  if (!file) return slug;
  const lower = slug.toLowerCase();
  if (file.slugAliases[slug]) return file.slugAliases[slug];
  if (file.slugAliases[lower]) return file.slugAliases[lower];
  const hit = Object.entries(file.slugAliases).find(([k]) => k.toLowerCase() === lower);
  return hit ? hit[1] : slug;
}

/** All slug values that should resolve to a rep profile (canonical + aliases). */
export function getAllRepPathSlugs(): string[] {
  const file = loadDataFromFiles();
  if (!file) return [];
  const slugs = new Set<string>();
  for (const r of file.reps) slugs.add(r.slug);
  for (const [alias, canonical] of Object.entries(file.slugAliases)) {
    slugs.add(alias);
    slugs.add(canonical);
  }
  return [...slugs];
}

/** For diagnostics / API: whether directory reps came from scrape merge or reps.json only */
export function getDirectoryRepSource(): 'scraped' | 'fallback' | 'none' {
  const file = loadDataFromFiles();
  if (!file) return 'none';
  return file.repSource;
}

export async function getAllCounties(): Promise<County[]> {
  const file = loadDataFromFiles();
  return file?.counties ?? [];
}

export async function getCountyBySlug(slug: string): Promise<County | undefined> {
  const file = loadDataFromFiles();
  return file?.counties.find((c) => c.slug === slug);
}

export async function getStationsByCounty(county: string): Promise<PoliceStation[]> {
  const file = loadDataFromFiles();
  if (!file) return [];
  return file.stations.filter(
    (s) =>
      s.forceName?.toLowerCase().includes(county.toLowerCase()) ||
      s.county?.toLowerCase() === county.toLowerCase(),
  );
}

export async function getRepsByCounty(county: string): Promise<Representative[]> {
  const file = loadDataFromFiles();
  if (!file) return [];
  return file.reps.filter((r) => repMatchesCountyName(r.county, county));
}

export async function getRepBySlug(slug: string): Promise<Representative | undefined> {
  const file = loadDataFromFiles();
  if (!file) return undefined;
  const canonical = resolveRepSlug(slug);
  const lower = canonical.toLowerCase();
  return file.reps.find((r) => r.slug.toLowerCase() === lower);
}

export async function getAllReps(): Promise<Representative[]> {
  const file = loadDataFromFiles();
  return file?.reps ?? [];
}

export async function getStationBySlug(slug: string): Promise<PoliceStation | undefined> {
  const file = loadDataFromFiles();
  return file?.stations.find((s) => s.slug === slug);
}

export async function getAllStations(): Promise<PoliceStation[]> {
  const file = loadDataFromFiles();
  return file?.stations ?? [];
}

export async function getRepsByStation(stationName: string): Promise<Representative[]> {
  const file = loadDataFromFiles();
  if (!file) return [];
  const q = stationName.toLowerCase();
  return file.reps.filter((r) => (r.stations || []).some((s) => s.toLowerCase().includes(q)));
}

export function countySlugToPageSlug(countySlug: string): string {
  return `police-station-representatives-${countySlug}`;
}

export function pageSlugToCountySlug(pageSlug: string): string {
  return pageSlug.replace('police-station-representatives-', '');
}

export async function searchRepresentatives(filters: SearchFilters): Promise<Representative[]> {
  let results = await getAllReps();
  if (filters.county) {
    results = results.filter((r) => repMatchesCountyName(r.county, filters.county!));
  }
  if (filters.station) {
    const st = filters.station.toLowerCase();
    results = results.filter((r) => (r.stations || []).some((s) => s.toLowerCase().includes(st)));
  }
  if (filters.availability) {
    const a = filters.availability.toLowerCase();
    results = results.filter((r) => (r.availability || '').toLowerCase().includes(a));
  }
  if (filters.accreditation) {
    const acc = filters.accreditation.toLowerCase();
    results = results.filter((r) => (r.accreditation || '').toLowerCase().includes(acc));
  }
  if (filters.query) {
    const q = filters.query.toLowerCase();
    results = results.filter(
      (r) =>
        (r.name || '').toLowerCase().includes(q) ||
        (r.county || '').toLowerCase().includes(q) ||
        (r.stations || []).some((s) => s.toLowerCase().includes(q)),
    );
  }
  return results;
}

// --- New entity loaders ---

function loadJsonFile<T>(filename: string): T[] {
  if (typeof window !== 'undefined') return [];
  try {
    const filePath = path.join(process.cwd(), 'data', filename);
    if (fs.existsSync(filePath)) {
      const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      return Array.isArray(raw) ? raw : [];
    }
  } catch {
    /* ignore */
  }
  return [];
}

export async function getAllWikiArticles(): Promise<WikiArticle[]> {
  return loadJsonFile<WikiArticle>('wiki-articles.json');
}

export async function getWikiArticleBySlug(slug: string): Promise<WikiArticle | undefined> {
  const articles = await getAllWikiArticles();
  return articles.find((a) => a.slug === slug);
}

export async function getWikiArticlesByCategory(category: string): Promise<WikiArticle[]> {
  const articles = await getAllWikiArticles();
  return articles.filter((a) => a.category === category);
}

export async function getAllLawFirms(): Promise<LawFirm[]> {
  const raw = loadJsonFile<LawFirm>('law-firms.json');
  const seen = new Set<string>();
  const deduped: LawFirm[] = [];
  for (const f of raw) {
    const key = f.sraNumber?.trim()
      ? `sra:${f.sraNumber.trim()}`
      : `slug:${f.slug}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(f);
  }
  return deduped;
}

export async function getLawFirmBySlug(slug: string): Promise<LawFirm | undefined> {
  const firms = await getAllLawFirms();
  return firms.find((f) => f.slug === slug);
}

export async function getLawFirmsByCounty(county: string): Promise<LawFirm[]> {
  const firms = await getAllLawFirms();
  return firms.filter((f) => f.county.toLowerCase() === county.toLowerCase());
}

export async function getAllLegalUpdates(): Promise<LegalUpdate[]> {
  return loadJsonFile<LegalUpdate>('legal-updates.json');
}

export async function getLegalUpdateBySlug(slug: string): Promise<LegalUpdate | undefined> {
  const updates = await getAllLegalUpdates();
  return updates.find((u) => u.slug === slug);
}

export async function getAllFormDocuments(): Promise<FormDocument[]> {
  return loadJsonFile<FormDocument>('form-documents.json');
}
