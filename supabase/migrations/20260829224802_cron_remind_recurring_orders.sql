-- Cron del aviso de pedido recurrente (automatización #60).
--
-- Cada media hora, en :05 y :35. Las recurrencias se guardan en franjas de :00 o :30 y el
-- aviso sale una hora antes, así que el cron tiene que pasar al menos una vez por cada media
-- hora para no saltarse ninguna. Los minutos 05/35 en vez de 00/30 por lo de siempre: 20 de
-- los 26 jobs disparan en punto.
--
-- El freno contra avisos repetidos NO está acá sino en la acción (`last_notified_at`, una vez
-- cada 20 h por recurrencia): el cron pasa dos veces por la misma franja objetivo y sin eso
-- mandaría el mismo aviso dos veces la misma tarde.
select cron.schedule(
  'sndwch-remind-recurring-orders',
  '5,35 * * * *',
  $$
  select net.http_post(
    url := 'https://rjosezuoyngiadunfzyn.supabase.co/functions/v1/api',
    headers := jsonb_build_object('Content-Type','application/json'),
    body := jsonb_build_object('action','remind-recurring-orders','cronSecret',(select decrypted_secret from vault.decrypted_secrets where name='sndwch_cron_secret'))
  );
  $$
);
