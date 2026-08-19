
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

select cron.schedule(
  'sndwch-daily-summary',
  '0 2 * * *', -- 02:00 UTC = 21:00 hora de Lima (UTC-5)
  $$
  select net.http_post(
    url := 'https://rjosezuoyngiadunfzyn.supabase.co/functions/v1/daily-summary',
    headers := jsonb_build_object('Content-Type','application/json','x-cron-secret','<CRON_SECRET_REDACTADO>'),
    body := '{}'::jsonb
  );
  $$
);
