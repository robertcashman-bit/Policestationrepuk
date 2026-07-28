/**
 * Guard: Russell Rouse must not appear in any live directory source or
 * public rep APIs. Historical crawl/audit dumps are out of scope for HTML.
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { getRawReps, getAllReps, getRepBySlug } from '@/lib/data';

const FORBIDDEN_NAME = /russell\s+rouse/i;
const FORBIDDEN_SLUG = 'russell-rouse';
const FORBIDDEN_ID = '68b00c0005141ab444f6e4d2';
const FORBIDDEN_PHONE = /07734[\s)]*261121/;

function readJsonArray(rel: string): unknown[] {
  const abs = path.join(process.cwd(), rel);
  const raw = JSON.parse(fs.readFileSync(abs, 'utf8')) as unknown;
  expect(Array.isArray(raw), `${rel} should be a JSON array`).toBe(true);
  return raw as unknown[];
}

function rowMentionsRouse(row: unknown): boolean {
  if (row == null || typeof row !== 'object') return false;
  const o = row as Record<string, unknown>;
  const name = String(o.name ?? '');
  const slug = String(o.slug ?? '');
  const id = String(o.id ?? '');
  const phone = String(o.phone ?? '');
  return (
    FORBIDDEN_NAME.test(name) ||
    slug === FORBIDDEN_SLUG ||
    id === FORBIDDEN_ID ||
    FORBIDDEN_PHONE.test(phone)
  );
}

describe('Russell Rouse removed from directory', () => {
  it('is absent from data/reps.json', () => {
    const reps = readJsonArray('data/reps.json');
    const hits = reps.filter(rowMentionsRouse);
    expect(hits, 'data/reps.json still contains Russell Rouse').toEqual([]);
  });

  it('is absent from data/scraped-reps.json', () => {
    const reps = readJsonArray('data/scraped-reps.json');
    const hits = reps.filter(rowMentionsRouse);
    expect(hits, 'data/scraped-reps.json still contains Russell Rouse').toEqual([]);
  });

  it('is absent from data/reps-export.csv', () => {
    const csv = fs.readFileSync(path.join(process.cwd(), 'data/reps-export.csv'), 'utf8');
    expect(csv).not.toMatch(FORBIDDEN_NAME);
    expect(csv).not.toContain(FORBIDDEN_ID);
    expect(csv).not.toMatch(FORBIDDEN_PHONE);
  });

  it('is absent from getRawReps()', () => {
    const hits = getRawReps().filter(
      (r) =>
        FORBIDDEN_NAME.test(r.name) ||
        r.slug === FORBIDDEN_SLUG ||
        r.id === FORBIDDEN_ID ||
        FORBIDDEN_PHONE.test(r.phone || ''),
    );
    expect(hits).toEqual([]);
  });

  it('is absent from getAllReps() and getRepBySlug()', async () => {
    const all = await getAllReps();
    const hits = all.filter(
      (r) =>
        FORBIDDEN_NAME.test(r.name) ||
        r.slug === FORBIDDEN_SLUG ||
        r.id === FORBIDDEN_ID ||
        FORBIDDEN_PHONE.test(r.phone || ''),
    );
    expect(hits).toEqual([]);

    const bySlug = await getRepBySlug(FORBIDDEN_SLUG);
    expect(bySlug).toBeUndefined();
  });
});
