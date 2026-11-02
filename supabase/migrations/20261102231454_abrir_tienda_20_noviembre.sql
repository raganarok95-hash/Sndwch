-- Dueño, 2026-11-02: «Abrimos el 20 de noviembre» y «Apruebo los tres cambios» (la tienda abre sola).
-- El 20 de noviembre a las 6:00 de Lima (11:00 UTC) se prende business_launched (la puerta deja de decir
-- «Abrimos el 20 de noviembre» y la app toma pedidos dentro del horario de store_hours) y el lunes
-- vuelve a cerrado, como antes de las pruebas. El job se borra solo después de correr.
select cron.schedule(
  'sndwch-abrir-tienda-20-nov',
  '0 11 20 11 *',
  $job$
    update public.app_settings set business_launched = true where id = true;
    update public.store_hours set closed = true, open_hour = '11' where weekday = 1;
    select cron.unschedule('sndwch-abrir-tienda-20-nov');
  $job$
);
