select cron.schedule(
  'sndwch-remind-marketing-content',
  '0 13 * * 1',
  $$
  select net.http_post(
    url := 'https://rjosezuoyngiadunfzyn.supabase.co/functions/v1/api',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := jsonb_build_object(
      'action', 'remind-marketing-content',
      'cronSecret', (select decrypted_secret from vault.decrypted_secrets where name = 'sndwch_cron_secret')
    )
  );
  $$
);
