/**
 * Visual parity (Playwright + pixelmatch) — stabilisation & thresholds.
 * Override via env: VISUAL_PARITY_SOURCE, VISUAL_PARITY_TARGET, VISUAL_PARITY_MAX, VISUAL_PARITY_MASK
 */

import fs from 'fs';
import path from 'path';

const root = process.cwd();

function firstSlug(jsonPath: string, slugKey = 'slug'): string | null {
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(root, jsonPath), 'utf-8'));
    const arr = Array.isArray(raw) ? raw : raw.reps;
    if (!Array.isArray(arr) || arr.length === 0) return null;
    const s = arr[0]?.[slugKey];
    return s ? String(s) : null;
  } catch {
    return null;
  }
}

/** Template paths first when VISUAL_PARITY_MAX limits the run */
export function buildPriorityPaths(): string[] {
  const rep = firstSlug('data/reps.json') || firstSlug('data/scraped-reps.json');
  const station = firstSlug('data/stations.json');
  const wiki = firstSlug('data/wiki-articles.json');
  const legal = firstSlug('data/legal-updates.json');

  const list: string[] = [
    '/',
    '/Directory',
    '/directory',
    '/search',
    '/Blog',
    '/About',
    '/Contact',
    '/Register',
    '/StationsDirectory',
    '/FormsLibrary',
    '/Resources',
    '/FAQ',
    '/Privacy',
    '/Terms',
    '/county/kent',
    '/directory/kent',
  ];
  if (rep) list.push(`/rep/${rep}`);
  if (station) list.push(`/police-station/${station}`);
  if (wiki) list.push(`/Wiki/${wiki}`);
  if (legal) list.push(`/LegalUpdates/${legal}`);
  list.push('/PoliceStationRates');
  list.push('/WhatDoesRepDo');
  return list;
}

/** CSS injected before screenshot (both sites) to reduce animation / layout shift noise */
export const STABILISE_CSS = `
html { scroll-behavior: auto !important; }
*, *::before, *::after {
  animation-duration: 0s !important;
  animation-delay: 0s !important;
  transition-duration: 0s !important;
  transition-delay: 0s !important;
  caret-color: transparent !important;
}
[data-parity-mask] { opacity: 0 !important; pointer-events: none !important; height: 0 !important; overflow: hidden !important; margin: 0 !important; padding: 0 !important; border: none !important; }
`;

/** Optional selectors (source is Wix — IDs differ); extend via VISUAL_PARITY_MASK comma-separated */
export const DEFAULT_MASK_SELECTORS = [
  '[data-parity-mask]',
  '.psr-cookie-bar',
  // Common consent / chat (broad — may need tune per source)
  'iframe[title*="cookie" i]',
  'div[id*="banner" i][class*="cookie" i]',
  /** Wix / consent UI fragments frequently fixed at bottom of viewport */
  'div[role="dialog"][aria-label*="cookie" i]',
  '[data-hook="cookie-banner"]',
  'div[class*="wixui-consent" i]',
];

export const visualParityConfig = {
  sourceBase: (process.env.VISUAL_PARITY_SOURCE || 'https://www.policestationrepuk.com').replace(/\/$/, ''),
  targetBase: (process.env.VISUAL_PARITY_TARGET || 'https://policestationrepuk.org').replace(/\/$/, ''),
  viewport: { width: 1366, height: 900 },
  deviceScaleFactor: 1 as const,
  navigationTimeoutMs: 60000,
  postLoadWaitMs: Math.max(0, parseInt(process.env.VISUAL_PARITY_WAIT_MS || '900', 10) || 900),
  pixelmatch: {
    threshold: parseFloat(process.env.VISUAL_PARITY_PIXEL_THRESHOLD || '0.12'),
    includeAA: false,
    /** rgb tuple per pixelmatch API */
    diffColor: [255, 0, 255] as [number, number, number],
  },
  /** Warn when diff pixel ratio exceeds this */
  warnDiffRatio: parseFloat(process.env.VISUAL_PARITY_WARN_RATIO || '0.02'),
  /** Fail run when any page exceeds this ratio */
  failDiffRatio: parseFloat(process.env.VISUAL_PARITY_FAIL_RATIO || '0.12'),
  /** Fail if more than this fraction of pages error (navigation) */
  maxErrorRatio: parseFloat(process.env.VISUAL_PARITY_MAX_ERROR_RATIO || '0.05'),
  /** Max routes to test (0 = all in-scope) */
  maxPages: parseInt(process.env.VISUAL_PARITY_MAX || '0', 10) || 0,
  shotsDir: path.join(root, 'screenshots'),
  maskSelectors: [
    ...DEFAULT_MASK_SELECTORS,
    ...(process.env.VISUAL_PARITY_MASK || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  ],
} as const;

export type VisualParityConfig = typeof visualParityConfig;
