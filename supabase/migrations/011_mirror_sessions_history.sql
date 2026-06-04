-- Mirror sessions v2: history, replay, favourites (spec: docs/specs/mirror-page.md §4)

ALTER TABLE mirror_sessions
  ADD COLUMN IF NOT EXISTS pattern_text text,
  ADD COLUMN IF NOT EXISTS intention_wenn text,
  ADD COLUMN IF NOT EXISTS intention_dann text,
  ADD COLUMN IF NOT EXISTS reminder_type text,
  ADD COLUMN IF NOT EXISTS is_favorited boolean NOT NULL DEFAULT false;

ALTER TABLE mirror_sessions DROP CONSTRAINT IF EXISTS mirror_sessions_reminder_type_check;
ALTER TABLE mirror_sessions
  ADD CONSTRAINT mirror_sessions_reminder_type_check
  CHECK (reminder_type IS NULL OR reminder_type IN ('today', '3days', 'week'));

-- anchor_entry_ids: migrate from legacy entries_shown (text[]) or add fresh
ALTER TABLE mirror_sessions ADD COLUMN IF NOT EXISTS anchor_entry_ids uuid[];

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'mirror_sessions'
      AND column_name = 'entries_shown'
  ) THEN
    UPDATE mirror_sessions
    SET anchor_entry_ids = entries_shown::uuid[]
    WHERE entries_shown IS NOT NULL AND anchor_entry_ids IS NULL;

    ALTER TABLE mirror_sessions DROP COLUMN entries_shown;
  END IF;
END $$;

-- If a prior partial migration renamed the column but left text[]
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'mirror_sessions'
      AND column_name = 'anchor_entry_ids'
      AND udt_name = '_text'
  ) THEN
    ALTER TABLE mirror_sessions
      ALTER COLUMN anchor_entry_ids TYPE uuid[]
      USING anchor_entry_ids::uuid[];
  END IF;
END $$;

UPDATE mirror_sessions
SET pattern_text = question_asked
WHERE pattern_text IS NULL AND question_asked IS NOT NULL;

ALTER TABLE mirror_sessions DROP COLUMN IF EXISTS pattern_found;
ALTER TABLE mirror_sessions DROP COLUMN IF EXISTS question_asked;

CREATE INDEX IF NOT EXISTS mirror_sessions_user_created_idx
  ON mirror_sessions (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS mirror_sessions_user_favorited_idx
  ON mirror_sessions (user_id, is_favorited DESC, created_at DESC);
