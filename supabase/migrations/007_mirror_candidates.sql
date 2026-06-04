CREATE TABLE IF NOT EXISTS mirror_candidates (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  entry_ids        uuid[] NOT NULL,
  source           text NOT NULL
    CHECK (source IN ('tag_frequency', 'grid_cluster', 'embedding_temporal', 'wgarm_ec')),
  signal_strength  text NOT NULL
    CHECK (signal_strength IN ('weak', 'moderate', 'strong')),
  intro_text       text,
  question         text,
  template_text    text,
  pattern_metadata jsonb,
  shown            boolean DEFAULT false,
  shown_at         timestamptz,
  user_reaction    text
    CHECK (user_reaction IN ('confirmed', 'dismissed') OR user_reaction IS NULL),
  created_at       timestamptz DEFAULT now()
);

ALTER TABLE mirror_candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users own candidates"
  ON mirror_candidates FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS mirror_candidates_user_unshown_idx
  ON mirror_candidates (user_id, shown, created_at DESC);
