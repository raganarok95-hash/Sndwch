-- Cron de la alerta de rechazo de tarjeta alto (automatización #32).
--
-- Cada hora en el minuto 47: los otros jobs propios de esta ronda están en :12 (caducidad de
-- tanda) y :22 (faltante de programados), y 20 de los 26 disparan en :00. Repartirlos evita
-- que una función tenga que atender cinco crons en el mismo segundo.
--
-- Horario y no diario porque el valor de esto es enterarse MIENTRAS pasa: si los pagos con
-- tarjeta están rotos, cada hora que pasa son ventas perdidas de una en una. La acción tiene
-- su propio freno (check_rate_limit, 1 aviso cada 3 h) y un mínimo de volumen, así que
-- correr seguido no la convierte en ruido.
select cron.schedule(
  'sndwch-alert-card-declines',
  '47 * * * *',
  $$
  select net.http_post(
    url := 'https://rjosezuoyngiadunfzyn.supabase.co/functions/v1/api',
    headers := jsonb_build_object('Content-Type','application/json'),
    body := jsonb_build_object('action','alert-card-declines','cronSecret',(select decrypted_secret from vault.decrypted_secrets where name='sndwch_cron_secret'))
  );
  $$
);
