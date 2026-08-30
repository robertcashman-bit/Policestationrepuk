import { describe, expect, it } from 'vitest';
import { hasSlugSpecificSources } from '@/lib/content-sources';
import { buildInventory } from '@/lib/editorial-audit/inventory';

/** Batch-5 directory/availability posts previously flagged as GAP (generic-content-sources). */
const BATCH_5_DIRECTORY_SLUGS = [
  'accredited-reps-keep-availability-updated',
  'keep-directory-profile-useful',
  'police-station-rep-coverage-location-matters',
] as const;

describe('batch-5 directory blog content-sources', () => {
  it('registers page-specific BLOG_SLUG mappings (slug keys are lowercase)', () => {
    for (const slug of BATCH_5_DIRECTORY_SLUGS) {
      expect(hasSlugSpecificSources({ kind: 'blog', slug })).toBe(true);
      // Inventory / audit URLs may appear as /Blog/...; slug keys stay lowercase.
      expect(slug).toBe(slug.toLowerCase());
    }
  });

  it('clears GAP for /Blog/… paths in the content-accuracy inventory', () => {
    const items = buildInventory();
    for (const slug of BATCH_5_DIRECTORY_SLUGS) {
      const item = items.find((i) => i.url === `/Blog/${slug}`);
      expect(item, `missing inventory item for /Blog/${slug}`).toBeDefined();
      const gaps = item!.redFlags.filter((f) => f.severity === 'GAP');
      expect(gaps, `${item!.url} still has GAP: ${gaps.map((g) => g.code).join(', ')}`).toEqual([]);
    }
  });
});
