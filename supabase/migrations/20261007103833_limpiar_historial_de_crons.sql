-- El historial de pg_cron (cron.job_run_details) nunca se limpiaba: 177 mil filas y 109 MB al
-- 2026-10-07, más de un tercio de la base (plan free, tope 500 MB). dead_cron_jobs() lo recorre
-- y a veces pasaba los 8 s de statement_timeout del rol de la API: la alarma de crons muertos
-- (alert-system-health) fallaba en silencio desde el 2026-09-30.
--
-- Las filas de más de 7 días se borraron por tandas el mismo día, antes de esta migración. Desde
-- acá, un job diario guarda solo 7 días: dead_cron_jobs mira como mucho desde el último latido o
-- 2 días atrás, y un job con el latido más viejo que 7 días sigue sumando disparos en la ventana.
select cron.schedule(
  'sndwch-cleanup-cron-history',
  '30 5 * * *', -- una vez al día, después de la limpieza de debug_logs (5:00)
  $$ delete from cron.job_run_details where end_time < now() - interval '7 days'; $$
);
