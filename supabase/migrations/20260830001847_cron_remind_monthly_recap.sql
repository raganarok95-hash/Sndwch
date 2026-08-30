-- Cron del resumen mensual personal (automatización #65).
--
-- Los días 1 al 5 de cada mes a las 15:20 UTC = 10:20 hora Lima. Cinco días y no uno solo:
-- todos los crons de push de este proyecto cortan en MAX_PUSH_PER_RUN (200) por corrida, y
-- una corrida única dejaría sin resumen a todo cliente por encima de ese número hasta el mes
-- siguiente — cuando la ventana ya se movió y el suyo se perdió para siempre. Cada corrida
-- atiende solo a quien todavía no tiene la marca `monthly_recap_ym` del mes, así que la
-- segunda ya casi no encuentra a nadie y las demás terminan en cero.
--
-- 10:20 y no de madrugada: es un mensaje que se lee, no una alerta operativa, y a esa hora
-- la gente ya está pensando en el almuerzo.
select cron.schedule(
  'sndwch-remind-monthly-recap',
  '20 15 1-5 * *',
  $$
  select net.http_post(
    url := 'https://rjosezuoyngiadunfzyn.supabase.co/functions/v1/api',
    headers := jsonb_build_object('Content-Type','application/json'),
    body := jsonb_build_object('action','remind-monthly-recap','cronSecret',(select decrypted_secret from vault.decrypted_secrets where name='sndwch_cron_secret'))
  );
  $$
);
