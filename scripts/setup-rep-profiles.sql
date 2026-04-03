-- Run this in the Supabase SQL Editor to create the rep_profiles table.
-- Stores self-service profile edits keyed by the rep's email address.

CREATE TABLE IF NOT EXISTS rep_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  rep_slug TEXT,
  name TEXT,
  phone TEXT,
  availability TEXT,
  accreditation TEXT,
  stations_covered TEXT[],
  notes TEXT,
  postcode TEXT,
  website_url TEXT,
  whatsapp_link TEXT,
  dscc_pin TEXT,
  holiday_availability TEXT[],
  languages TEXT[],
  specialisms TEXT[],
  years_experience INTEGER,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Automatically bump updated_at on every UPDATE
CREATE OR REPLACE FUNCTION update_rep_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_rep_profiles_updated_at ON rep_profiles;
CREATE TRIGGER set_rep_profiles_updated_at
  BEFORE UPDATE ON rep_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_rep_profiles_updated_at();

-- Row Level Security: reps can only access their own row
ALTER TABLE rep_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own profile"
  ON rep_profiles FOR SELECT
  USING (auth.jwt() ->> 'email' = email);

CREATE POLICY "Users update own profile"
  ON rep_profiles FOR UPDATE
  USING (auth.jwt() ->> 'email' = email);

CREATE POLICY "Users insert own profile"
  ON rep_profiles FOR INSERT
  WITH CHECK (auth.jwt() ->> 'email' = email);

-- Allow the service role (used at build time) to read all rows for data merge
CREATE POLICY "Service role reads all profiles"
  ON rep_profiles FOR SELECT
  USING (auth.role() = 'service_role');
