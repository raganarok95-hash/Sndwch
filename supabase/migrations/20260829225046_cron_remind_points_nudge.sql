-- Cron del empujón "te faltan N puntos" (automatización #64).
--
-- Semanal, los jueves 16:40 UTC = 11:40 hora Lima. Jueves a propósito: el empujón sirve para
-- que el cliente pida el fin de semana, y mandarlo un lunes le da cinco días para olvidarlo.
-- Antes del mediodía, cuando todavía puede decidir dónde almuerza.
--
-- Semanal y no diario porque los puntos suben despacio: el mismo cliente estaría a "te faltan
-- 40" durante días, y repetírselo cada mañana es la forma más rápida de que apague las
-- notificaciones. La acción además tiene un freno propio de 30 días por cliente y respeta
-- `phonesTouchedToday`, así que nunca se apila con otro aviso del mismo día.
select cron.schedule(
  'sndwch-remind-points-nudge',
  '40 16 * * 4',
  $$
  select net.http_post(
    url := 'https://rjosezuoyngiadunfzyn.supabase.co/functions/v1/api',
    headers := jsonb_build_object('Content-Type','application/json'),
    body := jsonb_build_object('action','remind-points-nudge','cronSecret',(select decrypted_secret from vault.decrypted_secrets where name='sndwch_cron_secret'))
  );
  $$
);
