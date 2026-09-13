-- Cron del freno por techo de CAC.
--
-- DIARIO y no horario, a las 09:05 hora Lima (14:05 UTC). El CAC se mide sobre 28 días: no se
-- mueve de una hora a otra, así que preguntarlo cada hora sería gastar invocaciones para leer
-- el mismo número. La alerta de rechazos de tarjeta sí es horaria porque ahí cada hora son
-- ventas perdidas de una en una; acá lo que se pierde se pierde a lo largo de días.
--
-- 09:05 porque es antes de la hora de servicio: si hay que apagar una campaña, conviene
-- decidirlo con el día por delante y no a las 8pm con pedidos entrando. El minuto :05 evita
-- el montón de jobs que disparan en :00.
--
-- La acción tiene sus propios frenos y por eso esto puede correr tranquilo: exige que el
-- número sea FIABLE (mínimo de conversiones de aprendizaje de Meta) antes de sonar, y
-- `check_rate_limit` la corta a 1 aviso por día. Mientras no haya gasto cargado en `ad_spend`
-- no dice nada — que es lo correcto: no hay campaña que frenar.
select cron.schedule(
  'sndwch-alert-cac-brake',
  '5 14 * * *',
  $$
  select net.http_post(
    url := 'https://rjosezuoyngiadunfzyn.supabase.co/functions/v1/api',
    headers := jsonb_build_object('Content-Type','application/json'),
    body := jsonb_build_object('action','alert-cac-brake','cronSecret',(select decrypted_secret from vault.decrypted_secrets where name='sndwch_cron_secret'))
  );
  $$
);
