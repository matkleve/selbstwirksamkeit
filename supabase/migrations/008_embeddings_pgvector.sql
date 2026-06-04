CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

ALTER TABLE entries
  ADD COLUMN IF NOT EXISTS embedding extensions.vector(1536);

-- HNSW index (Supabase hosted); skip if extension ops unavailable
DO $$
BEGIN
  CREATE INDEX IF NOT EXISTS entries_embedding_idx
    ON entries USING hnsw (embedding extensions.vector_cosine_ops);
EXCEPTION
  WHEN undefined_object THEN
    RAISE NOTICE 'vector_cosine_ops not available — embedding column created without index';
END $$;
