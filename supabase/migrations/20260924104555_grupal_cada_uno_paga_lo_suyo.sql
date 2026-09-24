-- Pedido grupal · «Cerrar y pagar» = cada uno paga lo suyo (decisión del dueño, 2026-09-24).
-- Al cerrar, cada persona recibe su propio pedido Yape (sus productos + su parte del envío)
-- y el grupo pasa a 'splitting' hasta split_deadline. El cron expire-group-shares cancela
-- las partes que no se pagaron a tiempo y cierra el grupo. Ver actions/group.ts.
alter table public.group_orders add column if not exists split_deadline timestamptz;
create index if not exists idx_group_orders_splitting on public.group_orders(split_deadline) where status = 'splitting';

select cron.schedule(
  'sndwch-expire-group-shares',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := 'https://rjosezuoyngiadunfzyn.supabase.co/functions/v1/api',
    headers := jsonb_build_object('Content-Type','application/json'),
    body := jsonb_build_object('action','expire-group-shares','cronSecret',(select decrypted_secret from vault.decrypted_secrets where name='sndwch_cron_secret'))
  );
  $$
);
