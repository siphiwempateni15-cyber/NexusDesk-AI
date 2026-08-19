/*
# Add user_id to tickets, create profiles table for role-based access

1. New Tables
- `profiles`
  - `id` (uuid, primary key, references auth.users)
  - `email` (text, not null)
  - `role` (text, not null, default 'customer') — 'admin' or 'customer'
  - `created_at` (timestamptz, default now())

2. Modified Tables
- `tickets`
  - Added `user_id` (uuid, nullable, references auth.users, default auth.uid())
  - Added index on tickets.user_id

3. Security
- Enable RLS on `profiles`.
- `profiles`: users can read their own profile; users can insert their own profile; users can update their own profile.
- `tickets` SELECT: authenticated users can see their own tickets; admins can see all tickets.
- `tickets` INSERT: authenticated users can insert tickets where user_id = auth.uid(); admins can insert any.
- `tickets` UPDATE: authenticated users can update their own tickets; admins can update any.
- `tickets` DELETE: admin-only.
- `audit_logs` SELECT: authenticated users can see logs for their own tickets; admins can see all.
- `audit_logs` INSERT: authenticated users can insert logs for their own tickets; admins can insert any.
- `approvals` SELECT: authenticated users can see approvals for their own tickets; admins can see all.
- `notification_log` SELECT: authenticated users can see notifications for their own tickets; admins can see all.
- Other CRUD on approvals/notification_log: admin-only (these are operational tables managed by the platform).

4. Notes
- The `user_id` column on tickets is nullable + DEFAULT auth.uid() so existing rows remain accessible.
- A trigger auto-creates a profile row when a new auth.users record is created, defaulting role to 'customer'.
- Admin role is assigned manually via SQL for specific users.
- The `is_admin()` SQL function checks if the current user has role='admin' in profiles.
*/

-- Step 1: Create profiles table (no policies yet)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'customer',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Step 2: Create is_admin function (references profiles table)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  );
$$;

-- Step 3: Enable RLS and add policies on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Step 4: Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'customer')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 5: Add user_id to tickets
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE tickets ALTER COLUMN user_id SET DEFAULT auth.uid();

CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id);

-- Step 6: Replace tickets policies
DROP POLICY IF EXISTS "anon_select_tickets" ON tickets;
DROP POLICY IF EXISTS "anon_insert_tickets" ON tickets;
DROP POLICY IF EXISTS "anon_update_tickets" ON tickets;
DROP POLICY IF EXISTS "anon_delete_tickets" ON tickets;

CREATE POLICY "select_tickets" ON tickets FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "insert_tickets" ON tickets FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "update_tickets" ON tickets FOR UPDATE
  TO authenticated USING (auth.uid() = user_id OR public.is_admin()) WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "delete_tickets" ON tickets FOR DELETE
  TO authenticated USING (public.is_admin());

-- Step 7: Replace audit_logs policies
DROP POLICY IF EXISTS "anon_select_audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "anon_insert_audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "anon_delete_audit_logs" ON audit_logs;

CREATE POLICY "select_audit_logs" ON audit_logs FOR SELECT
  TO authenticated USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.id = audit_logs.ticket_id AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "insert_audit_logs" ON audit_logs FOR INSERT
  TO authenticated WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.id = audit_logs.ticket_id AND t.user_id = auth.uid()
    )
  );

-- Step 8: Replace approvals policies
DROP POLICY IF EXISTS "anon_select_approvals" ON approvals;
DROP POLICY IF EXISTS "anon_insert_approvals" ON approvals;
DROP POLICY IF EXISTS "anon_update_approvals" ON approvals;
DROP POLICY IF EXISTS "anon_delete_approvals" ON approvals;

CREATE POLICY "select_approvals" ON approvals FOR SELECT
  TO authenticated USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.id = approvals.ticket_id AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "insert_approvals" ON approvals FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

CREATE POLICY "update_approvals" ON approvals FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "delete_approvals" ON approvals FOR DELETE
  TO authenticated USING (public.is_admin());

-- Step 9: Replace notification_log policies
DROP POLICY IF EXISTS "anon_select_notification_log" ON notification_log;
DROP POLICY IF EXISTS "anon_insert_notification_log" ON notification_log;
DROP POLICY IF EXISTS "anon_update_notification_log" ON notification_log;
DROP POLICY IF EXISTS "anon_delete_notification_log" ON notification_log;

CREATE POLICY "select_notification_log" ON notification_log FOR SELECT
  TO authenticated USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.id = notification_log.ticket_id AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "insert_notification_log" ON notification_log FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

CREATE POLICY "update_notification_log" ON notification_log FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "delete_notification_log" ON notification_log FOR DELETE
  TO authenticated USING (public.is_admin());
