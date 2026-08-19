select cron.schedule(
  'sndwch-expire-stale-manual-payments',
  '*/30 * * * *',
  $$
  select net.http_post(
    url := 'https://rjosezuoyngiadunfzyn.supabase.co/functions/v1/api',
    headers := jsonb_build_object('Content-Type','application/json'),
    body := jsonb_build_object('action','expire-stale-manual-payments','cronSecret','<CRON_SECRET_REDACTADO>')
  );
  $$
);
