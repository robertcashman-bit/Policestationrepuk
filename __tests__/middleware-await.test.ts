import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Middleware — await updateSession (Bug 1)', () => {
  const middlewarePath = path.resolve(__dirname, '..', 'middleware.ts');
  const source = fs.readFileSync(middlewarePath, 'utf-8');

  it('contains "return await updateSession(request)"', () => {
    expect(source).toContain('return await updateSession(request)');
  });

  it('does NOT contain bare "return updateSession(request)" without await', () => {
    const lines = source.split('\n');
    const updateSessionReturns = lines.filter(
      (line) => line.includes('return') && line.includes('updateSession(request)'),
    );
    for (const line of updateSessionReturns) {
      expect(line).toContain('await');
    }
  });

  it('middleware function is declared async', () => {
    expect(source).toMatch(/export\s+async\s+function\s+middleware/);
  });
});
