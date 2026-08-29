-- Tres finales del embudo que hasta ahora no tenían dueño.
--
-- 1. PAGO ABANDONADO. Quien llegó a la pantalla de Culqi y no terminó era la abandonada de
--    mayor intención de todo el sistema, y la única sin seguimiento: `expire-pending-charges`
--    liberaba el inventario y ahí acababa. Cada 20 minutos, porque la reserva dura 10 y el
--    aviso sale recién a los 30 — así el pedido cae dentro de la ventana sin esperar horas.
-- 2. CRÉDITO SIN USAR. Plan Semanal, tarjetas de regalo y crédito regalado dejan saldo que
--    el negocio YA cobró. Se avisa una vez al día; el propio cron respeta 7 días de
--    inactividad y 21 entre recordatorios, así que la frecuencia del job no lo hace
--    insistente.
-- 3. POST-CANCELACIÓN. El único final del flujo que dejaba a alguien esperando comida que
--    no llegó, sin que nadie volviera a hablarle. Diario, y el cron manda recién a las 24 h
--    porque en el momento la persona está molesta.
--
-- Los tres pasan por customerRemindersEnabled(), así que no mandan nada hasta que el
-- negocio abra de verdad.
select cron.schedule(
  'sndwch-remind-abandoned-payment',
  '*/20 * * * *',
  $job$
  select net.http_post(
    url := 'https://rjosezuoyngiadunfzyn.supabase.co/functions/v1/api',
    headers := jsonb_build_object('Content-Type','application/json'),
    body := jsonb_build_object('action','remind-abandoned-payment','cronSecret',(select decrypted_secret from vault.decrypted_secrets where name='sndwch_cron_secret'))
  );
  $job$
);

select cron.schedule(
  'sndwch-remind-unused-credit',
  '13 16 * * *',
  $job$
  select net.http_post(
    url := 'https://rjosezuoyngiadunfzyn.supabase.co/functions/v1/api',
    headers := jsonb_build_object('Content-Type','application/json'),
    body := jsonb_build_object('action','remind-unused-credit','cronSecret',(select decrypted_secret from vault.decrypted_secrets where name='sndwch_cron_secret'))
  );
  $job$
);

select cron.schedule(
  'sndwch-remind-after-cancel',
  '41 15 * * *',
  $job$
  select net.http_post(
    url := 'https://rjosezuoyngiadunfzyn.supabase.co/functions/v1/api',
    headers := jsonb_build_object('Content-Type','application/json'),
    body := jsonb_build_object('action','remind-after-cancel','cronSecret',(select decrypted_secret from vault.decrypted_secrets where name='sndwch_cron_secret'))
  );
  $job$
);

-- Se siembra el latido de los tres para que dead_cron_jobs() no los reporte muertos por
-- los disparos que todavía no ocurrieron (mismo criterio que la migración del switch).
insert into public.cron_heartbeats (action, last_ok_at)
values ('remind-abandoned-payment', now()), ('remind-unused-credit', now()), ('remind-after-cancel', now())
on conflict (action) do nothing;
