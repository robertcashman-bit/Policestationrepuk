import { describe, it, expect } from 'vitest';
import {
  ENGLISH_COUNTIES,
  validateEnglishCountySelections,
} from '@/lib/english-counties';

describe('English counties — London', () => {
  it('lists London as a selectable county', () => {
    expect(ENGLISH_COUNTIES).toContain('London');
  });

  it('accepts London', () => {
    const r = validateEnglishCountySelections(['London']);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.canonical).toEqual(['London']);
  });

  it('normalises Greater London to London', () => {
    const r = validateEnglishCountySelections(['Greater London']);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.canonical).toEqual(['London']);
  });

  it('allows Kent and London together', () => {
    const r = validateEnglishCountySelections(['Kent', 'London']);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.canonical).toEqual(['Kent', 'London']);
  });
});
