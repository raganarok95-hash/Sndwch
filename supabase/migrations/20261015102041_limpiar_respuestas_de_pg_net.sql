-- net._http_response (las respuestas que pg_net guarda de cada net.http_post de los crons) llegó
-- a 178 MB con 462 filas: sin autovacuum desde el 2026-08-05. La limpieza propia de pg_net
-- (DELETE ... WHERE created < now() - ttl ORDER BY created LIMIT n) recorre cada pocos segundos
-- las entradas muertas: 143 mil llamadas y 59 h de procesador. La instancia free se ahoga cada
-- noche (~19:00 a 2:00 de Lima, el 13 y el 14 de octubre): crons que no arrancan ("job startup
-- timeout") y una API de 50 a 150 s. postgres no es dueño de la tabla (no puede VACUUM), pero sí
-- puede TRUNCATE. Nada del repo lee esas respuestas y pg_net las borra a las 6 h de todos modos.
-- Autorizado por el dueño el 2026-10-15 («continúa hasta acabarlo»). Detalle: docs/ENTORNO.md.
--
-- Una vez al día, con la tienda cerrada (2:45 de Lima), para que no se vuelva a inflar.
select cron.schedule(
  'sndwch-limpiar-respuestas-net',
  '45 7 * * *',
  $$ truncate net._http_response; $$
);
-- Y ya mismo: un job de un solo uso que vacía la tabla y se borra a sí mismo. Corre dentro de la
-- base, así no depende de una conexión de afuera, que con la base ahogada se corta a los 60 s. Si
-- no consigue el lock, falla sin borrarse y lo intenta otra vez a los 5 minutos.
select cron.schedule(
  'sndwch-limpiar-respuestas-net-ya',
  '*/5 * * * *',
  $$ truncate net._http_response; select cron.unschedule('sndwch-limpiar-respuestas-net-ya'); $$
);
