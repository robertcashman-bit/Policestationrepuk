import { describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';

describe('Find-station search flow', () => {
  it('has a find-station page with server clear-match redirect', async () => {
    const page = await fs.readFile('app/find-station/page.tsx', 'utf-8');
    expect(page).toContain('findClearStationMatch');
    expect(page).toContain('redirect(`/police-station/${clear.slug}`)');
    expect(page).toContain('StationSearchPickList');
    expect(page).toContain('FindStationSearch');
  });

  it('redirects StationsDirectory ?q= to find-station', async () => {
    const page = await fs.readFile('app/StationsDirectory/page.tsx', 'utf-8');
    expect(page).toContain('buildFindStationSearchUrl');
    expect(page).toContain('redirect(buildFindStationSearchUrl(searchQuery))');
  });

  it('homepage search targets find-station', async () => {
    const home = await fs.readFile('components/HomeStationSearch.tsx', 'utf-8');
    expect(home).toContain('buildFindStationSearchUrl');
    expect(home).toContain('/find-station');
  });

  it('nav Station Numbers points to find-station', async () => {
    const nav = await fs.readFile('lib/site-navigation.ts', 'utf-8');
    expect(nav).toContain("href: '/find-station', text: 'Station Numbers'");
  });
});

describe('Browse cards have no phones', () => {
  it('directory cards link to station page without StationPhone', async () => {
    const card = await fs.readFile('components/stations/StationDirectoryCard.tsx', 'utf-8');
    expect(card).toContain('/police-station/');
    expect(card).toContain('View station');
    expect(card).not.toContain('StationPhone');
    expect(card).not.toContain('StationPhoneActions');
  });
});

describe('StationsDirectoryExplorer is browse-only', () => {
  it('sends typed queries to find-station', async () => {
    const explorer = await fs.readFile('components/StationsDirectoryExplorer.tsx', 'utf-8');
    expect(explorer).toContain('buildFindStationSearchUrl');
    expect(explorer).toContain("router.push(buildFindStationSearchUrl(trimmed))");
    expect(explorer).not.toContain('StationSearchPickList');
    expect(explorer).not.toContain('findClearStationMatch');
  });
});
