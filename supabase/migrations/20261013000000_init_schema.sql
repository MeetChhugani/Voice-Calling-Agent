-- Supabase Migration: Studio Olives Cre Leads & Consultations Schema
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  phone_verified BOOLEAN DEFAULT FALSE,
  email TEXT,
  property_city TEXT,
  property_location TEXT,
  property_type TEXT,
  project_status TEXT,
  property_area TEXT,
  project_scope TEXT,
  style_preferences TEXT,
  inspiration_notes TEXT,
  client_priorities TEXT,
  timeline TEXT,
  budget_fit BOOLEAN,
  budget_notes TEXT,
  decision_makers TEXT,
  preferred_meeting_times TEXT,
  timezone TEXT DEFAULT 'Asia/Kolkata',
  consent_status BOOLEAN DEFAULT TRUE,
  source TEXT DEFAULT 'voice_agent_dhruv',
  call_summary TEXT,
  lead_status TEXT DEFAULT 'new_lead' CHECK (lead_status IN ('new_lead', 'qualifying', 'qualified', 'booking_pending', 'booked', 'not_qualified', 'follow_up_required', 'booking_failed')),
  internal_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  calendar_event_id TEXT,
  meeting_url TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  timezone TEXT DEFAULT 'Asia/Kolkata',
  booking_status TEXT DEFAULT 'pending' CHECK (booking_status IN ('pending', 'confirmed', 'failed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexing for fast lookups
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(lead_status);
CREATE INDEX IF NOT EXISTS idx_meetings_lead_id ON meetings(lead_id);
CREATE INDEX IF NOT EXISTS idx_meetings_start_time ON meetings(start_time);

-- RLS (Row Level Security) Policies
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

-- Allow server service role complete access, anon read/write via secure APIs
CREATE POLICY "Allow service role full access to leads" ON leads
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role full access to meetings" ON meetings
  FOR ALL USING (auth.role() = 'service_role');
