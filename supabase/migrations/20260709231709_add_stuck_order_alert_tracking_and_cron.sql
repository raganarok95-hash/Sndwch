-- Rastrea si ya se avisó al dueño que un pedido lleva demasiado tiempo en RECIBIDO,
-- para que el cron de abajo no reenvíe la misma alerta cada vez que corre.
alter table public.orders add column if not exists alerted_stuck boolean not null default false;

-- Corre cada 5 min (mucho más seguido que el cron de pagos manuales cada 30 min) porque
-- el umbral de "pedido estancado" es de solo 10 minutos (mismo valor que ya usa el badge
-- visual del panel admin) — con 30 min de por medio la alerta llegaría demasiado tarde.
select cron.schedule(
  'sndwch-alert-stuck-orders',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := 'https://rjosezuoyngiadunfzyn.supabase.co/functions/v1/api',
    headers := jsonb_build_object('Content-Type','application/json'),
    body := jsonb_build_object('action','alert-stuck-orders','cronSecret',(select decrypted_secret from vault.decrypted_secrets where name='sndwch_cron_secret'))
  );
  $$
);
