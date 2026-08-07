-- Harden form submissions: enable RLS with no anon policies.
-- Service role / dashboard access only. Apply manually in the Supabase SQL editor
-- if the optional Supabase submissions table is used in production.

ALTER TABLE IF EXISTS public.submissions ENABLE ROW LEVEL SECURITY;

-- Drop any overly permissive policies if they exist (safe no-ops when absent).
DROP POLICY IF EXISTS "Allow anon insert submissions" ON public.submissions;
DROP POLICY IF EXISTS "Allow anon read submissions" ON public.submissions;
DROP POLICY IF EXISTS "Allow public insert submissions" ON public.submissions;
DROP POLICY IF EXISTS "Allow public read submissions" ON public.submissions;
DROP POLICY IF EXISTS "Enable insert for anon" ON public.submissions;
DROP POLICY IF EXISTS "Enable read for anon" ON public.submissions;

-- Explicit deny for anon/authenticated clients. Service role bypasses RLS.
-- No CREATE POLICY for anon/authenticated = no client access when RLS is on.

COMMENT ON TABLE public.submissions IS
  'Form submission archive. RLS enabled; no anon/authenticated policies. Use service role or dashboard only.';
