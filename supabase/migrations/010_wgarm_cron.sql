-- Weekly WGARM-EC job: Sunday 03:00 UTC → run-wgarm-ec Edge Function

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'run-wgarm-ec-weekly') THEN
    PERFORM cron.unschedule((SELECT jobid FROM cron.job WHERE jobname = 'run-wgarm-ec-weekly'));
  END IF;
EXCEPTION
  WHEN undefined_table THEN
    RAISE NOTICE 'pg_cron not available — schedule run-wgarm-ec manually';
END $$;

DO $$
BEGIN
  PERFORM cron.schedule(
    'run-wgarm-ec-weekly',
    '0 3 * * 0',
    $cron$
    SELECT net.http_post(
      url := (SELECT base_url || '/run-wgarm-ec' FROM private.embed_webhook WHERE id = 1),
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := '{}'::jsonb
    ) AS request_id;
    $cron$
  );
EXCEPTION
  WHEN undefined_table THEN
    RAISE NOTICE 'pg_cron not available — schedule run-wgarm-ec manually';
  WHEN OTHERS THEN
    RAISE NOTICE 'cron.schedule failed: %', SQLERRM;
END $$;
