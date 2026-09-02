-- Cron de la alerta de pedido programado sin insumo (automatización #26).
--
-- Cada hora en el minuto 22, no en punto: 20 de los 26 jobs disparan en :00 y amontonarlos
-- ahí ya obligó antes a mover `sndwch-alert-system-health` al :37 y la caducidad de tanda
-- al :12.
--
-- Horario y no diario a propósito: el valor de este aviso es el TIEMPO que deja para
-- reaccionar. Un pedido programado para las 8pm cuyo insumo se marcó agotado a las 5pm hay
-- que atenderlo esa misma tarde; enterarse al día siguiente no sirve de nada. La acción
-- tiene su propio freno (check_rate_limit, 1 aviso cada 3 horas por el mismo conjunto de
-- insumos), así que correr seguido no convierte la alerta en ruido.
select cron.schedule(
  'sndwch-alert-scheduled-shortfall',
  '22 * * * *',
  $$
  select net.http_post(
    url := 'https://rjosezuoyngiadunfzyn.supabase.co/functions/v1/api',
    headers := jsonb_build_object('Content-Type','application/json'),
    body := jsonb_build_object('action','alert-scheduled-shortfall','cronSecret',(select decrypted_secret from vault.decrypted_secrets where name='sndwch_cron_secret'))
  );
  $$
);
