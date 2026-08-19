-- Soporte de Reels/video en marketing_calendar (antes solo foto) + cola de clips
-- crudos que el dueño sube una vez por semana, para que una sesión programada los
-- procese (recorte/formato vía Adobe) y arme las entradas de calendario.

alter table marketing_calendar
  add column media_type text not null default 'image',
  add column video_url text;

alter table marketing_calendar
  add constraint marketing_calendar_media_type_check check (media_type in ('image', 'video'));

create table content_uploads (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null,
  mime text not null,
  uploaded_at timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending', 'processed', 'error')),
  notes text,
  error_message text,
  linked_calendar_id uuid references marketing_calendar(id),
  updated_at timestamptz not null default now()
);
alter table content_uploads enable row level security;
-- Sin policies: acceso exclusivo vía service_role desde `api` (subida) y vía la sesión
-- programada semanal, que usa las credenciales de administración del proyecto
-- directamente — mismo patrón default-deny que el resto de tablas internas.

-- Bucket privado — a diferencia de marketing-images (público, porque Meta debe poder
-- descargarlo), los clips crudos nunca se sirven directo a Meta; solo los lee la
-- sesión de procesamiento semanal antes de subir el resultado ya editado.
insert into storage.buckets (id, name, public) values ('content-uploads-raw', 'content-uploads-raw', false)
on conflict (id) do nothing;

-- Cron de auto-publicación: cada 15 min, publica solas las entradas ya aprobadas
-- (status='ready') cuya fecha programada ya llegó — antes esto exigía que alguien
-- tocara "Publicar ahora" a mano en el panel.
select cron.schedule(
  'sndwch-auto-publish-calendar',
  '*/15 * * * *',
  $$
  select net.http_post(
    url := 'https://rjosezuoyngiadunfzyn.supabase.co/functions/v1/api',
    headers := jsonb_build_object('Content-Type','application/json'),
    body := jsonb_build_object('action','auto-publish-calendar','cronSecret',(select decrypted_secret from vault.decrypted_secrets where name='sndwch_cron_secret'))
  );
  $$
);
