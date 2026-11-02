-- El código de Instagram se renueva solo (dueño, 2026-11-02: «Apruebo los tres cambios»).
-- El token de «Instagram con su propio inicio de sesión» dura 60 días. Sin renovarlo, a los dos
-- meses Instagram deja de publicar sin avisar. Cada domingo a las 4:10 de Lima (9:10 UTC) la
-- acción auto-renovar-instagram pide uno nuevo y lo guarda acá; publicar usa el de esta fila
-- y, si no hay fila, el secret INSTAGRAM_LOGIN_TOKEN. Solo la lee y escribe el servidor.
create table if not exists public.instagram_token (
  id boolean primary key default true check (id),
  token text not null,
  expires_at timestamptz,
  refreshed_at timestamptz not null default now()
);
alter table public.instagram_token enable row level security;
revoke all on table public.instagram_token from public, anon, authenticated;
grant select, insert, update, delete on table public.instagram_token to service_role;
select cron.schedule('sndwch-auto-renovar-instagram','10 9 * * 0',
  $$ select net.http_post(url := 'https://rjosezuoyngiadunfzyn.supabase.co/functions/v1/api',
     headers := jsonb_build_object('Content-Type','application/json'),
     body := jsonb_build_object('action','auto-renovar-instagram','cronSecret',(select decrypted_secret from vault.decrypted_secrets where name='sndwch_cron_secret'))); $$);
