select cron.schedule(
  'sndwch-cleanup-rate-limits',
  '15 5 * * *',
  $$ select public.cleanup_old_rate_limits(); $$
);
