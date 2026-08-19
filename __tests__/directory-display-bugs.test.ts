import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';

describe('directory display bugfixes', () => {
  it('does not use a literal \\u2026 in the station filter JSX attribute', () => {
    const src = readFileSync('components/directory/FilterSidebar.tsx', 'utf8');
    expect(src).not.toMatch(/placeholder="Filter by station\\u2026"/);
    expect(src).toMatch(/Filter by station/);
  });

  it('keeps Featured badge in-flow on DirectoryCard (no absolute overlap)', () => {
    const src = readFileSync('components/DirectoryCard.tsx', 'utf8');
    expect(src).not.toMatch(/absolute left-3 top-4[\s\S]*Featured/);
    expect(src).toMatch(/hideFeatured/);
  });

  it('seeds Suspense fallback with real listings, not grey skeletons', () => {
    const page = readFileSync('app/directory/page.tsx', 'utf8');
    expect(page).toContain('DirectorySeededResults');
    expect(page).not.toMatch(/Suspense fallback=\{<ResultsGridSkeleton/);
  });

  it('places featured upsell and FAQ below directory search results', () => {
    const page = readFileSync('app/directory/page.tsx', 'utf8');
    const searchIdx = page.indexOf('<DirectorySearch');
    const advertIdx = page.indexOf('<FeaturedListingAdvert');
    const faqIdx = page.indexOf('<FeaturedListingFaq');
    expect(searchIdx).toBeGreaterThan(-1);
    expect(advertIdx).toBeGreaterThan(searchIdx);
    expect(faqIdx).toBeGreaterThan(searchIdx);
  });

  it('removes user-visible LLM summary block heading from Kent pillar page', () => {
    const src = readFileSync('app/police-station-rep-kent/page.tsx', 'utf8');
    expect(src).not.toMatch(/LLM summary block/i);
  });
});
