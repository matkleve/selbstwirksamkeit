-- Mirror sessions: records each time the user opens Mirror
CREATE TABLE IF NOT EXISTS mirror_sessions (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid REFERENCES auth.users ON DELETE CASCADE,
  created_at         timestamptz DEFAULT now(),
  pattern_found      boolean,
  pattern_type       text,
  signal_strength    text CHECK (signal_strength IN ('weak', 'moderate', 'strong') OR signal_strength IS NULL),
  entries_shown      text[],
  question_asked     text,
  user_response      text
);
ALTER TABLE mirror_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users own mirror sessions" ON mirror_sessions FOR ALL USING (auth.uid() = user_id);

-- Implementation intentions: Wenn-Dann pairs created after a Mirror session
CREATE TABLE IF NOT EXISTS implementation_intentions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES auth.users ON DELETE CASCADE,
  created_at      timestamptz DEFAULT now(),
  wenn_text       text NOT NULL,
  dann_text       text NOT NULL,
  wants_reminder  boolean DEFAULT false,
  reminder_type   text CHECK (reminder_type IN ('today', '3days', '7days', 'until_entry') OR reminder_type IS NULL),
  active          boolean DEFAULT true,
  fired_count     int DEFAULT 0,
  expires_at      timestamptz
);
ALTER TABLE implementation_intentions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users own intentions" ON implementation_intentions FOR ALL USING (auth.uid() = user_id);
