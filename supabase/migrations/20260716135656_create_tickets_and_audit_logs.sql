/*
# Create tickets and audit_logs tables for NexusDesk AI platform

1. New Tables
- `tickets`
  - `id` (uuid, primary key)
  - `subject` (text, not null) — short title of the request
  - `body` (text, not null) — full request text from the user
  - `category` (text, not null) — AI-classified category: HR, IT, Finance, Operations
  - `priority` (text, not null) — AI-derived priority: Low, Medium, High, Critical
  - `confidence` (numeric, 0-1) — classifier confidence score
  - `matched_keywords` (jsonb) — keywords that drove the classification
  - `tone` (text) — requested response tone: formal, friendly, urgent
  - `ai_response` (text) — generated AI response text
  - `status` (text, not null) — Open, In Progress, Resolved, Escalated
  - `risk_flags` (jsonb) — risk/bias flags from compliance layer
  - `risk_score` (integer, 0-100) — compliance risk score
  - `response_time_ms` (integer) — simulated response latency in ms
  - `department` (text) — department the ticket was routed to
  - `created_at` (timestamptz, default now())
- `audit_logs`
  - `id` (uuid, primary key)
  - `ticket_id` (uuid, nullable, references tickets)
  - `action` (text, not null) — e.g. CLASSIFIED, RESPONDED, RISK_CHECKED
  - `actor` (text, not null) — e.g. "AI Classifier", "Compliance Engine"
  - `detail` (text) — human-readable detail
  - `metadata` (jsonb) — structured detail payload
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS on both tables.
- Single-tenant (no sign-in) app: allow anon + authenticated full CRUD because data is intentionally shared/public for this operations demo.

3. Notes
- Indexes added on tickets.category, tickets.status, tickets.created_at for analytics queries.
- audit_logs.ticket_id cascades on delete so logs stay consistent with tickets.
*/

CREATE TABLE IF NOT EXISTS tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  body text NOT NULL,
  category text NOT NULL DEFAULT 'IT',
  priority text NOT NULL DEFAULT 'Medium',
  confidence numeric(4,3) NOT NULL DEFAULT 0.000,
  matched_keywords jsonb NOT NULL DEFAULT '[]'::jsonb,
  tone text DEFAULT 'formal',
  ai_response text,
  status text NOT NULL DEFAULT 'Open',
  risk_flags jsonb NOT NULL DEFAULT '[]'::jsonb,
  risk_score integer NOT NULL DEFAULT 0,
  response_time_ms integer NOT NULL DEFAULT 0,
  department text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_tickets" ON tickets;
CREATE POLICY "anon_select_tickets" ON tickets FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_tickets" ON tickets;
CREATE POLICY "anon_insert_tickets" ON tickets FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_tickets" ON tickets;
CREATE POLICY "anon_update_tickets" ON tickets FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_tickets" ON tickets;
CREATE POLICY "anon_delete_tickets" ON tickets FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_tickets_category ON tickets(category);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at DESC);

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES tickets(id) ON DELETE CASCADE,
  action text NOT NULL,
  actor text NOT NULL,
  detail text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_audit_logs" ON audit_logs;
CREATE POLICY "anon_select_audit_logs" ON audit_logs FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_audit_logs" ON audit_logs;
CREATE POLICY "anon_insert_audit_logs" ON audit_logs FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_audit_logs" ON audit_logs;
CREATE POLICY "anon_delete_audit_logs" ON audit_logs FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_audit_logs_ticket_id ON audit_logs(ticket_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
