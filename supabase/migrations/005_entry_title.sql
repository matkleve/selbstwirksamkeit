-- Add editable title to entries (nullable; client shows "Eintrag #N" when null)
ALTER TABLE entries ADD COLUMN IF NOT EXISTS title text;
