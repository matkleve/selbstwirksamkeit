-- Mistral mistral-embed: vector(1024) + pg_net trigger → embed-entry Edge Function

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

DROP INDEX IF EXISTS public.entries_embedding_idx;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'entries'
      AND column_name = 'embedding'
  ) THEN
    UPDATE public.entries SET embedding = NULL WHERE embedding IS NOT NULL;
    ALTER TABLE public.entries
      ALTER COLUMN embedding TYPE extensions.vector(1024);
  ELSE
    ALTER TABLE public.entries
      ADD COLUMN embedding extensions.vector(1024);
  END IF;
END $$;

DO $$
BEGIN
  CREATE INDEX entries_embedding_idx
    ON public.entries USING hnsw (embedding extensions.vector_cosine_ops);
EXCEPTION
  WHEN undefined_object THEN
    CREATE INDEX entries_embedding_idx
      ON public.entries USING ivfflat (embedding extensions.vector_cosine_ops)
      WITH (lists = 100);
END $$;

-- Edge Function base URL (local dev: UPDATE to http://host.docker.internal:54321/functions/v1)
CREATE SCHEMA IF NOT EXISTS private;

CREATE TABLE IF NOT EXISTS private.embed_webhook (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  base_url text NOT NULL
);

INSERT INTO private.embed_webhook (id, base_url)
VALUES (1, 'https://zjkrxhoutpphmaykbygp.supabase.co/functions/v1')
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.enqueue_embed_entry()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, private
AS $$
DECLARE
  fn_url text;
BEGIN
  IF NEW.embedding IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT base_url || '/embed-entry' INTO fn_url FROM private.embed_webhook WHERE id = 1;

  PERFORM net.http_post(
    url := fn_url,
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object(
      'type', TG_OP,
      'record', jsonb_build_object(
        'id', NEW.id,
        'text', NEW.text,
        'person', NEW.person,
        'location', NEW.location,
        'activity', NEW.activity,
        'body_state', NEW.body_state
      )
    )
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS entries_embed_on_save ON public.entries;
CREATE TRIGGER entries_embed_on_save
  AFTER INSERT OR UPDATE ON public.entries
  FOR EACH ROW
  EXECUTE FUNCTION public.enqueue_embed_entry();
