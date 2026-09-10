-- LAS DOS AUTOMATIZACIONES QUE ESTABAN ESCRITAS, REGISTRADAS Y DOCUMENTADAS — Y NUNCA
-- CORRIERON NI UNA VEZ.
--
-- Encontrado el 2026-09-10 auditando qué automatizaciones sirven y cuáles no. `alert-admin-access`
-- y `send-retention-report` estaban en la tabla ACTIONS de `api`, con su código escrito, sus
-- pruebas y su parrafada en CLAUDE.md describiendo a qué hora corrían. Lo único que faltaba
-- era el `cron.schedule` que las dispara. Cero filas en `cron_heartbeats` para las dos: no es
-- que fallaran, es que nunca existieron.
--
-- ⚠ Y EL DEAD-MAN SWITCH NO PODÍA VERLO. `dead_cron_jobs()` cruza `cron.job` contra los
-- latidos para detectar un job que dispara y no llega. Un job que NUNCA SE CREÓ no está en
-- `cron.job`, así que no entra al cruce: la red de seguridad tiene su punto ciego
-- exactamente donde vive este defecto. Por eso la defensa nueva no es SQL sino un chequeo
-- del repo (`npm run check:crons`), que compara la tabla ACTIONS contra las migraciones.
--
-- ── POR QUÉ IMPORTA CADA UNA ──
--
-- `alert-admin-access` es SEGURIDAD. El bloqueo por intentos fallidos ya existía; lo que
-- faltaba era que el dueño SE ENTERE de que alguien está probando entrar a su panel. Sin el
-- cron, el aviso llevaba desde que se escribió sin sonar una sola vez.
--
-- `send-retention-report` es el reporte de cohortes, que CLAUDE.md llama "el mejor dato del
-- panel". Su problema nunca fue el cálculo sino que hay que acordarse de abrir la pantalla —
-- y el correo mensual, que era la solución, jamás se envió.
--
-- ── LOS HORARIOS ──
--
-- :53 para el aviso de acceso, en hora, como estaba documentado. No compite con el :00 donde
-- disparan la mayoría de los jobs, ni con el :37 de alert-system-health ni el :47 de
-- alert-card-declines, que son los otros dos horarios de vigilancia.
--
-- 13:40 UTC = 08:40 hora Lima del día 1, para el reporte mensual. Temprano, con la tienda
-- cerrada, y 25 minutos después del aviso de "toca cocinar" para no juntar dos correos.
-- MENSUAL y no semanal a propósito: una cohorte se mueve en meses, y un correo semanal con
-- el mismo número movido dos décimas se deja de abrir — y con él se pierde el mes en que sí
-- cambió.
select cron.schedule(
  'sndwch-alert-admin-access',
  '53 * * * *',
  $$
  select net.http_post(
    url := 'https://rjosezuoyngiadunfzyn.supabase.co/functions/v1/api',
    headers := jsonb_build_object('Content-Type','application/json'),
    body := jsonb_build_object('action','alert-admin-access','cronSecret',(select decrypted_secret from vault.decrypted_secrets where name='sndwch_cron_secret'))
  );
  $$
);

select cron.schedule(
  'sndwch-send-retention-report',
  '40 13 1 * *',
  $$
  select net.http_post(
    url := 'https://rjosezuoyngiadunfzyn.supabase.co/functions/v1/api',
    headers := jsonb_build_object('Content-Type','application/json'),
    body := jsonb_build_object('action','send-retention-report','cronSecret',(select decrypted_secret from vault.decrypted_secrets where name='sndwch_cron_secret'))
  );
  $$
);
