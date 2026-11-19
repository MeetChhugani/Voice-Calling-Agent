-- Store call transcripts and customer service details without retaining audio.
ALTER TABLE support_requests
  ALTER COLUMN phone DROP NOT NULL;

ALTER TABLE support_requests
  ADD COLUMN IF NOT EXISTS account_last4 TEXT
    CHECK (account_last4 IS NULL OR account_last4 ~ '^[0-9]{4}$'),
  ADD COLUMN IF NOT EXISTS call_id TEXT;

CREATE INDEX IF NOT EXISTS idx_support_requests_call_id
  ON support_requests (call_id);

CREATE TABLE IF NOT EXISTS voice_call_transcripts (
  call_id TEXT PRIMARY KEY,
  call_type TEXT,
  customer_name TEXT,
  phone TEXT,
  email TEXT,
  account_last4 TEXT CHECK (account_last4 IS NULL OR account_last4 ~ '^[0-9]{4}$'),
  support_request_id TEXT,
  transcript TEXT NOT NULL DEFAULT '',
  summary TEXT,
  ended_reason TEXT,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_voice_call_transcripts_created_at
  ON voice_call_transcripts (created_at DESC);

ALTER TABLE voice_call_transcripts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow service role full access to voice call transcripts"
  ON voice_call_transcripts;
CREATE POLICY "Allow service role full access to voice call transcripts"
  ON voice_call_transcripts
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
