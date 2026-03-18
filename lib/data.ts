import path from 'path';
import fs from 'fs';
import type { Representative, PoliceStation, County, SearchFilters, WikiArticle, LawFirm, LegalUpdate, FormDocument } from './types';

let _fileData: { counties: County[]; stations: PoliceStation[]; reps: Representative[] } | null = null;

function loadDataFromFiles(): typeof _fileData {
  if (_fileData !== null) return _fileData;
  if (typeof window !== 'undefined') return null;
  try {
    const dir = path.join(process.cwd(), 'data');
    const countiesPath = path.join(dir, 'counties.json');
    const stationsPath = path.join(dir, 'stations.json');
    const repsPath = path.join(dir, 'reps.json');
    if (fs.existsSync(countiesPath) && fs.existsSync(stationsPath) && fs.existsSync(repsPath)) {
      _fileData = {
        counties: JSON.parse(fs.readFileSync(countiesPath, 'utf-8')),
        stations: JSON.parse(fs.readFileSync(stationsPath, 'utf-8')),
        reps: JSON.parse(fs.readFileSync(repsPath, 'utf-8')),
      };
      return _fileData;
    }
  } catch {
    // ignore missing or invalid data files
  }
  return null;
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
    (s) => s.forceName?.toLowerCase().includes(county.toLowerCase()) ||
           s.county?.toLowerCase() === county.toLowerCase()
  );
}

export async function getRepsByCounty(county: string): Promise<Representative[]> {
  const file = loadDataFromFiles();
  if (!file) return [];
  return file.reps.filter((r) => r.county.toLowerCase() === county.toLowerCase());
}

export async function getRepBySlug(slug: string): Promise<Representative | undefined> {
  const file = loadDataFromFiles();
  return file?.reps.find((r) => r.slug === slug);
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
  return file.reps.filter((r) => r.stations.some((s) => s.toLowerCase().includes(stationName.toLowerCase())));
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
    results = results.filter((r) => r.county.toLowerCase() === filters.county!.toLowerCase());
  }
  if (filters.station) {
    results = results.filter((r) => r.stations.some((s) => s.toLowerCase().includes(filters.station!.toLowerCase())));
  }
  if (filters.availability) {
    results = results.filter((r) => r.availability.toLowerCase() === filters.availability!.toLowerCase());
  }
  if (filters.accreditation) {
    const acc = filters.accreditation.toLowerCase();
    results = results.filter((r) => r.accreditation.toLowerCase().includes(acc));
  }
  if (filters.query) {
    const q = filters.query.toLowerCase();
    results = results.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.county.toLowerCase().includes(q) ||
        r.stations.some((s) => s.toLowerCase().includes(q)),
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
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch { /* ignore */ }
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
  return loadJsonFile<LawFirm>('law-firms.json');
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
