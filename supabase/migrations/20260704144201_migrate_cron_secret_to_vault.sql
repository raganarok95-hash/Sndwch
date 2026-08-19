-- Mueve el secreto compartido de pg_cron (hoy hardcodeado como literal en 4 funciones y
-- en el propio cuerpo del cron job) a Supabase Vault. Ni el código fuente (que ahora se
-- puede comprometer a git de forma segura) ni el historial de cron.job vuelven a contener
-- el valor en texto plano — ambos lo obtienen vía RPC/subquery contra vault.decrypted_secrets.
select vault.create_secret(
  '<CRON_SECRET_REDACTADO>',
  'sndwch_cron_secret',
  'Secreto compartido para llamadas disparadas por pg_cron a daily-summary/birthday-bonus/winback-campaign/api(expire-stale-manual-payments). Rotado desde el literal hardcodeado anterior.'
);

create or replace function public.verify_cron_secret(p_secret text)
returns boolean
language sql
security definer
set search_path = public, vault
as $$
  select p_secret is not null and p_secret = (
    select decrypted_secret from vault.decrypted_secrets where name = 'sndwch_cron_secret'
  );
$$;
revoke all on function public.verify_cron_secret(text) from public;
grant execute on function public.verify_cron_secret(text) to service_role;

-- Reapunta los 4 cron jobs a buscar el secreto en Vault en vez de tener el literal en su propio texto.
select cron.unschedule('sndwch-daily-summary');
select cron.schedule('sndwch-daily-summary', '0 2 * * *', $$
  select net.http_post(
    url := 'https://rjosezuoyngiadunfzyn.supabase.co/functions/v1/daily-summary',
    headers := jsonb_build_object('Content-Type','application/json','x-cron-secret',(select decrypted_secret from vault.decrypted_secrets where name='sndwch_cron_secret')),
    body := '{}'::jsonb
  );
$$);

select cron.unschedule('sndwch-birthday-bonus');
select cron.schedule('sndwch-birthday-bonus', '0 14 * * *', $$
  select net.http_post(
    url := 'https://rjosezuoyngiadunfzyn.supabase.co/functions/v1/birthday-bonus',
    headers := jsonb_build_object('Content-Type','application/json','x-cron-secret',(select decrypted_secret from vault.decrypted_secrets where name='sndwch_cron_secret')),
    body := '{}'::jsonb
  );
$$);

select cron.unschedule('sndwch-winback-campaign');
select cron.schedule('sndwch-winback-campaign', '0 15 * * 1', $$
  select net.http_post(
    url := 'https://rjosezuoyngiadunfzyn.supabase.co/functions/v1/winback-campaign',
    headers := jsonb_build_object('Content-Type','application/json','x-cron-secret',(select decrypted_secret from vault.decrypted_secrets where name='sndwch_cron_secret')),
    body := '{}'::jsonb
  );
$$);

select cron.unschedule('sndwch-expire-stale-manual-payments');
select cron.schedule('sndwch-expire-stale-manual-payments', '*/30 * * * *', $$
  select net.http_post(
    url := 'https://rjosezuoyngiadunfzyn.supabase.co/functions/v1/api',
    headers := jsonb_build_object('Content-Type','application/json'),
    body := jsonb_build_object('action','expire-stale-manual-payments','cronSecret',(select decrypted_secret from vault.decrypted_secrets where name='sndwch_cron_secret'))
  );
$$);
