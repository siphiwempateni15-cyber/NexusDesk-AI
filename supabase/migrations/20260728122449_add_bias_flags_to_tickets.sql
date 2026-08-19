/*
# Add bias_flags column to tickets

1. Modified Tables
- `tickets`
  - Added `bias_flags` (text[], nullable, default '{}') — stores the bias categories flagged by the AI classifier during ticket creation.

2. Security
- No policy changes. Existing ticket CRUD policies already cover the new column.

3. Notes
- Nullable with an empty-array default so existing rows remain valid.
- Populated by the frontend at ticket creation time from the classifier's bias check.
*/

ALTER TABLE tickets ADD COLUMN IF NOT EXISTS bias_flags text[] NOT NULL DEFAULT '{}';
