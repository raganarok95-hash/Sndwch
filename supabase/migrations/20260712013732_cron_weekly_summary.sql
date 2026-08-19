select cron.schedule(
  'sndwch-weekly-summary',
  '0 2 * * 1',
  $$
  select net.http_post(
    url := 'https://rjosezuoyngiadunfzyn.supabase.co/functions/v1/weekly-summary',
    headers := jsonb_build_object('Content-Type','application/json','x-cron-secret',(select decrypted_secret from vault.decrypted_secrets where name='sndwch_cron_secret')),
    body := '{}'::jsonb
  );
  $$
);
