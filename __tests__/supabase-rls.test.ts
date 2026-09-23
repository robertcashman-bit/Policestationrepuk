import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * RLS/migration smoke — skipped unless DATABASE_URL points at local Supabase.
 * Full RLS policy tests belong here once Supabase auth roles are wired.
 *
 * Static checks always run: Data API GRANT migration must stay least-privilege.
 */
describe('supabase migrations', () => {
  const migrationsDir = join(process.cwd(), 'supabase/migrations');
  const grantMigration = '20260923_data_api_explicit_grants.sql';

  it('skips live DB checks when DATABASE_URL is unset', () => {
    if (!process.env.DATABASE_URL) {
      expect(true).toBe(true);
      return;
    }
    expect(process.env.DATABASE_URL).toContain('54322');
  });

  it('ships the Oct 2026 Data API explicit-grants migration', () => {
    const files = readdirSync(migrationsDir).filter((f) => f.endsWith('.sql'));
    expect(files).toContain(grantMigration);
  });

  it('grants service_role on all public tables and never blanket-grants anon', () => {
    const raw = readFileSync(join(migrationsDir, grantMigration), 'utf8');
    // Ignore SQL comments so "NEVER: GRANT ALL…" documentation does not false-positive.
    const sql = raw
      .split('\n')
      .filter((line) => !line.trimStart().startsWith('--'))
      .join('\n');

    expect(sql).not.toMatch(/GRANT\s+ALL\s+ON\s+ALL\s+TABLES/i);
    expect(sql).not.toMatch(/GRANT\s+.+\s+ON\s+TABLE\s+public\.\w+\s+TO\s+anon/i);

    const serviceRoleTables = [
      'submissions',
      'counties',
      'stations',
      'representatives',
      'custody_suites',
      'custody_number_findings',
      'approved_custody_numbers',
    ];
    for (const table of serviceRoleTables) {
      expect(sql).toMatch(
        new RegExp(
          `GRANT\\s+SELECT,\\s*INSERT,\\s*UPDATE,\\s*DELETE\\s+ON\\s+TABLE\\s+public\\.${table}\\s+TO\\s+service_role`,
          'i',
        ),
      );
      expect(sql).toMatch(
        new RegExp(`REVOKE\\s+ALL\\s+ON\\s+TABLE\\s+public\\.${table}\\s+FROM\\s+anon,\\s*authenticated`, 'i'),
      );
      expect(sql).toMatch(
        new RegExp(`ALTER\\s+TABLE\\s+IF\\s+EXISTS\\s+public\\.${table}\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`, 'i'),
      );
    }

    expect(sql).toMatch(/ALTER\s+DEFAULT\s+PRIVILEGES\s+FOR\s+ROLE\s+postgres\s+IN\s+SCHEMA\s+public/i);
    expect(raw).toMatch(/Oct 30 2026|30 Oct 2026/i);
  });

  it('documents future GRANT requirements in migrations README', () => {
    const readme = readFileSync(join(migrationsDir, 'README.md'), 'utf8');
    expect(readme).toMatch(/30 Oct 2026|Oct 30 2026/);
    expect(readme).toMatch(/NEVER.*GRANT ALL ON ALL TABLES/i);
    expect(readme).toMatch(/service_role/);
  });
});
