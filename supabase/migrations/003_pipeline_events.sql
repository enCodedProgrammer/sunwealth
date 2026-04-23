-- Pipeline observability.
-- Every automation step logs here so failures can be surfaced in the admin
-- dashboard and retried without guesswork.

CREATE TABLE pipeline_events (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline     TEXT        NOT NULL,               -- 'inspection-booking', 'lead-scoring', …
  event        TEXT        NOT NULL,               -- 'booking-created', 'email-sent', …
  lead_id      UUID        REFERENCES leads(id)        ON DELETE SET NULL,
  property_id  UUID        REFERENCES properties(id)   ON DELETE SET NULL,
  outcome      TEXT        NOT NULL,               -- 'success' | 'skipped' | 'failed'
  error        TEXT,
  metadata     JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT pipeline_outcome_valid CHECK (outcome IN ('success', 'skipped', 'failed'))
);

CREATE INDEX pipeline_events_pipeline_idx   ON pipeline_events (pipeline, created_at DESC);
CREATE INDEX pipeline_events_failed_idx     ON pipeline_events (created_at DESC) WHERE outcome = 'failed';
CREATE INDEX pipeline_events_lead_idx       ON pipeline_events (lead_id)       WHERE lead_id IS NOT NULL;
CREATE INDEX pipeline_events_property_idx   ON pipeline_events (property_id)   WHERE property_id IS NOT NULL;

ALTER TABLE pipeline_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pipeline_events_staff_all" ON pipeline_events
  FOR ALL TO authenticated
  USING       (auth.jwt() ->> 'role' IN ('admin', 'senior', 'junior'))
  WITH CHECK  (auth.jwt() ->> 'role' IN ('admin', 'senior', 'junior'));
