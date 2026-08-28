import { readFileSync } from 'fs';
import { join, resolve } from 'path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(__dirname, '..');

describe('Firm outreach email UI removed', () => {
  it('admin nav no longer links to firm-outreach', () => {
    const src = readFileSync(join(ROOT, 'components/admin/AdminShell.tsx'), 'utf8');
    expect(src).not.toContain("/admin/firm-outreach");
    expect(src).not.toContain("'firm-outreach'");
    expect(src).toContain("href: '/admin'");
    expect(src).toContain("href: '/admin/automation'");
  });

  it('admin firm-outreach page calls notFound', () => {
    const src = readFileSync(join(ROOT, 'app/admin/firm-outreach/page.tsx'), 'utf8');
    expect(src).toContain('notFound()');
    expect(src).not.toContain('FirmOutreachDashboard');
  });

  it('send-approve pages call notFound', () => {
    const tokenPage = readFileSync(
      join(ROOT, 'app/outreach/send-approve/[token]/page.tsx'),
      'utf8',
    );
    const resultPage = readFileSync(
      join(ROOT, 'app/outreach/send-approve/result/page.tsx'),
      'utf8',
    );
    expect(tokenPage).toContain('notFound()');
    expect(resultPage).toContain('notFound()');
  });

  it('FirmOutreachDashboard component is deleted', () => {
    expect(() =>
      readFileSync(join(ROOT, 'components/admin/FirmOutreachDashboard.tsx'), 'utf8'),
    ).toThrow();
  });
});
