import type { MetadataRoute } from 'next';
import {
  getAllCounties,
  getAllReps,
  getAllStations,
  countySlugToPageSlug,
  getAllWikiArticles,
  getAllLegalUpdates,
} from '@/lib/data';
import { getMirrorPaths, hasMirrorData } from '@/lib/mirror-data';
import { SITEMAP_PATHS } from '@/lib/sitemap-paths';

const BASE = 'https://policestationrepuk.com';
const now = new Date();

const HIGH_PRIORITY_PAGES = [
  { path: '', priority: 1, freq: 'daily' as const },
  { path: 'directory', priority: 0.95, freq: 'daily' as const },
  { path: 'register', priority: 0.9, freq: 'weekly' as const },
  { path: 'Blog', priority: 0.85, freq: 'daily' as const },
  { path: 'StationsDirectory', priority: 0.85, freq: 'weekly' as const },
  { path: 'FormsLibrary', priority: 0.8, freq: 'monthly' as const },
  { path: 'Resources', priority: 0.8, freq: 'monthly' as const },
  { path: 'About', priority: 0.7, freq: 'monthly' as const },
  { path: 'Contact', priority: 0.7, freq: 'monthly' as const },
  { path: 'FAQ', priority: 0.7, freq: 'monthly' as const },
  { path: 'CustodyNote', priority: 0.7, freq: 'monthly' as const },
  { path: 'Premium', priority: 0.75, freq: 'weekly' as const },
  { path: 'Forces', priority: 0.7, freq: 'monthly' as const },
  { path: 'Firms', priority: 0.7, freq: 'monthly' as const },
  { path: 'GetWork', priority: 0.7, freq: 'monthly' as const },
  { path: 'HowToBecomePoliceStationRep', priority: 0.75, freq: 'monthly' as const },
  { path: 'PoliceStationRates', priority: 0.7, freq: 'monthly' as const },
  { path: 'PACE', priority: 0.7, freq: 'monthly' as const },
  { path: 'WhatsApp', priority: 0.6, freq: 'monthly' as const },
  { path: 'GoFeatured', priority: 0.6, freq: 'monthly' as const },
  { path: 'PoliceStationCover', priority: 0.65, freq: 'monthly' as const },
  { path: 'PoliceStationRepJobsUK', priority: 0.65, freq: 'weekly' as const },
  { path: 'LegalUpdates', priority: 0.75, freq: 'weekly' as const },
  { path: 'Forum', priority: 0.5, freq: 'monthly' as const },
  { path: 'Wiki', priority: 0.8, freq: 'weekly' as const },
  { path: 'AboutFounder', priority: 0.6, freq: 'monthly' as const },
  { path: 'BeginnersGuide', priority: 0.7, freq: 'monthly' as const },
  { path: 'InterviewUnderCaution', priority: 0.7, freq: 'monthly' as const },
  { path: 'WhatDoesRepDo', priority: 0.7, freq: 'monthly' as const },
  { path: 'DutySolicitorVsRep', priority: 0.65, freq: 'monthly' as const },
  { path: 'CriminalLawCareerGuide', priority: 0.6, freq: 'monthly' as const },
  { path: 'DSCCRegistrationGuide', priority: 0.6, freq: 'monthly' as const },
  { path: 'PoliceDisclosureGuide', priority: 0.65, freq: 'monthly' as const },
  { path: 'PoliceStationRepPay', priority: 0.65, freq: 'monthly' as const },
  { path: 'CrownCourtFees', priority: 0.6, freq: 'monthly' as const },
  { path: 'MagistratesCourtFees', priority: 0.6, freq: 'monthly' as const },
  { path: 'PrepareForCIT', priority: 0.6, freq: 'monthly' as const },
  { path: 'AccreditedRepresentativeGuide', priority: 0.65, freq: 'monthly' as const },
  { path: 'BuildPortfolioGuide', priority: 0.6, freq: 'monthly' as const },
  { path: 'GettingStarted', priority: 0.65, freq: 'monthly' as const },
  { path: 'RepFAQMaster', priority: 0.6, freq: 'monthly' as const },
  { path: 'RepsHub', priority: 0.6, freq: 'monthly' as const },
  { path: 'SolicitorPoliceStationCoverUK', priority: 0.6, freq: 'monthly' as const },
  { path: 'KentPoliceStationReps', priority: 0.65, freq: 'monthly' as const },
  { path: 'EscapeFeeCalculator', priority: 0.65, freq: 'monthly' as const },
  { path: 'Privacy', priority: 0.3, freq: 'yearly' as const },
  { path: 'Terms', priority: 0.3, freq: 'yearly' as const },
  { path: 'Cookies', priority: 0.3, freq: 'yearly' as const },
  { path: 'GDPR', priority: 0.3, freq: 'yearly' as const },
  { path: 'DataProtection', priority: 0.3, freq: 'yearly' as const },
  { path: 'Accessibility', priority: 0.3, freq: 'yearly' as const },
  { path: 'Complaints', priority: 0.3, freq: 'yearly' as const },
];

const HIGH_PRIORITY_SET = new Set(HIGH_PRIORITY_PAGES.map((p) => p.path));

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = HIGH_PRIORITY_PAGES.map((p) => ({
    url: p.path ? `${BASE}/${p.path}` : BASE,
    lastModified: now,
    changeFrequency: p.freq,
    priority: p.priority,
  }));

  if (hasMirrorData()) {
    const paths = getMirrorPaths().filter(
      (p) => p !== '/' && !HIGH_PRIORITY_SET.has(p)
    );
    for (const p of paths) {
      entries.push({
        url: `${BASE}/${p}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.5,
      });
    }
  } else {
    for (const p of SITEMAP_PATHS) {
      if (!HIGH_PRIORITY_SET.has(p)) {
        entries.push({
          url: `${BASE}/${p}`,
          lastModified: now,
          changeFrequency: 'weekly',
          priority: 0.5,
        });
      }
    }
  }

  const [counties, reps, stations, wikiArticles, legalUpdates] = await Promise.all([
    getAllCounties(),
    getAllReps(),
    getAllStations(),
    getAllWikiArticles(),
    getAllLegalUpdates(),
  ]);
  const countyUrls = counties.map((c) => ({
    url: `${BASE}/${countySlugToPageSlug(c.slug)}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));
  const repUrls = reps.map((r) => ({
    url: `${BASE}/rep/${r.slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));
  const stationUrls = stations.map((s) => ({
    url: `${BASE}/police-station/${s.slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));
  const wikiUrls = wikiArticles
    .filter((a) => a.slug)
    .map((a) => ({
      url: `${BASE}/Wiki/${a.slug}`,
      lastModified: a.lastImprovedDate ? new Date(a.lastImprovedDate) : now,
      changeFrequency: 'monthly' as const,
      priority: 0.65,
    }));
  const legalUpdateUrls = legalUpdates.map((u) => ({
    url: `${BASE}/LegalUpdates/${u.slug}`,
    lastModified: u.publishedDate ? new Date(u.publishedDate) : now,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [...entries, ...countyUrls, ...repUrls, ...stationUrls, ...wikiUrls, ...legalUpdateUrls];
}
