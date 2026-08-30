-- Cron del aviso de "toca cocinar" (automatización #2).
--
-- Diario a las 13:15 UTC = 08:15 hora Lima, ANTES de la hora de servicio y con el día por
-- delante. Cocinar por tandas significa que enterarse a las 8pm no se arregla: hay que
-- descongelar, limpiar, cocinar y enfriar. Un aviso por la noche llega para mañana en el
-- mejor de los casos.
--
-- Corre a diario pero la acción tiene su propio freno de 20 horas por combinación de
-- insumos, así que mientras el dueño todavía no cocina no se repite el mismo grito. Un
-- aviso repetido deja de leerse antes del día que importa — es el mismo criterio que ya
-- usa alert-scheduled-shortfall.
--
-- El :15 es a propósito: 20 de los 26 jobs disparan en :00 y este LEE stock e historial de
-- pedidos, así que le conviene no competir por la misma ventana.
select cron.schedule(
  'sndwch-alert-cook-now',
  '15 13 * * *',
  $$
  select net.http_post(
    url := 'https://rjosezuoyngiadunfzyn.supabase.co/functions/v1/api',
    headers := jsonb_build_object('Content-Type','application/json'),
    body := jsonb_build_object('action','alert-cook-now','cronSecret',(select decrypted_secret from vault.decrypted_secrets where name='sndwch_cron_secret'))
  );
  $$
);
