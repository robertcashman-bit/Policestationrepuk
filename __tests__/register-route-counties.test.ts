import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

/** Lightweight guard: registration API must enforce canonical county validation. */
describe('register route — county validation wired', () => {
  const routePath = path.resolve(__dirname, '..', 'app', 'api', 'register', 'route.ts');
  const source = fs.readFileSync(routePath, 'utf-8');

  it('imports and applies validateEnglishCountySelections', () => {
    expect(source).toContain('validateEnglishCountySelections');
    expect(source).toContain('countyCheck');
  });

  it('stores canonical counties string via countiesToStorageString', () => {
    expect(source).toContain('countiesToStorageString');
  });
});
