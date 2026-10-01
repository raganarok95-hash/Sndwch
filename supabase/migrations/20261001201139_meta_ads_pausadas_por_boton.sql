-- El botón del panel que apaga los anuncios de Meta recuerda QUÉ campañas pausó él, para que
-- «Prender» reactive solo esas y no una campaña que el dueño había pausado a propósito.
alter table public.app_settings add column if not exists meta_ads_pausadas text[] not null default '{}';
alter table public.app_settings add column if not exists meta_ads_pausadas_at timestamptz;
