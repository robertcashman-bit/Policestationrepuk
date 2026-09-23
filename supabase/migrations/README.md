# Supabase migrations

Apply with `scripts/supabase-migrate.sh` (local) or paste into the Supabase SQL editor (hosted). Deploy does **not** auto-run SQL.

## Data API grants (required from 30 Oct 2026)

On existing Supabase projects, **new** `public` schema tables, views, sequences, and functions are **not** auto-exposed to the Data API (`anon` / `authenticated` / `service_role`). Existing tables keep their current grants. Migrations that `CREATE TABLE` without `GRANT` break after db reset, preview DBs, and any new table.

**Every future migration that creates a public object must include explicit GRANTs**, for example:

```sql
CREATE TABLE public.example (…);
ALTER TABLE public.example ENABLE ROW LEVEL SECURITY;

-- Prefer service_role for server/dashboard; add authenticated only if signed-in clients need it.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.example TO service_role;

-- anon ONLY if genuinely public-read AND RLS + SELECT policy exist:
-- GRANT SELECT ON TABLE public.example TO anon;
-- CREATE POLICY "public read" ON public.example FOR SELECT TO anon USING (true);
```

**Never** run `GRANT ALL ON ALL TABLES IN SCHEMA public TO anon`.

Baseline grants for current tables: `20260923_data_api_explicit_grants.sql`.
Docs: https://supabase.com/docs/guides/api/securing-your-api

## Current public tables (intent)

| Table | anon | authenticated | service_role | Notes |
|-------|------|---------------|--------------|-------|
| `submissions` | none | none | CRUD | PII; RLS on; no client policies |
| `counties` / `stations` / `representatives` | none | none | CRUD | Optional; app uses `data/*.json` |
| `custody_suites` / `custody_number_findings` / `approved_custody_numbers` | none | none | CRUD | Optional KV mirror |

No public views, sequences, or RPCs are defined for the Data API today.
