CREATE TABLE IF NOT EXISTS email_secrets (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

ALTER TABLE email_secrets ENABLE ROW LEVEL SECURITY;

-- No policies = no access via anon/authenticated keys; only service role bypasses RLS
CREATE POLICY "service_role_all_email_secrets" ON email_secrets
  FOR ALL TO service_role USING (true) WITH CHECK (true);

INSERT INTO email_secrets (key, value) VALUES
  ('SMTP_HOST', 'smtp.gmail.com'),
  ('SMTP_PORT', '465'),
  ('SMTP_USER', 'siphiwempateni15@gmail.com'),
  ('SMTP_PASS', 'cprh twbl iwpt hbrd'),
  ('SMTP_FROM', 'NexusDesk AI <siphiwempateni15@gmail.com>')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
