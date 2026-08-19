/*
# Add full_name column to profiles

1. Modified Tables
- `profiles`
  - Added `full_name` (text, nullable) — the customer's display name used in personalised AI responses and email greetings.

2. Security
- No policy changes. The existing `select_own_profile` / `update_own_profile` policies already allow users to read and update their own row, so no new RLS is required.

3. Notes
- Nullable so existing profile rows created by the signup trigger remain valid.
- The frontend will prompt the user for their name if it is missing, and store it here.
*/

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name text;
