-- La hora exacta de publicación y las historias de Instagram (2026-10-08).
-- GitHub atrasa sus horarios de 5 a 9 horas en este repo: la hora de publicar ya no puede ser la
-- hora en que corre el Revisor. Cada pieza lleva `publicar_desde` y el cron de Supabase (puntual,
-- cada 15 min) solo publica lo que ya llegó a su hora. Null = apenas esté programada (como antes).
alter table public.marketing_calendar add column publicar_desde timestamptz;
comment on column public.marketing_calendar.publicar_desde is
  'Desde cuándo puede publicarse. El cron auto-publish-calendar no la toma antes. Null = apenas esté scheduled.';

-- Feed (post, carrusel, Reel) o historia. La API de Instagram publica historias (media_type
-- STORIES) pero sin stickers: las historias se diseñan para funcionar sin ellos.
alter table public.marketing_calendar add column formato text not null default 'feed';
alter table public.marketing_calendar add constraint marketing_calendar_formato_check
  check (formato = any (array['feed'::text, 'historia'::text]));
comment on column public.marketing_calendar.formato is
  'feed (post, carrusel o Reel) o historia (Instagram, sin stickers: la API no los publica).';
