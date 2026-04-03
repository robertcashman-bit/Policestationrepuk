import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Date formatting — toLocaleString vs toLocaleDateString (Bug 2)', () => {
  const testDate = new Date('2025-06-15T14:30:00Z');
  const opts: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };

  it('toLocaleString with hour/minute options includes time', () => {
    const result = testDate.toLocaleString('en-GB', opts);
    expect(result).toMatch(/\d{1,2}:\d{2}/);
  });

  it('toLocaleString produces date AND time portions', () => {
    const result = testDate.toLocaleString('en-GB', opts);
    expect(result).toContain('June');
    expect(result).toContain('2025');
    expect(result).toMatch(/\d{1,2}:\d{2}/);
  });

  it('AccountDashboard.tsx uses toLocaleString (not toLocaleDateString)', () => {
    const dashboardPath = path.resolve(
      __dirname,
      '..',
      'app',
      'Account',
      'AccountDashboard.tsx',
    );
    const source = fs.readFileSync(dashboardPath, 'utf-8');
    const timestampLine = source
      .split('\n')
      .find((l) => l.includes('updatedAt') && l.includes('toLocale'));
    expect(timestampLine).toBeTruthy();
    expect(timestampLine).toContain('toLocaleString');
    expect(timestampLine).not.toContain('toLocaleDateString');
  });
});
