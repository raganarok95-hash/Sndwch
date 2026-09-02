-- Vigilancia del propio sistema, cada hora (C1 + C2). Se registra DESPUÉS de que el CI
-- desplegó `alert-system-health`: al revés, sus primeros disparos habrían devuelto
-- "Acción desconocida" y el dead-man switch se habría acusado a sí mismo.
--
-- Minuto 37 a propósito: 20 de los 26 jobs disparan en :00, y amontonar uno más ahí solo
-- agrega contención en el minuto más cargado. Además este job LEE el resultado de los
-- otros, así que le conviene correr cuando ya terminaron, no a la vez.
select cron.schedule(
  'sndwch-alert-system-health',
  '37 * * * *',
  $job$
  select net.http_post(
    url := 'https://rjosezuoyngiadunfzyn.supabase.co/functions/v1/api',
    headers := jsonb_build_object('Content-Type','application/json'),
    body := jsonb_build_object('action','alert-system-health','cronSecret',(select decrypted_secret from vault.decrypted_secrets where name='sndwch_cron_secret'))
  );
  $job$
);

-- El propio job de vigilancia entra en la lista de vigilados (dead_cron_jobs lo detecta
-- solo, porque lleva 'action' en el cuerpo como los demás). Se siembra su latido para que
-- no se reporte muerto por los disparos que todavía no ocurrieron.
insert into public.cron_heartbeats (action, last_ok_at)
values ('alert-system-health', now())
on conflict (action) do nothing;
