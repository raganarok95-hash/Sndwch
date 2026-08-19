
select cron.schedule(
  'sndwch-birthday-bonus',
  '0 14 * * *', -- 14:00 UTC = 09:00 hora de Lima
  $$
  select net.http_post(
    url := 'https://rjosezuoyngiadunfzyn.supabase.co/functions/v1/birthday-bonus',
    headers := jsonb_build_object('Content-Type','application/json','x-cron-secret','<CRON_SECRET_REDACTADO>'),
    body := '{}'::jsonb
  );
  $$
);
