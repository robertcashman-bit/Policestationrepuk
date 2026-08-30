import { hasSlugSpecificSources, type ContentSourceContext } from '@/lib/content-sources';
import type { AuditUnit, RedFlag } from './types';

export function contentSourceContextForUnit(unit: AuditUnit): ContentSourceContext | null {
  switch (unit.contentType) {
    case 'blog': {
      const slug = unit.url.replace(/^\/Blog\//, '');
      return { kind: 'blog', slug };
    }
    case 'wiki': {
      const slug = unit.url.replace(/^\/Wiki\//, '');
      return { kind: 'wiki', slug, category: '' };
    }
    case 'legal-update': {
      const slug = unit.url.replace(/^\/LegalUpdates\//, '');
      return { kind: 'legal-update', slug };
    }
    case 'guide':
    case 'fee-rights':
      return { kind: 'page', path: unit.url };
    default:
      return null;
  }
}

/**
 * When rules/sources already flagged claims, also note a missing content-sources.ts map.
 * Only on sectionIndex 0. Inventory still tracks GAP separately for offline reports.
 */
export function scanContentSourcesMapping(
  unit: AuditUnit,
  priorFlags: RedFlag[] = [],
): RedFlag[] {
  if (unit.sectionIndex !== 0) return [];
  if (priorFlags.length === 0) return [];
  const ctx = contentSourceContextForUnit(unit);
  if (!ctx) return [];
  if (hasSlugSpecificSources(ctx)) return [];

  return [
    {
      severity: 'REVIEW',
      code: 'missing-content-sources-map',
      message:
        'Flagged claims have no dedicated slug/path mapping in lib/content-sources.ts',
    },
  ];
}
