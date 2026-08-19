
select cron.schedule(
  'sndwch-cleanup-debug-logs',
  '0 5 * * *', -- una vez al día
  $$ delete from public.debug_logs where created_at < now() - interval '30 days'; $$
);
