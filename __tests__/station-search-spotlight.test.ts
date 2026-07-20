import { describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';

describe('Station search → one page', () => {
  it('auto-navigates clear matches to the station page', async () => {
    const explorer = await fs.readFile('components/StationsDirectoryExplorer.tsx', 'utf-8');
    expect(explorer).toContain('findClearStationMatch');
    expect(explorer).toContain('router.push');
    expect(explorer).toContain('/police-station/');
    expect(explorer).toContain('StationSearchPickList');
  });

  it('pick list links to station pages without embedding Call grids', async () => {
    const pick = await fs.readFile('components/stations/StationSearchPickList.tsx', 'utf-8');
    expect(pick).toContain('/police-station/');
    expect(pick).not.toContain('StationPhoneActions');
    expect(pick).toContain('Open page');
  });
});

describe('StationDirectoryCard', () => {
  it('always links to the station page', async () => {
    const card = await fs.readFile('components/stations/StationDirectoryCard.tsx', 'utf-8');
    expect(card).toContain('/police-station/');
    expect(card).not.toContain('shouldIndexPoliceStationPage');
    expect(card).toContain('View station');
  });
});

describe('Station page contact hero', () => {
  it('uses bright Call/Copy actions in the hero', async () => {
    const page = await fs.readFile('app/police-station/[station]/page.tsx', 'utf-8');
    const actions = await fs.readFile('components/stations/StationPhoneActions.tsx', 'utf-8');
    expect(page).toContain('StationPhoneActions');
    expect(page).toContain('bright');
    expect(page).toContain('Contact numbers');
    expect(actions).toContain('bright');
    expect(actions).toContain('Call ');
    expect(actions).toContain('Copy number');
  });
});
