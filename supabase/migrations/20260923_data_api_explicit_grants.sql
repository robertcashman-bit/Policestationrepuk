-- Explicit Data API GRANTs for public-schema objects (Supabase Oct 30 2026).
--
-- From 30 Oct 2026, new tables/views/sequences/functions in `public` on existing
-- projects are NOT auto-granted to anon / authenticated / service_role. Existing
-- table grants stay; CREATE TABLE without explicit GRANTs breaks after db reset,
-- preview branches, and any new tables. See:
-- https://supabase.com/docs/guides/api/securing-your-api
--
-- This migration:
-- 1) Documents intended exposure for every public table in schema.sql / migrations
-- 2) Grants only service_role where the Data API (or dashboard/server) should reach
-- 3) Revokes anon/authenticated on sensitive / unused-via-client tables (strengthen)
-- 4) Keeps/strengthens RLS (no new client policies; no anon blanket grants)
-- 5) Revokes default privileges so future CREATE TABLE requires explicit GRANTs now
--
-- App usage (audit 2026-09-23): only lib/submissions.ts calls supabase-js, and only
-- as a KV fallback insert into `submissions` with the anon key. That path is
-- intentionally blocked by RLS (20260807) with no anon policies. Directory and
-- custody data live in JSON/KV; Supabase tables are optional mirrors / archive.

-- ---------------------------------------------------------------------------
-- Future CREATE TABLE / VIEW / FUNCTION / SEQUENCE in public MUST include
-- explicit GRANTs for each role that should reach the object via Data API.
-- Prefer service_role (and authenticated when signed-in clients need access).
-- GRANT to anon ONLY for genuinely public-read objects AND enable RLS + policies.
-- NEVER: GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
-- ---------------------------------------------------------------------------

-- Ensure schema usage (idempotent; already present on standard Supabase projects).
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- submissions — PII form archive. Service role / dashboard only.
-- ---------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.submissions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.submissions FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.submissions TO service_role;

-- ---------------------------------------------------------------------------
-- Directory tables (schema.sql) — not queried by supabase-js today.
-- Intentionally unexposed to anon/authenticated Data API clients.
-- ---------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.counties ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.representatives ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.counties FROM anon, authenticated;
REVOKE ALL ON TABLE public.stations FROM anon, authenticated;
REVOKE ALL ON TABLE public.representatives FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.counties TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.stations TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.representatives TO service_role;

-- ---------------------------------------------------------------------------
-- Custody discovery mirrors (20250606) — KV is primary; optional Supabase copy.
-- Admin / service_role only. No anon or authenticated Data API access.
-- ---------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.custody_suites ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.custody_number_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.approved_custody_numbers ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.custody_suites FROM anon, authenticated;
REVOKE ALL ON TABLE public.custody_number_findings FROM anon, authenticated;
REVOKE ALL ON TABLE public.approved_custody_numbers FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.custody_suites TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.custody_number_findings TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.approved_custody_numbers TO service_role;

-- No CREATE POLICY for anon/authenticated on any of the above = deny when RLS on.
-- service_role bypasses RLS as usual.

-- ---------------------------------------------------------------------------
-- Match post-Oct-30 platform default early: new objects need explicit GRANTs.
-- (Does not revoke privileges already granted on existing tables.)
-- ---------------------------------------------------------------------------
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLES FROM anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE USAGE, SELECT ON SEQUENCES FROM anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

COMMENT ON TABLE public.submissions IS
  'Form submission archive. RLS on; no anon/authenticated GRANTs or policies. service_role / dashboard only. Explicit GRANTs required for Data API (Oct 30 2026).';
