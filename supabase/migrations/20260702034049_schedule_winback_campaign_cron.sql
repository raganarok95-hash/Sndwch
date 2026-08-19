
select cron.schedule(
  'sndwch-winback-campaign',
  '0 15 * * 1', -- lunes 15:00 UTC = 10:00 hora de Lima
  $$
  select net.http_post(
    url := 'https://rjosezuoyngiadunfzyn.supabase.co/functions/v1/winback-campaign',
    headers := jsonb_build_object('Content-Type','application/json','x-cron-secret','<CRON_SECRET_REDACTADO>'),
    body := '{}'::jsonb
  );
  $$
);
