/*
# Create approvals and notification_log tables for Workflow Automation module

1. New Tables
- `approvals`
  - `id` (uuid, primary key)
  - `ticket_id` (uuid, references tickets on delete cascade)
  - `approver_role` (text, not null) — e.g. "IT Manager", "Finance Business Partner", "HR Director"
  - `department` (text) — department the approval belongs to
  - `status` (text, not null) — Pending, Approved, Rejected
  - `reason` (text) — optional note from approver
  - `priority` (text) — priority inherited from the ticket
  - `amount` (numeric, nullable) — monetary value if applicable (for finance approvals)
  - `created_at` (timestamptz, default now())
  - `resolved_at` (timestamptz, nullable) — when the approval was actioned
- `notification_log`
  - `id` (uuid, primary key)
  - `ticket_id` (uuid, nullable, references tickets on delete cascade)
  - `channel` (text, not null) — Email, SMS, In-App, Webhook
  - `recipient` (text, not null) — email address or role label
  - `subject` (text, not null) — notification subject line
  - `body` (text, not null) — notification body text
  - `status` (text, not null) — Queued, Sent, Delivered, Failed
  - `trigger` (text, not null) — what workflow triggered this (e.g. AUTO_ROUTE, ESCALATION, APPROVAL_REQUEST)
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS on both tables.
- Single-tenant (no sign-in) app: allow anon + authenticated full CRUD because data is intentionally shared/public.

3. Notes
- Indexes on approvals.status, approvals.ticket_id, notification_log.status, notification_log.ticket_id.
- Both tables cascade deletes on ticket removal.
*/

CREATE TABLE IF NOT EXISTS approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  approver_role text NOT NULL,
  department text,
  status text NOT NULL DEFAULT 'Pending',
  reason text,
  priority text NOT NULL DEFAULT 'Medium',
  amount numeric(12,2),
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_approvals" ON approvals;
CREATE POLICY "anon_select_approvals" ON approvals FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_approvals" ON approvals;
CREATE POLICY "anon_insert_approvals" ON approvals FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_approvals" ON approvals;
CREATE POLICY "anon_update_approvals" ON approvals FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_approvals" ON approvals;
CREATE POLICY "anon_delete_approvals" ON approvals FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_approvals_status ON approvals(status);
CREATE INDEX IF NOT EXISTS idx_approvals_ticket_id ON approvals(ticket_id);

CREATE TABLE IF NOT EXISTS notification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES tickets(id) ON DELETE CASCADE,
  channel text NOT NULL,
  recipient text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'Queued',
  trigger text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_notification_log" ON notification_log;
CREATE POLICY "anon_select_notification_log" ON notification_log FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_notification_log" ON notification_log;
CREATE POLICY "anon_insert_notification_log" ON notification_log FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_notification_log" ON notification_log;
CREATE POLICY "anon_update_notification_log" ON notification_log FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_notification_log" ON notification_log;
CREATE POLICY "anon_delete_notification_log" ON notification_log FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_notification_log_status ON notification_log(status);
CREATE INDEX IF NOT EXISTS idx_notification_log_ticket_id ON notification_log(ticket_id);
