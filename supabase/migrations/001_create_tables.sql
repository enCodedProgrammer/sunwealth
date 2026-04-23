-- Sunwealth — initial schema.
-- Tables, indexes, generated columns, triggers, RLS.
-- Column naming: snake_case (Postgres convention). TypeScript types in lib/types.ts
-- use camelCase; the mapping happens in lib/db/*.

-- =====================================================================
-- Extensions
-- =====================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;     -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS vector;       -- pgvector for embeddings

-- =====================================================================
-- updated_at trigger helper
-- =====================================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =====================================================================
-- agents
-- =====================================================================
CREATE TABLE agents (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  role             TEXT NOT NULL,
  sub_brand        TEXT NOT NULL,
  email            TEXT NOT NULL UNIQUE,
  whatsapp         TEXT NOT NULL,
  cal_booking_url  TEXT NOT NULL,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT agents_role_valid      CHECK (role      IN ('senior', 'junior', 'admin')),
  CONSTRAINT agents_sub_brand_valid CHECK (sub_brand IN ('sales', 'rent', 'land', 'all'))
);

CREATE TRIGGER agents_updated_at BEFORE UPDATE ON agents
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =====================================================================
-- properties
-- =====================================================================
CREATE TABLE properties (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug              TEXT NOT NULL UNIQUE,
  title             TEXT NOT NULL,
  category          TEXT NOT NULL,
  listing_type      TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'available',
  sub_brand         TEXT NOT NULL,
  location          JSONB NOT NULL,
  price             JSONB NOT NULL,
  price_amount      BIGINT GENERATED ALWAYS AS (((price->>'amount')::bigint)) STORED,
  size              JSONB NOT NULL,
  bedrooms          SMALLINT,
  bathrooms         SMALLINT,
  features          TEXT[] NOT NULL DEFAULT '{}',
  documents         TEXT[] NOT NULL DEFAULT '{}',
  images            JSONB NOT NULL DEFAULT '[]'::jsonb,
  description       TEXT NOT NULL DEFAULT '',
  search_text       TSVECTOR GENERATED ALWAYS AS (
                      to_tsvector(
                        'english',
                        coalesce(title, '') || ' ' || coalesce(description, '')
                      )
                    ) STORED,
  nearby_landmarks  TEXT[] NOT NULL DEFAULT '{}',
  payment_plans     JSONB NOT NULL DEFAULT '[]'::jsonb,
  virtual_tour_url  TEXT,
  published_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT properties_category_valid     CHECK (category IN (
                                              'fully-detached-duplex',
                                              'semi-detached-duplex',
                                              'terrace-duplex',
                                              'bungalow',
                                              'apartment',
                                              'penthouse',
                                              'maisonette',
                                              'land'
                                            )),
  CONSTRAINT properties_listing_type_valid CHECK (listing_type IN ('sale', 'rent', 'shortlet')),
  CONSTRAINT properties_status_valid       CHECK (status       IN ('available', 'under-offer', 'sold', 'let')),
  CONSTRAINT properties_sub_brand_valid    CHECK (sub_brand    IN ('sales', 'rent', 'land')),
  CONSTRAINT properties_bedrooms_range     CHECK (bedrooms  IS NULL OR (bedrooms  BETWEEN 0 AND 50)),
  CONSTRAINT properties_bathrooms_range    CHECK (bathrooms IS NULL OR (bathrooms BETWEEN 0 AND 50))
);

CREATE INDEX properties_status_idx        ON properties (status);
CREATE INDEX properties_sub_brand_idx     ON properties (sub_brand);
CREATE INDEX properties_listing_type_idx  ON properties (listing_type);
CREATE INDEX properties_category_idx      ON properties (category);
CREATE INDEX properties_published_at_idx  ON properties (published_at DESC);
CREATE INDEX properties_price_amount_idx  ON properties (price_amount);
CREATE INDEX properties_location_gin_idx  ON properties USING gin (location);
CREATE INDEX properties_search_idx        ON properties USING gin (search_text);
CREATE INDEX properties_documents_gin_idx ON properties USING gin (documents);

CREATE TRIGGER properties_updated_at BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =====================================================================
-- leads
-- =====================================================================
CREATE TABLE leads (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                      TEXT,
  email                     TEXT,
  phone                     TEXT,
  whatsapp                  TEXT,
  country                   TEXT,                     -- ISO code
  is_diaspora               BOOLEAN NOT NULL DEFAULT FALSE,
  source                    TEXT NOT NULL,
  first_seen_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_contact_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  status                    TEXT NOT NULL DEFAULT 'new',
  score                     SMALLINT NOT NULL DEFAULT 0,
  budget                    JSONB,
  interested_categories     TEXT[] NOT NULL DEFAULT '{}',
  interested_areas          TEXT[] NOT NULL DEFAULT '{}',
  assigned_agent_id         UUID REFERENCES agents(id) ON DELETE SET NULL,
  properties_interested_in  UUID[] NOT NULL DEFAULT '{}',
  notes                     TEXT NOT NULL DEFAULT '',
  tags                      TEXT[] NOT NULL DEFAULT '{}',
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT leads_source_valid CHECK (source IN ('website', 'whatsapp', 'instagram-dm', 'referral', 'google')),
  CONSTRAINT leads_status_valid CHECK (status IN ('new', 'qualified', 'inspection-booked', 'negotiating', 'closed-won', 'closed-lost', 'cold')),
  CONSTRAINT leads_score_range  CHECK (score BETWEEN 0 AND 100)
);

CREATE INDEX leads_score_idx          ON leads (score DESC);
CREATE INDEX leads_status_idx         ON leads (status);
CREATE INDEX leads_assigned_agent_idx ON leads (assigned_agent_id);

CREATE TRIGGER leads_updated_at BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =====================================================================
-- concierge_conversations
-- =====================================================================
CREATE TABLE concierge_conversations (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id            UUID REFERENCES leads(id) ON DELETE SET NULL,
  channel            TEXT NOT NULL,
  session_id         TEXT NOT NULL,
  escalated          BOOLEAN NOT NULL DEFAULT FALSE,
  escalation_reason  TEXT,
  started_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_message_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT conversations_channel_valid CHECK (channel IN ('website', 'whatsapp'))
);

CREATE INDEX conversations_lead_id_idx    ON concierge_conversations (lead_id);
CREATE INDEX conversations_session_id_idx ON concierge_conversations (session_id);

-- =====================================================================
-- concierge_messages
-- =====================================================================
CREATE TABLE concierge_messages (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id  UUID NOT NULL REFERENCES concierge_conversations(id) ON DELETE CASCADE,
  role             TEXT NOT NULL,
  content          TEXT NOT NULL,
  tool_calls       JSONB,
  timestamp        TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT messages_role_valid CHECK (role IN ('user', 'assistant', 'system', 'tool'))
);

CREATE INDEX messages_conversation_idx ON concierge_messages (conversation_id, timestamp);

-- =====================================================================
-- knowledge_documents
-- =====================================================================
CREATE TABLE knowledge_documents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  category    TEXT NOT NULL,
  content     TEXT NOT NULL,
  embedding   vector(1536),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by  UUID,

  CONSTRAINT knowledge_category_valid CHECK (category IN ('verification', 'payment', 'diaspora', 'legal', 'company', 'faq'))
);

CREATE INDEX knowledge_embedding_idx ON knowledge_documents
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE TRIGGER knowledge_updated_at BEFORE UPDATE ON knowledge_documents
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =====================================================================
-- inspection_requests
-- =====================================================================
CREATE TABLE inspection_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id     UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  lead_id         UUID REFERENCES leads(id) ON DELETE SET NULL,
  contact_name    TEXT,
  contact_email   TEXT,
  contact_phone   TEXT,
  preferred_at    TIMESTAMPTZ,
  is_virtual      BOOLEAN NOT NULL DEFAULT FALSE,
  status          TEXT NOT NULL DEFAULT 'pending',
  notes           TEXT,
  cal_booking_id  TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT inspection_status_valid CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no-show'))
);

CREATE INDEX inspection_property_idx ON inspection_requests (property_id);
CREATE INDEX inspection_lead_idx     ON inspection_requests (lead_id);
CREATE INDEX inspection_status_idx   ON inspection_requests (status);

CREATE TRIGGER inspection_updated_at BEFORE UPDATE ON inspection_requests
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =====================================================================
-- Row-Level Security
-- =====================================================================
-- Policies reference `auth.jwt() ->> 'role'` per docs/data-model.md. This
-- assumes a Supabase access-token hook promotes the staff role from
-- app_metadata to a root claim. Configure the hook before deploying.

ALTER TABLE properties              ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE concierge_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE concierge_messages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_documents     ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_requests     ENABLE ROW LEVEL SECURITY;

-- properties: anonymous read for non-sold listings
CREATE POLICY "properties_public_read_available" ON properties
  FOR SELECT TO anon
  USING (status <> 'sold' AND sub_brand IS NOT NULL);

-- properties: authenticated staff full access
CREATE POLICY "properties_staff_all" ON properties
  FOR ALL TO authenticated
  USING       (auth.jwt() ->> 'role' IN ('admin', 'senior', 'junior'))
  WITH CHECK  (auth.jwt() ->> 'role' IN ('admin', 'senior', 'junior'));

CREATE POLICY "agents_staff_only" ON agents
  FOR ALL TO authenticated
  USING       (auth.jwt() ->> 'role' IN ('admin', 'senior', 'junior'))
  WITH CHECK  (auth.jwt() ->> 'role' IN ('admin', 'senior', 'junior'));

CREATE POLICY "leads_staff_only" ON leads
  FOR ALL TO authenticated
  USING       (auth.jwt() ->> 'role' IN ('admin', 'senior', 'junior'))
  WITH CHECK  (auth.jwt() ->> 'role' IN ('admin', 'senior', 'junior'));

CREATE POLICY "conversations_staff_only" ON concierge_conversations
  FOR ALL TO authenticated
  USING       (auth.jwt() ->> 'role' IN ('admin', 'senior', 'junior'))
  WITH CHECK  (auth.jwt() ->> 'role' IN ('admin', 'senior', 'junior'));

CREATE POLICY "messages_staff_only" ON concierge_messages
  FOR ALL TO authenticated
  USING       (auth.jwt() ->> 'role' IN ('admin', 'senior', 'junior'))
  WITH CHECK  (auth.jwt() ->> 'role' IN ('admin', 'senior', 'junior'));

CREATE POLICY "knowledge_staff_only" ON knowledge_documents
  FOR ALL TO authenticated
  USING       (auth.jwt() ->> 'role' IN ('admin', 'senior', 'junior'))
  WITH CHECK  (auth.jwt() ->> 'role' IN ('admin', 'senior', 'junior'));

CREATE POLICY "inspection_staff_all" ON inspection_requests
  FOR ALL TO authenticated
  USING       (auth.jwt() ->> 'role' IN ('admin', 'senior', 'junior'))
  WITH CHECK  (auth.jwt() ->> 'role' IN ('admin', 'senior', 'junior'));

-- inspection_requests accepts anonymous inserts only via the service-role
-- route handler (lib/db/admin.ts) — no anon policy, by design.
