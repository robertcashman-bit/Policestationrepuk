import { describe, expect, it } from 'vitest';
import { formatPersonDisplayName } from '@/lib/display-name';

describe('formatPersonDisplayName', () => {
  it('title-cases all-caps and all-lowercase names', () => {
    expect(formatPersonDisplayName('PATRICIA OYEMIKE')).toBe('Patricia Oyemike');
    expect(formatPersonDisplayName('amer ahmad')).toBe('Amer Ahmad');
    expect(formatPersonDisplayName('denise Baker')).toBe('Denise Baker');
  });

  it('collapses extra spaces', () => {
    expect(formatPersonDisplayName('Chinyere  Inyama')).toBe('Chinyere Inyama');
  });

  it('keeps hyphenated segments', () => {
    expect(formatPersonDisplayName('MARY-JANE SMITH')).toBe('Mary-Jane Smith');
  });

  it("preserves Mc and O' names that are already mixed-case", () => {
    expect(formatPersonDisplayName('Dan McCurry')).toBe('Dan McCurry');
    expect(formatPersonDisplayName("Sammie O'Blein")).toBe("Sammie O'Blein");
  });

  it("title-cases all-caps Mc and O' names correctly", () => {
    expect(formatPersonDisplayName('DAN MCCURRY')).toBe('Dan McCurry');
    expect(formatPersonDisplayName("SAMMIE O'BLEIN")).toBe("Sammie O'Blein");
  });
});
