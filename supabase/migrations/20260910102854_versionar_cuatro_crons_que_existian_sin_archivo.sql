-- CUATRO CRONS QUE EXISTÍAN EN PRODUCCIÓN SIN NINGUNA MIGRACIÓN QUE LOS CREARA.
--
-- El reverso exacto del defecto que arregló la migración anterior, y encontrado por el
-- mismo chequeo nuevo (`npm run check:crons`). Allá había código sin cron; acá hay cron sin
-- código versionado: los cuatro jobs disparan hoy, están vivos y anotan sus latidos, pero
-- ninguna migración los crea.
--
-- ⚠ POR QUÉ NO ES COSMÉTICO. El plan de Supabase de esta cuenta es `free`, que NO tiene
-- respaldos automáticos, y el camino de restauración que este repo documenta es explícito:
-- "restaurar de verdad = aplicar las migraciones y después cargar los datos". Los datos
-- viajan en el respaldo diario; los cron jobs NO. O sea que el día del desastre —el único
-- día en que esto importa— la base volvería con sus pedidos y sus clientes intactos y
-- CUATRO automatizaciones apagadas, sin que nada lo dijera:
--
--   · expire-pending-charges      cada 3 min — libera cargos Culqi reservados que nadie pagó
--   · bounce-back-first-order     17:15 UTC  — el empujón al segundo pedido
--   · remind-lapsed-customers     16:23 UTC  — recuperación de clientes que dejaron de pedir
--   · remind-unclaimed-challenge  día 28     — el reto mensual sin reclamar
--
-- `cron.schedule` con un jobname que ya existe ACTUALIZA en vez de duplicar, así que aplicar
-- esto sobre la producción viva no cambia nada hoy: reescribe cada job con exactamente el
-- horario y el comando que ya tenía. Lo que gana es que a partir de ahora existan en el
-- historial versionado, que es lo único que se puede volver a aplicar.
--
-- Los horarios son los que están corriendo AHORA MISMO, leídos de `cron.job`, no
-- reconstruidos de memoria: reescribir uno "como debería ser" sería cambiar el
-- comportamiento en una migración que dice no cambiar nada.
select cron.schedule(
  'sndwch-expire-pending-charges',
  '*/3 * * * *',
  $$
  select net.http_post(
    url := 'https://rjosezuoyngiadunfzyn.supabase.co/functions/v1/api',
    headers := jsonb_build_object('Content-Type','application/json'),
    body := jsonb_build_object('action','expire-pending-charges','cronSecret',(select decrypted_secret from vault.decrypted_secrets where name='sndwch_cron_secret'))
  );
  $$
);

select cron.schedule(
  'sndwch-bounce-back-first-order',
  '17 15 * * *',
  $$
  select net.http_post(
    url := 'https://rjosezuoyngiadunfzyn.supabase.co/functions/v1/api',
    headers := jsonb_build_object('Content-Type','application/json'),
    body := jsonb_build_object('action','bounce-back-first-order','cronSecret',(select decrypted_secret from vault.decrypted_secrets where name='sndwch_cron_secret'))
  );
  $$
);

select cron.schedule(
  'sndwch-remind-lapsed-customers',
  '23 16 * * *',
  $$
  select net.http_post(
    url := 'https://rjosezuoyngiadunfzyn.supabase.co/functions/v1/api',
    headers := jsonb_build_object('Content-Type','application/json'),
    body := jsonb_build_object('action','remind-lapsed-customers','cronSecret',(select decrypted_secret from vault.decrypted_secrets where name='sndwch_cron_secret'))
  );
  $$
);

select cron.schedule(
  'sndwch-remind-unclaimed-challenge',
  '0 14 28 * *',
  $$
  select net.http_post(
    url := 'https://rjosezuoyngiadunfzyn.supabase.co/functions/v1/api',
    headers := jsonb_build_object('Content-Type','application/json'),
    body := jsonb_build_object('action','remind-unclaimed-challenge','cronSecret',(select decrypted_secret from vault.decrypted_secrets where name='sndwch_cron_secret'))
  );
  $$
);
