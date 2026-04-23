-- Sunwealth — AI runtime tables and functions.
-- Adds: ai_events (observability), ai_rate_limits (per-session / per-IP limits),
-- match_knowledge_documents RPC (pgvector similarity search).

-- =====================================================================
-- ai_events — structured observability log for every AI interaction
-- =====================================================================
-- kinds: 'ai_tool_call', 'ai_guardrail_trigger', 'ai_escalation', 'ai_turn'
CREATE TABLE ai_events (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind             TEXT NOT NULL,
  conversation_id  UUID REFERENCES concierge_conversations(id) ON DELETE SET NULL,
  session_id       TEXT,
  payload          JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT ai_events_kind_valid CHECK (kind IN (
    'ai_tool_call',
    'ai_guardrail_trigger',
    'ai_escalation',
    'ai_turn',
    'ai_error'
  ))
);

CREATE INDEX ai_events_kind_idx            ON ai_events (kind);
CREATE INDEX ai_events_conversation_idx    ON ai_events (conversation_id, created_at DESC);
CREATE INDEX ai_events_created_at_idx      ON ai_events (created_at DESC);

ALTER TABLE ai_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_events_staff_only" ON ai_events
  FOR ALL TO authenticated
  USING       (auth.jwt() ->> 'role' IN ('admin', 'senior', 'junior'))
  WITH CHECK  (auth.jwt() ->> 'role' IN ('admin', 'senior', 'junior'));

-- Writes happen via the service-role client on the server — no anon policy needed.

-- =====================================================================
-- ai_rate_limits — per-key sliding window buckets
-- =====================================================================
-- key format:  'session:<sessionId>'  or  'ip:<ip>:session-create'
CREATE TABLE ai_rate_limits (
  key           TEXT PRIMARY KEY,
  bucket_start  TIMESTAMPTZ NOT NULL,
  count         INTEGER NOT NULL DEFAULT 0,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ai_rate_limits_bucket_idx ON ai_rate_limits (bucket_start);

ALTER TABLE ai_rate_limits ENABLE ROW LEVEL SECURITY;
-- Staff read-only. Writes are service-role only.
CREATE POLICY "ai_rate_limits_staff_read" ON ai_rate_limits
  FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'role' IN ('admin', 'senior', 'junior'));

-- Atomic increment RPC. Returns the new count after increment.
-- If the existing bucket is older than `window_seconds`, it resets.
CREATE OR REPLACE FUNCTION bump_rate_limit(
  p_key            TEXT,
  p_window_seconds INTEGER
) RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_now          TIMESTAMPTZ := now();
  v_bucket_start TIMESTAMPTZ;
  v_count        INTEGER;
BEGIN
  INSERT INTO ai_rate_limits (key, bucket_start, count, updated_at)
  VALUES (p_key, v_now, 1, v_now)
  ON CONFLICT (key) DO UPDATE
    SET
      bucket_start = CASE
        WHEN ai_rate_limits.bucket_start < v_now - make_interval(secs => p_window_seconds)
          THEN v_now
        ELSE ai_rate_limits.bucket_start
      END,
      count = CASE
        WHEN ai_rate_limits.bucket_start < v_now - make_interval(secs => p_window_seconds)
          THEN 1
        ELSE ai_rate_limits.count + 1
      END,
      updated_at = v_now
  RETURNING count INTO v_count;

  RETURN v_count;
END;
$$;

-- =====================================================================
-- match_knowledge_documents — pgvector cosine similarity search
-- =====================================================================
CREATE OR REPLACE FUNCTION match_knowledge_documents(
  query_embedding  vector(1536),
  match_threshold  FLOAT    DEFAULT 0.5,
  match_count      INTEGER  DEFAULT 3
) RETURNS TABLE (
  id          UUID,
  title       TEXT,
  category    TEXT,
  content     TEXT,
  similarity  FLOAT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    kd.id,
    kd.title,
    kd.category,
    kd.content,
    1 - (kd.embedding <=> query_embedding) AS similarity
  FROM knowledge_documents kd
  WHERE kd.embedding IS NOT NULL
    AND 1 - (kd.embedding <=> query_embedding) > match_threshold
  ORDER BY kd.embedding <=> query_embedding
  LIMIT match_count;
$$;
