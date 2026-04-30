import fs from 'fs';
import path from 'path';
import type { Representative } from './types';

export type DirectoryBlocklistFile = {
  emails?: string[];
  slugs?: string[];
  slugPrefixes?: string[];
  /** Normalised full names, e.g. "laurie learmont" (see normalizePersonName) */
  normalizedNames?: string[];
};

let _cached: DirectoryBlocklistFile | null = null;

export function loadDirectoryBlocklistFile(): DirectoryBlocklistFile {
  if (_cached) return _cached;
  if (typeof window !== 'undefined') {
    _cached = {};
    return _cached;
  }
  const filePath = path.join(process.cwd(), 'data', 'directory-blocklist.json');
  if (!fs.existsSync(filePath)) {
    _cached = {};
    return _cached;
  }
  try {
    _cached = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as DirectoryBlocklistFile;
  } catch {
    _cached = {};
  }
  return _cached;
}

export function normalizePersonName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function repMatchesDirectoryBlocklist(
  rep: Representative,
  bl: DirectoryBlocklistFile,
): boolean {
  const email = rep.email.toLowerCase();
  if (bl.emails?.some((e) => e.toLowerCase() === email)) return true;
  const slug = rep.slug.toLowerCase();
  if (bl.slugs?.some((s) => s.toLowerCase() === slug)) return true;
  for (const prefix of bl.slugPrefixes ?? []) {
    if (slug.startsWith(prefix.toLowerCase())) return true;
  }
  const nn = normalizePersonName(rep.name);
  for (const n of bl.normalizedNames ?? []) {
    if (nn === normalizePersonName(n) || nn === n.trim().toLowerCase()) return true;
  }
  return false;
}
