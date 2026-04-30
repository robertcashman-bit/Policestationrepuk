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

/** RFC / reserved doc domains and CI registrations — never show in public directory. */
const RESERVED_DOC_EMAIL_SUFFIXES = [
  '@example.com',
  '@example.org',
  '@example.net',
  '@example.co.uk',
];

/**
 * E2E and API tests POST real registrations to KV; hide those listings from the live directory.
 */
export function repIsAutomatedDirectoryTest(rep: Representative): boolean {
  const email = rep.email.toLowerCase();
  if (RESERVED_DOC_EMAIL_SUFFIXES.some((s) => email.endsWith(s))) return true;

  const name = rep.name.trim();
  if (/^playwright test\b/i.test(name)) return true;
  if (/^api test\b/i.test(name)) return true;
  if (/^dup test\b/i.test(name)) return true;

  const notes = (rep.notes ?? '').toLowerCase();
  if (notes.includes('automated playwright test submission')) return true;
  if (notes.includes('playwright api test')) return true;

  const slug = rep.slug.toLowerCase();
  if (slug.startsWith('playwright-test-')) return true;
  if (slug.startsWith('api-test-')) return true;
  if (slug.startsWith('dup-test-')) return true;

  return false;
}
