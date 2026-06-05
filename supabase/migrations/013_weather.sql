-- Add weather field to entries
ALTER TABLE entries ADD COLUMN IF NOT EXISTS weather text;

-- Allowed values enforced at application layer:
-- sunny | partly_cloudy | cloudy | rainy | snowy | stormy | foggy
