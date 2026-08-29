-- Cron de la alerta de caducidad de tanda (automatización #5).
--
-- 13:12 UTC = 08:12 hora Lima, a propósito ANTES de la hora de servicio: enterarse de que
-- una tanda venció sirve para cambiar lo que se va a armar hoy, y no sirve de nada a las
-- 8 de la noche. El minuto 12 y no el 00 porque 20 de los 26 jobs disparan en punto y
-- amontonarlos ahí es lo que ya obligó a mover `sndwch-alert-system-health` al minuto 37.
--
-- Va DESPUÉS del recordatorio de stock bajo (14:00 UTC) en importancia pero antes en el
-- reloj: quedarse sin insumo cuesta una venta, usar uno vencido cuesta bastante más.
select cron.schedule(
  'sndwch-alert-batch-expiry',
  '12 13 * * *',
  $$
  select net.http_post(
    url := 'https://rjosezuoyngiadunfzyn.supabase.co/functions/v1/api',
    headers := jsonb_build_object('Content-Type','application/json'),
    body := jsonb_build_object('action','alert-batch-expiry','cronSecret',(select decrypted_secret from vault.decrypted_secrets where name='sndwch_cron_secret'))
  );
  $$
);
