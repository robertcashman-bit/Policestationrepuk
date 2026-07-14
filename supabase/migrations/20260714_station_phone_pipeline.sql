-- Station phone discovery pipeline tables (optional Supabase mirror of KV store).
-- Production write path remains Upstash/Vercel KV; these tables support SQL reporting
-- and future dual-write. Do not apply manually in production without backup.

CREATE TABLE IF NOT EXISTS police_stations (
  id TEXT PRIMARY KEY,
  canonical_name TEXT NOT NULL,
  aliases JSONB NOT NULL DEFAULT '[]'::jsonb,
  force_name TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  town TEXT NOT NULL DEFAULT '',
  county TEXT NOT NULL DEFAULT '',
  postcode TEXT NOT NULL DEFAULT '',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  operational_status TEXT NOT NULL DEFAULT 'active',
  public_enquiry_status TEXT NOT NULL DEFAULT 'unknown',
  custody_status TEXT NOT NULL DEFAULT 'unknown',
  primary_phone_id TEXT,
  verification_status TEXT NOT NULL DEFAULT 'unverified',
  last_searched_at TIMESTAMPTZ,
  last_verified_at TIMESTAMPTZ,
  next_review_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_police_stations_force ON police_stations(force_name);
CREATE INDEX IF NOT EXISTS idx_police_stations_postcode ON police_stations(postcode);
CREATE INDEX IF NOT EXISTS idx_police_stations_next_review ON police_stations(next_review_at);

CREATE TABLE IF NOT EXISTS station_sources (
  id TEXT PRIMARY KEY,
  station_id TEXT NOT NULL REFERENCES police_stations(id) ON DELETE CASCADE,
  source_url TEXT NOT NULL,
  canonical_url TEXT NOT NULL DEFAULT '',
  source_domain TEXT NOT NULL DEFAULT '',
  source_type TEXT NOT NULL DEFAULT 'unknown',
  title TEXT NOT NULL DEFAULT '',
  publication_date TIMESTAMPTZ,
  retrieved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  http_status INTEGER,
  content_hash TEXT NOT NULL DEFAULT '',
  authority_score INTEGER NOT NULL DEFAULT 0,
  evidence_text TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_station_sources_station ON station_sources(station_id);
CREATE INDEX IF NOT EXISTS idx_station_sources_domain ON station_sources(source_domain);

CREATE TABLE IF NOT EXISTS station_phone_candidates (
  id TEXT PRIMARY KEY,
  station_id TEXT NOT NULL REFERENCES police_stations(id) ON DELETE CASCADE,
  raw_number TEXT NOT NULL,
  national_number TEXT NOT NULL,
  e164_number TEXT,
  number_type TEXT NOT NULL DEFAULT 'uncertain',
  confidence_score INTEGER NOT NULL DEFAULT 0,
  source_id TEXT REFERENCES station_sources(id) ON DELETE SET NULL,
  evidence_text TEXT NOT NULL DEFAULT '',
  evidence_context TEXT NOT NULL DEFAULT '',
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  verification_status TEXT NOT NULL DEFAULT 'new',
  rejection_reason TEXT,
  is_current BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_station_phone_candidates_station ON station_phone_candidates(station_id);
CREATE INDEX IF NOT EXISTS idx_station_phone_candidates_national ON station_phone_candidates(national_number);
CREATE INDEX IF NOT EXISTS idx_station_phone_candidates_status ON station_phone_candidates(verification_status);

CREATE TABLE IF NOT EXISTS station_search_attempts (
  id TEXT PRIMARY KEY,
  station_id TEXT NOT NULL REFERENCES police_stations(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT '',
  strategy TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'ok',
  result_count INTEGER NOT NULL DEFAULT 0,
  error_code TEXT,
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_station_search_attempts_station ON station_search_attempts(station_id);
CREATE INDEX IF NOT EXISTS idx_station_search_attempts_strategy ON station_search_attempts(strategy);

CREATE TABLE IF NOT EXISTS station_review_queue (
  id TEXT PRIMARY KEY,
  station_id TEXT NOT NULL REFERENCES police_stations(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  conflicting_candidates JSONB NOT NULL DEFAULT '[]'::jsonb,
  priority INTEGER NOT NULL DEFAULT 50,
  status TEXT NOT NULL DEFAULT 'open',
  assigned_to TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewer_notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_station_review_queue_status ON station_review_queue(status, priority DESC);
