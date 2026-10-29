-- Durable customer service requests for web, Vapi, and PolyAI channels.
CREATE TABLE IF NOT EXISTS support_requests (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
  email TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  product_type TEXT,
  issue_summary TEXT NOT NULL,
  is_fraud_or_urgent BOOLEAN NOT NULL DEFAULT FALSE,
  preferred_callback_time TEXT,
  consent_given BOOLEAN NOT NULL DEFAULT TRUE,
  status TEXT NOT NULL DEFAULT 'registered'
    CHECK (status IN ('registered', 'assigned', 'in_progress', 'escalated', 'resolved')),
  official_reference_channel TEXT NOT NULL DEFAULT 'HDFC Bank Service Request Desk (1800 2600)',
  agent_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_support_requests_created_at
  ON support_requests (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_requests_phone
  ON support_requests (phone);
CREATE INDEX IF NOT EXISTS idx_support_requests_status
  ON support_requests (status);

ALTER TABLE support_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow service role full access to support requests" ON support_requests;
CREATE POLICY "Allow service role full access to support requests"
  ON support_requests
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
